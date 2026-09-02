import { apiRequest } from "./apiClient";

/**
 * True end-to-end encryption for chat messages: each user generates an ECDH
 * (P-256) keypair in their own browser. The private key never leaves this
 * device (persisted only in localStorage) and is never sent to the server —
 * the server's "public key" endpoints are purely a directory, like a phone
 * book. Two parties derive the same AES-256 shared secret from
 * (my private key, their public key) via ECDH, without ever transmitting the
 * secret itself. Every message is encrypted with AES-GCM client-side before
 * the POST request is made; the server only ever stores/relays ciphertext.
 *
 * Key backup/recovery: the private key is also wrapped (AES-GCM) with a key
 * derived from the user's own password via PBKDF2 and uploaded as ciphertext
 * the server can store but never decrypt (see recoverOrRegisterKeys below).
 * Logging in with the correct password on a different browser/origin/device
 * recovers the exact same private key instead of minting a new one, so
 * historical messages stay decryptable everywhere that account logs in.
 * The one gap: a "forgot password" reset can't recover the old key (nothing
 * can derive the old wrapping key without the old password) — that case
 * mints a fresh key backed up under the new password, same as a brand-new
 * account.
 */

const PRIVATE_KEY_STORAGE_PREFIX = "solace.e2ee.privateKey.";
const ECDH_PARAMS = { name: "ECDH", namedCurve: "P-256" };
// OWASP-recommended minimum for PBKDF2-SHA256 as of 2023.
const PBKDF2_ITERATIONS = 210_000;

let cachedKeyPair: CryptoKeyPair | null = null;
let keysReadyForUserId: string | null = null;

function toBase64(buffer: ArrayBuffer): string {
  let binary = "";
  new Uint8Array(buffer).forEach((byte) => (binary += String.fromCharCode(byte)));
  return btoa(binary);
}

function fromBase64(b64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

let inFlightRegistration: { userId: string; promise: Promise<void> } | null = null;

// Salt just needs to be unique per user, not secret — a stable value already
// known to both the client (deriving) and nobody else needing to guess it
// works fine; the userId is perfect and requires no extra storage/fetch.
async function deriveWrappingKey(password: string, userId: string): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: new TextEncoder().encode(userId), iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

async function wrapPrivateKey(wrappingKey: CryptoKey, privateJwk: JsonWebKey): Promise<{ ciphertext: string; iv: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(JSON.stringify(privateJwk));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, wrappingKey, encoded);
  return { ciphertext: toBase64(encrypted), iv: toBase64(iv.buffer as ArrayBuffer) };
}

async function unwrapPrivateKey(wrappingKey: CryptoKey, ciphertext: string, iv: string): Promise<JsonWebKey> {
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64(iv) },
    wrappingKey,
    fromBase64(ciphertext),
  );
  return JSON.parse(new TextDecoder().decode(decrypted)) as JsonWebKey;
}

// Shared by both entry points below so the *entire* load-or-recover-or-generate
// decision is one atomic unit. This used to be split — recoverOrRegisterKeys
// did its (network-latency-bound) recovery work BEFORE ever touching
// inFlightRegistration, only routing through the lock at its very end. That
// left a real window where a concurrent plain ensureKeysRegistered call (e.g.
// AppDataContext's mount effect, firing right after login's navigate()) saw
// an empty localStorage, generated its OWN throwaway key, and registered
// THAT as the public key — so by the time recovery finished and wrote the
// correct recovered key to localStorage, the trailing ensureKeysRegistered
// call inside it just no-opped (keysReadyForUserId was already set by the
// race winner), leaving cachedKeyPair/the server's public key on the wrong
// key even though localStorage now had the right one. Routing every caller
// through one lock, held for the whole operation, closes that window.
async function setUpKeys(userId: string, token: string | null, password: string | null): Promise<void> {
  const storageKey = PRIVATE_KEY_STORAGE_PREFIX + userId;
  let stored = localStorage.getItem(storageKey);
  const wrappingKey = password ? await deriveWrappingKey(password, userId) : null;

  // Checked up front (not just "when local storage is empty") so an account
  // that already had a local key before this feature existed — the common
  // case for every account that predates today — still gets backed up the
  // next time it logs in with a password, instead of silently staying
  // unrecoverable forever just because it never needed recovery *yet*.
  const backup = wrappingKey
    ? await apiRequest<{ ciphertext: string; iv: string }>("/users/me/encrypted-private-key", { token }).catch(() => null)
    : null;

  if (!stored && backup && wrappingKey) {
    try {
      const privateJwk = await unwrapPrivateKey(wrappingKey, backup.ciphertext, backup.iv);
      localStorage.setItem(storageKey, JSON.stringify(privateJwk));
      stored = JSON.stringify(privateJwk);
    } catch {
      // Backup exists but doesn't unwrap under this password (e.g. it
      // predates a forgot-password reset) — treated exactly like "no
      // backup" below: mint a fresh key, backed up under the current
      // password.
    }
  }

  let privateJwk: JsonWebKey;
  if (stored) {
    privateJwk = JSON.parse(stored) as JsonWebKey;
  } else {
    const generated = await crypto.subtle.generateKey(ECDH_PARAMS, true, ["deriveKey", "deriveBits"]);
    privateJwk = await crypto.subtle.exportKey("jwk", generated.privateKey);
    localStorage.setItem(storageKey, JSON.stringify(privateJwk));
  }

  // No backup existed yet for whatever key we're about to use (brand new, or
  // a pre-existing local key from before this feature shipped) — create one
  // now. Skipped only when a backup already existed and was actually used
  // to recover above (nothing changed, re-uploading would be redundant).
  if (wrappingKey && !backup) {
    const wrapped = await wrapPrivateKey(wrappingKey, privateJwk);
    await apiRequest("/users/me/encrypted-private-key", { method: "PUT", token, body: wrapped }).catch(() => {});
  }

  const privateKey = await crypto.subtle.importKey("jwk", privateJwk, ECDH_PARAMS, true, ["deriveKey", "deriveBits"]);
  // An EC private-key JWK is just the public JWK plus the "d" scalar — strip
  // it to get the public key back out, no separate storage needed.
  const { d: _d, ...publicJwk } = privateJwk;
  const publicKey = await crypto.subtle.importKey("jwk", { ...publicJwk, key_ops: [] }, ECDH_PARAMS, true, []);

  cachedKeyPair = { privateKey, publicKey };

  await apiRequest("/users/me/public-key", {
    method: "PUT",
    token,
    body: { publicKey: JSON.stringify(publicJwk) },
  }).catch(() => {});

  keysReadyForUserId = userId;
}

// Several call sites (AppDataContext's mount effect, sendMessage, fetchThread,
// the Messages pages' own effects, plus login/register's recovery call) can
// all fire within the same tick right after login, before keysReadyForUserId
// is set. Without this guard each one independently reads localStorage, sees
// no key yet, and generates its own — whichever's localStorage write and
// server PUT happen to finish last "wins," possibly leaving a private key
// locally that doesn't match the public key actually registered on the
// server, permanently breaking decryption. Concurrent callers now await the
// same single in-flight setup instead of racing.
function runKeySetup(userId: string, token: string | null, password: string | null): Promise<void> {
  if (keysReadyForUserId === userId && cachedKeyPair) return Promise.resolve();

  if (inFlightRegistration && inFlightRegistration.userId === userId) {
    return inFlightRegistration.promise;
  }

  const promise = setUpKeys(userId, token, password);
  inFlightRegistration = { userId, promise };
  return promise.finally(() => {
    if (inFlightRegistration?.promise === promise) inFlightRegistration = null;
  });
}

/**
 * Call once, right after a password-based login/register succeeds — the
 * plaintext password only ever exists in memory for this one moment, and
 * it's what lets a key survive a switch to a different browser/origin/device.
 * If this origin doesn't already have a local private key, recovers the
 * SAME key this account has always used (via the server-stored, password-
 * wrapped backup) instead of minting a new one and orphaning every message
 * encrypted under the old key. Falls back to generating+backing up a fresh
 * key when no backup exists yet (first-ever login) or an old backup can't be
 * unwrapped (wrapped under a password this account no longer has, e.g. after
 * a forgot-password reset — nothing can recover that one, by design).
 */
export function recoverOrRegisterKeys(userId: string, password: string, token: string | null): Promise<void> {
  return runKeySetup(userId, token, password);
}

/**
 * Loads (or generates) this browser's keypair for the given user and makes
 * sure the server's public-key directory is up to date. Call once per login
 * session before sending/decrypting anything. Idempotent and cheap to re-run.
 */
export function ensureKeysRegistered(userId: string, token: string | null): Promise<void> {
  return runKeySetup(userId, token, null);
}

// Deliberately not cached (was, until a real bug: caching the other party's
// public key for the tab's whole lifetime meant a stale key never got
// re-fetched if they ever re-registered a new one — e.g. cleared storage or
// logged in from a different device/origin — silently breaking decryption
// for everyone still holding the old cached key. Only called once per
// thread-load/send (see AppDataContext), not per message, so re-fetching
// fresh every time is cheap and guarantees correctness over a
// micro-optimization that isn't safe to make.
async function getOtherPartyPublicKey(otherUserId: string, token: string | null): Promise<CryptoKey | null> {
  try {
    const response = await apiRequest<{ publicKey: string }>(`/users/${otherUserId}/public-key`, { token });
    const jwk = JSON.parse(response.publicKey) as JsonWebKey;
    return await crypto.subtle.importKey("jwk", jwk, ECDH_PARAMS, true, []);
  } catch {
    // The other party hasn't logged in since encrypted messaging shipped, or
    // has no key registered yet — nothing to derive a shared secret from.
    return null;
  }
}

/** Returns null if either side has no key material available yet. */
export async function getSharedKey(otherUserId: string, token: string | null): Promise<CryptoKey | null> {
  if (!cachedKeyPair) return null;

  const theirPublicKey = await getOtherPartyPublicKey(otherUserId, token);
  if (!theirPublicKey) return null;

  return crypto.subtle.deriveKey(
    { name: "ECDH", public: theirPublicKey },
    cachedKeyPair.privateKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptText(sharedKey: CryptoKey, plaintext: string): Promise<{ ciphertext: string; iv: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, sharedKey, encoded);
  return { ciphertext: toBase64(encrypted), iv: toBase64(iv.buffer as ArrayBuffer) };
}

export async function decryptText(sharedKey: CryptoKey, ciphertext: string, iv: string): Promise<string> {
  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: fromBase64(iv) },
      sharedKey,
      fromBase64(ciphertext),
    );
    return new TextDecoder().decode(decrypted);
  } catch (err) {
    // Temporary diagnostic: distinguishes "wrong key" (AES-GCM auth tag
    // failure — the expected shape of a genuinely lost-key message) from any
    // other failure (malformed input, wrong key length, etc.) that would
    // point to an actual bug rather than an unrecoverable key mismatch.
    console.error("[e2ee] decryptText failed:", err, { ciphertextLen: ciphertext.length, ivLen: iv.length });
    return "[Unable to decrypt this message]";
  }
}

/** Called on logout so a different user logging in on the same browser doesn't inherit cached key material. */
export function clearKeys(): void {
  cachedKeyPair = null;
  keysReadyForUserId = null;
  inFlightRegistration = null;
}
