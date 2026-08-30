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
 * Known limitation: there's no key-backup/recovery flow. If a user clears
 * browser storage or logs in on a new device, they get a fresh keypair —
 * new messages work immediately (the other party just encrypts against the
 * new public key), but historical messages encrypted under the old key can
 * no longer be decrypted from the new device.
 */

const PRIVATE_KEY_STORAGE_PREFIX = "solace.e2ee.privateKey.";
const ECDH_PARAMS = { name: "ECDH", namedCurve: "P-256" };

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

/**
 * Loads (or generates) this browser's keypair for the given user and makes
 * sure the server's public-key directory is up to date. Call once per login
 * session before sending/decrypting anything. Idempotent and cheap to re-run.
 */
export async function ensureKeysRegistered(userId: string, token: string | null): Promise<void> {
  if (keysReadyForUserId === userId && cachedKeyPair) return;

  // Several call sites (AppDataContext's mount effect, sendMessage,
  // fetchThread, the Messages pages' own effects) can all fire within the
  // same tick right after login, before keysReadyForUserId is set. Without
  // this guard each one independently reads localStorage, sees no key yet,
  // and generates its own — whichever's localStorage write and server PUT
  // happen to finish last "wins," possibly leaving a private key locally
  // that doesn't match the public key actually registered on the server,
  // permanently breaking decryption. Concurrent callers now await the same
  // single in-flight generation/registration instead of racing.
  if (inFlightRegistration && inFlightRegistration.userId === userId) {
    return inFlightRegistration.promise;
  }

  const promise = (async () => {
    const storageKey = PRIVATE_KEY_STORAGE_PREFIX + userId;
    const stored = localStorage.getItem(storageKey);

    let privateJwk: JsonWebKey;
    if (stored) {
      privateJwk = JSON.parse(stored) as JsonWebKey;
    } else {
      const generated = await crypto.subtle.generateKey(ECDH_PARAMS, true, ["deriveKey", "deriveBits"]);
      privateJwk = await crypto.subtle.exportKey("jwk", generated.privateKey);
      localStorage.setItem(storageKey, JSON.stringify(privateJwk));
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
  })();

  inFlightRegistration = { userId, promise };
  try {
    await promise;
  } finally {
    if (inFlightRegistration?.promise === promise) inFlightRegistration = null;
  }
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
  } catch {
    return "[Unable to decrypt this message]";
  }
}

/** Called on logout so a different user logging in on the same browser doesn't inherit cached key material. */
export function clearKeys(): void {
  cachedKeyPair = null;
  keysReadyForUserId = null;
  inFlightRegistration = null;
}
