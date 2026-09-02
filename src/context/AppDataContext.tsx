import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { listenerApplications as seedApplications } from "../data/mockData";
import type {
  ChatMessage,
  ListenerApplication,
  ListenerEarnings,
  LiveSession,
  MessageReaction,
  Transaction,
} from "../types";
import { useAuth } from "./AuthContext";
import { apiRequest, ApiError, resolveWsUrl } from "../lib/apiClient";
import { ensureKeysRegistered, getSharedKey, encryptText, decryptText } from "../lib/e2ee";
import ToastStack, { type ChatToast } from "../components/ToastStack";

// Live, in-session-only signal for a conversation-list row: not persisted,
// not restored on reload — purely "something happened here since I last
// looked," matching the ask for real-time behavior specifically (like a
// chat app's live badge), not a durable unread-count feature.
export interface LiveThreadUpdate {
  preview: string;
  at: string;
  unreadCount: number;
}

interface AppDataContextValue {
  walletBalance: number;
  transactions: Transaction[];
  applications: ListenerApplication[];
  conversations: Record<string, ChatMessage[]>;
  listenerPresence: Record<string, boolean>;
  liveSessions: Record<string, LiveSession>;
  incomingSessionRequest: LiveSession | null;
  heldSessionRequests: LiveSession[];
  liveThreadUpdates: Record<string, LiveThreadUpdate>;
  liveListenerRatings: Record<string, { rating: number; reviewCount: number }>;
  updateListenerRating: (listenerId: string, rating: number, reviewCount: number) => void;
  createRechargeOrder: (
    amount: number,
    couponCode?: string,
  ) => Promise<{ razorpayOrderId: string; amount: number; currency: string; keyId: string }>;
  verifyRechargePayment: (payload: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) => Promise<{ balance: number; bonusApplied: number }>;
  loadConversation: (otherPartyId: string) => void;
  setActiveThread: (otherPartyId: string | null) => void;
  sendMessage: (otherPartyId: string, text: string, replyToMessageId?: string) => Promise<void>;
  setReaction: (otherPartyId: string, messageId: string, emoji: string) => Promise<void>;
  requestSession: (listenerId: string) => Promise<LiveSession>;
  acceptSessionRequest: (sessionId: string) => Promise<LiveSession>;
  rejectSessionRequest: (sessionId: string) => Promise<void>;
  joinSession: (sessionId: string, otherPartyId: string) => Promise<LiveSession>;
  endLiveSession: (sessionId: string, otherPartyId: string) => Promise<LiveSession>;
  loadCurrentSession: (otherPartyId: string) => Promise<void>;
  holdSessionRequest: (sessionId: string) => void;
  approveApplication: (id: string) => void;
  rejectApplication: (id: string) => void;
  listenerOnline: boolean;
  toggleListenerOnline: () => void;
  listenerEarnings: ListenerEarnings;
  refreshEarnings: () => void;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

interface RawMessage {
  id: string;
  sender: "speaker" | "listener";
  ciphertext: string;
  iv: string;
  delivered: boolean;
  read: boolean;
  replyToMessageId: string | null;
  reactions: MessageReaction[];
  createdAt: string;
}

interface RawWalletTransaction {
  id: string;
  type: "CREDIT" | "DEBIT";
  reason: string;
  amount: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
}

// replyTo is deliberately left unset here — the server only ever gives us
// the replied-to message's id (see Message.replyTo on the backend; it never
// needs that message's plaintext), so a preview can only be attached once
// the referenced message has ALSO been decrypted. Callers do that in a
// second pass once every message they have available is decrypted (see
// fetchThread) or by looking it up in already-loaded local state (see the
// WS "message" handler below).
async function toChatMessage(message: RawMessage, sharedKey: CryptoKey | null): Promise<ChatMessage> {
  const text = sharedKey
    ? await decryptText(sharedKey, message.ciphertext, message.iv)
    : "[Encrypted message]";
  return {
    id: message.id,
    sender: message.sender,
    text,
    time: new Date(message.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    createdAt: message.createdAt,
    status: message.read ? "read" : message.delivered ? "delivered" : "sent",
    reactions: message.reactions,
  };
}

function attachReplyPreview(message: ChatMessage, replyToMessageId: string | null, byId: Map<string, ChatMessage>): ChatMessage {
  if (!replyToMessageId) return message;
  const original = byId.get(replyToMessageId);
  return {
    ...message,
    replyTo: original ? { id: original.id, text: original.text, sender: original.sender } : null,
  };
}

function toTransaction(t: RawWalletTransaction): Transaction {
  return {
    id: t.id,
    title: t.description,
    subtitle: new Date(t.createdAt).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }),
    amount: Number(t.amount),
    direction: t.type === "CREDIT" ? "credit" : "debit",
    icon: t.reason === "SESSION_CHARGE" || t.reason === "SESSION_EARNING" ? "session" : "wallet",
  };
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { user, token } = useAuth();
  const [walletBalance, setWalletBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [applications, setApplications] = useState<ListenerApplication[]>(seedApplications);
  const [conversations, setConversations] = useState<Record<string, ChatMessage[]>>({});
  const [listenerPresence, setListenerPresence] = useState<Record<string, boolean>>({});
  // Keyed by "the other party's user id" — mirrors `conversations`, so a
  // speaker's map is keyed by listenerId and a listener's by speakerId.
  const [liveSessions, setLiveSessions] = useState<Record<string, LiveSession>>({});
  // The WebSocket effect below only runs once per [user, token] — its
  // closure would otherwise see whatever liveSessions was at socket-creation
  // time forever. Kept in sync via the effect right after this declaration.
  const liveSessionsRef = useRef<Record<string, LiveSession>>({});
  // Every REQUESTED session currently awaiting this listener's response — a
  // real queue, not just "the most recent one," so a second request arriving
  // (or a reload) doesn't silently lose track of one already waiting.
  const [incomingSessionQueue, setIncomingSessionQueue] = useState<LiveSession[]>([]);
  // Requests the listener chose "Hold for Later" on — still in the queue,
  // just not the one shown in the blocking modal right now.
  const [heldRequestIds, setHeldRequestIds] = useState<Set<string>>(new Set());

  const removeFromIncomingQueue = (sessionId: string) => {
    setIncomingSessionQueue((prev) => prev.filter((s) => s.id !== sessionId));
    setHeldRequestIds((prev) => {
      if (!prev.has(sessionId)) return prev;
      const next = new Set(prev);
      next.delete(sessionId);
      return next;
    });
  };
  const loadedThreads = useRef<Set<string>>(new Set());
  // Ref, not state — read from inside the WebSocket handler's closure, which
  // is set up once and would otherwise never see updates to "which thread is
  // currently open on screen."
  const activeThreadRef = useRef<string | null>(null);
  const [listenerOnline, setListenerOnline] = useState(false);
  const [listenerEarnings, setListenerEarnings] = useState<ListenerEarnings>({
    today: 0,
    week: 0,
    month: 0,
    lifetime: 0,
    chart: [],
  });
  const [liveThreadUpdates, setLiveThreadUpdates] = useState<Record<string, LiveThreadUpdate>>({});
  const [toasts, setToasts] = useState<ChatToast[]>([]);
  // A speaker's own action (rating a listener) should reflect in their own
  // UI immediately — no WS push involved, this is just "I just did this,
  // show me the result now" rather than another user's real-time activity.
  const [liveListenerRatings, setLiveListenerRatings] = useState<Record<string, { rating: number; reviewCount: number }>>({});

  const dismissToast = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const updateListenerRating = (listenerId: string, rating: number, reviewCount: number) => {
    setLiveListenerRatings((prev) => ({ ...prev, [listenerId]: { rating, reviewCount } }));
  };

  useEffect(() => {
    liveSessionsRef.current = liveSessions;
  }, [liveSessions]);

  // Generates/loads this browser's E2EE keypair and registers the public
  // half with the server as early as possible after login — fetchThread and
  // sendMessage also call this defensively, but doing it here up front
  // avoids any visible delay the first time a chat is opened.
  useEffect(() => {
    if (!user || !token) return;
    ensureKeysRegistered(user.id, token).catch(() => {});
  }, [user, token]);

  useEffect(() => {
    if (user?.role !== "listener") return;
    apiRequest<{ availability: { online: boolean } }>("/listener/availability", { token })
      .then((response) => setListenerOnline(response.availability.online))
      .catch(() => {});
  }, [user?.role, token]);

  // Loads the full queue of requests still awaiting a response — catches
  // anything that arrived while the listener wasn't connected yet, and
  // restores held requests after a reload; live ones after this are handled
  // by the WebSocket SESSION_REQUESTED push.
  useEffect(() => {
    if (user?.role !== "listener") return;
    apiRequest<{ data: LiveSession[] }>("/listener/sessions/requests", { token })
      .then((response) => setIncomingSessionQueue(response.data))
      .catch(() => {});
  }, [user?.role, token]);

  // Both speakers and listeners have a real Wallet row (a speaker's balance
  // decreases from session charges, a listener's increases from earnings) —
  // one real wallet per user, same shared display state either way.
  const walletBasePath = user?.role === "listener" ? "/listener/wallet" : "/speaker/wallet";

  const refreshWallet = () => {
    if (!user) return;
    apiRequest<{ balance: number }>(walletBasePath, { token })
      .then((response) => setWalletBalance(Number(response.balance)))
      .catch(() => {});
    apiRequest<{ data: RawWalletTransaction[] }>(`${walletBasePath}/transactions`, { token })
      .then((response) => setTransactions(response.data.map(toTransaction)))
      .catch(() => {});
  };

  useEffect(() => {
    refreshWallet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role, token]);

  // Unlike walletBalance (kept fresh in real time by the WALLET_UPDATED push
  // below), this had no refresh trigger at all beyond the one-time fetch on
  // login — a session completing (crediting SESSION_EARNING to the same
  // wallet) never updated it, so the dashboard's Today/Week/Month/Lifetime
  // stats went stale for the rest of the session. Re-fetched from the
  // WALLET_UPDATED handler for exactly that reason.
  const refreshEarnings = () => {
    if (user?.role !== "listener") return;
    apiRequest<ListenerEarnings>("/listener/earnings", { token })
      .then(setListenerEarnings)
      .catch(() => {});
  };

  useEffect(() => {
    refreshEarnings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role, token]);

  const conversationsBasePath = user?.role === "listener" ? "/listener/conversations" : "/speaker/conversations";
  const sessionsBasePath = user?.role === "listener" ? "/listener/sessions" : "/speaker/sessions";

  // Fetching a thread's history is also how the backend learns "I've seen
  // this" — GET .../messages marks the other party's messages as read and
  // notifies them. Used both for the first open (loadConversation) and to
  // re-mark-read when a live message arrives while the thread is already
  // the one on screen (see the WebSocket handler below).
  const fetchThread = async (otherPartyId: string) => {
    if (!user) return;
    try {
      await ensureKeysRegistered(user.id, token);
      const sharedKey = await getSharedKey(otherPartyId, token);
      const response = await apiRequest<{ data: RawMessage[] }>(`${conversationsBasePath}/${otherPartyId}/messages`, { token });
      const base = await Promise.all(response.data.map((m) => toChatMessage(m, sharedKey)));
      // A reply can only ever target an earlier message in this same thread,
      // so by the time this second pass runs, every message it could
      // possibly reference is already decrypted and in `byId`.
      const byId = new Map(base.map((m) => [m.id, m]));
      const decorated = base.map((m, i) => attachReplyPreview(m, response.data[i].replyToMessageId, byId));
      setConversations((prev) => ({ ...prev, [otherPartyId]: decorated }));
    } catch {
      loadedThreads.current.delete(otherPartyId);
    }
  };

  const loadConversation = (otherPartyId: string) => {
    if (loadedThreads.current.has(otherPartyId)) return;
    loadedThreads.current.add(otherPartyId);
    fetchThread(otherPartyId);
  };

  const setActiveThread = (otherPartyId: string | null) => {
    activeThreadRef.current = otherPartyId;
    // Opening a thread clears its unread count in the conversation list
    // immediately, even if messages had piled up before this specific open.
    if (otherPartyId) {
      setLiveThreadUpdates((prev) => {
        if (!prev[otherPartyId]?.unreadCount) return prev;
        return { ...prev, [otherPartyId]: { ...prev[otherPartyId], unreadCount: 0 } };
      });
    }
  };

  // Real-time delivery: a message sent to us shows up instantly here without
  // the recipient having to poll or reload the thread. The same socket also
  // carries every session-lifecycle event (see SESSION_EVENT_TYPES) — one
  // connection, same push-only design as chat.
  useEffect(() => {
    if (!user || !token) return;
    const socket = new WebSocket(resolveWsUrl("/ws/chat", token));
    const myRole = user.role === "listener" ? "listener" : "speaker";

    socket.onmessage = (event) => {
      const payload = JSON.parse(event.data) as
        | { type: "message" | "read"; threadWithUserId: string; message: RawMessage | null }
        | { type: "reaction"; threadWithUserId: string; messageId: string; reactions: MessageReaction[] }
        | { type: "presence"; listenerId: string; online: boolean }
        | { type: "WALLET_UPDATED"; balance: number; transaction: RawWalletTransaction }
        | {
            type:
              | "SESSION_REQUESTED"
              | "SESSION_ACCEPTED"
              | "SESSION_REJECTED"
              | "SESSION_EXPIRED"
              | "PARTICIPANT_JOINED"
              | "SESSION_STARTED"
              | "SESSION_ENDED"
              | "PARTICIPANT_DISCONNECTED"
              | "PARTICIPANT_RECONNECTED"
              | "LOW_BALANCE_WARNING";
            session: LiveSession;
          };

      if (payload.type === "presence") {
        setListenerPresence((prev) => ({ ...prev, [payload.listenerId]: payload.online }));
        return;
      }

      if (payload.type === "WALLET_UPDATED") {
        // Carries the real new balance/transaction directly, rather than just
        // signalling "go re-fetch" — a follow-up GET fired the instant this
        // arrives could race the backend transaction's own commit and read a
        // stale balance; applying the pushed values has no such race.
        setWalletBalance(payload.balance);
        setTransactions((prev) => [toTransaction(payload.transaction), ...prev]);
        // Earnings stats (Today/Week/Month/Lifetime) are a separate
        // aggregate from the wallet balance itself and have no push of their
        // own — a listener's wallet only ever gets credited via completed
        // sessions, so any wallet update for a listener means their earnings
        // stats just changed too.
        if (myRole === "listener") {
          refreshEarnings();
        }
        return;
      }

      if (payload.type === "message" && payload.message) {
        const message = payload.message;
        const threadId = payload.threadWithUserId;
        (async () => {
          const sharedKey = await getSharedKey(threadId, token);
          const chatMessage = await toChatMessage(message, sharedKey);
          setConversations((prev) => {
            const thread = prev[threadId] ?? [];
            // A reply can only ever target a message the sender had already
            // seen, so it's necessarily already in our local thread state —
            // no separate fetch needed to resolve the preview.
            const withReply = attachReplyPreview(chatMessage, message.replyToMessageId, new Map(thread.map((m) => [m.id, m])));
            return { ...prev, [threadId]: [...thread, withReply] };
          });

          const isThreadOpen = activeThreadRef.current === threadId;
          // The thread this arrived in is already open on screen right now —
          // re-fetch so the backend marks it read and tells the sender.
          // Otherwise it would sit as "delivered" until the thread is reopened.
          if (isThreadOpen) {
            fetchThread(threadId);
          }

          // Live "last message" + unread count for the conversation list —
          // real-time only, not persisted, matching the ask. Count keeps
          // accumulating across multiple messages until the thread is opened
          // (setActiveThread resets it to 0), so the badge reflects however
          // many piled up while away, not just "there's something new."
          setLiveThreadUpdates((prev) => ({
            ...prev,
            [threadId]: {
              preview: chatMessage.text,
              at: message.createdAt,
              unreadCount: isThreadOpen ? 0 : (prev[threadId]?.unreadCount ?? 0) + 1,
            },
          }));

          // Only pop a toast when the recipient ISN'T already looking at
          // this thread — no point notifying about something already on screen.
          if (!isThreadOpen) {
            const session = liveSessionsRef.current[threadId];
            const title = (myRole === "speaker" ? session?.listenerName : session?.speakerLabel) ?? "New message";
            const to = myRole === "speaker" ? `/app/find-listeners?listener=${threadId}` : `/listener/messages?speaker=${threadId}`;
            const toastId = `${threadId}-${message.id}`;
            setToasts((prev) => [...prev, { id: toastId, to, title, preview: chatMessage.text }]);
            window.setTimeout(() => {
              setToasts((prev) => prev.filter((t) => t.id !== toastId));
            }, 5000);
          }
        })();
        return;
      }

      if (payload.type === "read") {
        // The other party just opened this thread — everything *I* sent in
        // it is now seen, so flip those ticks live without a reload.
        setConversations((prev) => {
          const thread = prev[payload.threadWithUserId];
          if (!thread) return prev;
          return {
            ...prev,
            [payload.threadWithUserId]: thread.map((m) =>
              m.sender === myRole ? { ...m, status: "read" } : m,
            ),
          };
        });
        return;
      }

      if (payload.type === "reaction") {
        // The other party added, changed, or removed their reaction — this
        // carries the message's full current reaction list, not a diff, so
        // there's no risk of drifting out of sync with a rapid toggle.
        setConversations((prev) => {
          const thread = prev[payload.threadWithUserId];
          if (!thread) return prev;
          return {
            ...prev,
            [payload.threadWithUserId]: thread.map((m) =>
              m.id === payload.messageId ? { ...m, reactions: payload.reactions } : m,
            ),
          };
        });
        return;
      }

      if ("session" in payload) {
        const session = payload.session;
        const key = myRole === "speaker" ? session.listenerId : session.speakerId;
        setLiveSessions((prev) => ({ ...prev, [key]: session }));

        if (payload.type === "SESSION_REQUESTED" && myRole === "listener") {
          setIncomingSessionQueue((prev) => (prev.some((s) => s.id === session.id) ? prev : [...prev, session]));
        }
        if (
          (payload.type === "SESSION_EXPIRED" || payload.type === "SESSION_REJECTED") &&
          myRole === "listener"
        ) {
          removeFromIncomingQueue(session.id);
        }
        // Wallet balance/transactions on SESSION_ENDED are handled by the
        // dedicated WALLET_UPDATED push above (fired directly from
        // WalletService the instant the charge/earning is applied), not
        // re-fetched here.
      }
    };

    return () => socket.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token]);

  // Step 1 of real wallet recharge — creates a Razorpay test-mode order, but
  // credits NOTHING yet (the old one-call addMoney, which credited
  // unconditionally with no payment step, no longer exists — see
  // Wallet.tsx for the full checkout flow this feeds into).
  const createRechargeOrder = async (amount: number, couponCode?: string) => {
    return apiRequest<{ razorpayOrderId: string; amount: number; currency: string; keyId: string }>(
      "/speaker/wallet/recharge/order",
      { method: "POST", token, body: { amount, couponCode: couponCode || undefined } },
    );
  };

  // Step 2 — called once Razorpay Checkout's client-side handler fires with
  // a completed test payment. The wallet is credited server-side only after
  // this verifies; the balance update itself arrives via the existing
  // WALLET_UPDATED WebSocket push (fired from inside WalletService.topUp,
  // reused unchanged), but refreshWallet() here matches the same
  // belt-and-suspenders pattern the old addMoney already used.
  const verifyRechargePayment = async (payload: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) => {
    const response = await apiRequest<{ balance: number; bonusApplied: number | null }>(
      "/speaker/wallet/recharge/verify",
      { method: "POST", token, body: payload },
    );
    setWalletBalance(Number(response.balance));
    refreshWallet();
    return { balance: Number(response.balance), bonusApplied: Number(response.bonusApplied ?? 0) };
  };

  const sendMessage = async (otherPartyId: string, text: string, replyToMessageId?: string) => {
    const trimmed = text.trim();
    if (!trimmed || !user) return;
    try {
      await ensureKeysRegistered(user.id, token);
      const sharedKey = await getSharedKey(otherPartyId, token);
      if (!sharedKey) return;
      const { ciphertext, iv } = await encryptText(sharedKey, trimmed);
      const response = await apiRequest<{ message: RawMessage }>(
        `${conversationsBasePath}/${otherPartyId}/messages`,
        { method: "POST", token, body: { ciphertext, iv, replyToMessageId: replyToMessageId ?? null } },
      );
      // No need to decrypt the echoed-back message — we already have the
      // plaintext we just typed. The replied-to message (if any) is
      // necessarily already in local state — you can only reply to
      // something you've already seen rendered.
      const sentMessage: ChatMessage = {
        id: response.message.id,
        sender: response.message.sender,
        text: trimmed,
        time: new Date(response.message.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        createdAt: response.message.createdAt,
        status: response.message.read ? "read" : response.message.delivered ? "delivered" : "sent",
        reactions: [],
      };
      setConversations((prev) => {
        const thread = prev[otherPartyId] ?? [];
        const withReply = attachReplyPreview(sentMessage, replyToMessageId ?? null, new Map(thread.map((m) => [m.id, m])));
        return { ...prev, [otherPartyId]: [...thread, withReply] };
      });
    } catch {
      // matches the existing silent-fail pattern for message sends
    }
  };

  // Toggle semantics, matching the backend: reacting with the same emoji you
  // already picked removes it, a different one replaces it. Applies the
  // server's returned (authoritative) reaction list rather than guessing the
  // new state client-side, so it can't drift out of sync with what the other
  // party sees.
  const setReaction = async (otherPartyId: string, messageId: string, emoji: string) => {
    try {
      const response = await apiRequest<{ reactions: MessageReaction[] }>(
        `${conversationsBasePath}/${otherPartyId}/messages/${messageId}/reaction`,
        { method: "PUT", token, body: { emoji } },
      );
      setConversations((prev) => {
        const thread = prev[otherPartyId];
        if (!thread) return prev;
        return {
          ...prev,
          [otherPartyId]: thread.map((m) => (m.id === messageId ? { ...m, reactions: response.reactions } : m)),
        };
      });
    } catch {
      // matches the existing silent-fail pattern for message sends
    }
  };

  // ---- Live session lifecycle ----

  const requestSession = async (listenerId: string): Promise<LiveSession> => {
    const dto = await apiRequest<LiveSession>("/speaker/sessions", {
      method: "POST",
      token,
      body: { listenerId },
    });
    setLiveSessions((prev) => ({ ...prev, [listenerId]: dto }));
    return dto;
  };

  const acceptSessionRequest = async (sessionId: string): Promise<LiveSession> => {
    const dto = await apiRequest<LiveSession>(`/listener/sessions/${sessionId}/accept`, {
      method: "POST",
      token,
    });
    setLiveSessions((prev) => ({ ...prev, [dto.speakerId]: dto }));
    removeFromIncomingQueue(sessionId);
    return dto;
  };

  const rejectSessionRequest = async (sessionId: string): Promise<void> => {
    const dto = await apiRequest<LiveSession>(`/listener/sessions/${sessionId}/reject`, {
      method: "POST",
      token,
    });
    setLiveSessions((prev) => ({ ...prev, [dto.speakerId]: dto }));
    removeFromIncomingQueue(sessionId);
  };

  const joinSession = async (sessionId: string, otherPartyId: string): Promise<LiveSession> => {
    const dto = await apiRequest<LiveSession>(`${sessionsBasePath}/${sessionId}/join`, {
      method: "POST",
      token,
    });
    setLiveSessions((prev) => ({ ...prev, [otherPartyId]: dto }));
    return dto;
  };

  const endLiveSession = async (sessionId: string, otherPartyId: string): Promise<LiveSession> => {
    const dto = await apiRequest<LiveSession>(`${sessionsBasePath}/${sessionId}/end`, {
      method: "POST",
      token,
    });
    setLiveSessions((prev) => ({ ...prev, [otherPartyId]: dto }));
    return dto;
  };

  const loadCurrentSession = async (otherPartyId: string): Promise<void> => {
    const response = await apiRequest<{ session: LiveSession | null }>(
      `${sessionsBasePath}/with/${otherPartyId}`,
      { token },
    );
    if (response.session) {
      setLiveSessions((prev) => ({ ...prev, [otherPartyId]: response.session as LiveSession }));
    }
  };

  // Moves a request into the "held" set — it stays in the queue (visible in
  // the waiting list, still acceptable/rejectable from there) but no longer
  // occupies the blocking modal.
  const holdSessionRequest = (sessionId: string) => {
    setHeldRequestIds((prev) => new Set(prev).add(sessionId));
  };

  const approveApplication = (id: string) => {
    setApplications((prev) => prev.filter((application) => application.id !== id));
  };

  const rejectApplication = (id: string) => {
    setApplications((prev) => prev.filter((application) => application.id !== id));
  };

  const toggleListenerOnline = () => {
    const next = !listenerOnline;
    setListenerOnline(next);
    apiRequest("/listener/availability/status", {
      method: "PATCH",
      token,
      body: { online: next },
    }).catch((err) => {
      setListenerOnline(!next);
      if (!(err instanceof ApiError)) throw err;
    });
  };

  // The modal shows the oldest request that hasn't been held; anything held
  // stays visible separately in the waiting-list queue.
  const incomingSessionRequest = incomingSessionQueue.find((s) => !heldRequestIds.has(s.id)) ?? null;
  const heldSessionRequests = incomingSessionQueue.filter((s) => heldRequestIds.has(s.id));

  const value = useMemo(
    () => ({
      walletBalance,
      transactions,
      applications,
      conversations,
      listenerPresence,
      liveSessions,
      incomingSessionRequest,
      heldSessionRequests,
      liveThreadUpdates,
      liveListenerRatings,
      updateListenerRating,
      createRechargeOrder,
      verifyRechargePayment,
      loadConversation,
      setActiveThread,
      sendMessage,
      setReaction,
      requestSession,
      acceptSessionRequest,
      rejectSessionRequest,
      joinSession,
      endLiveSession,
      loadCurrentSession,
      holdSessionRequest,
      approveApplication,
      rejectApplication,
      listenerOnline,
      toggleListenerOnline,
      listenerEarnings,
      refreshEarnings,
    }),
    [
      walletBalance,
      transactions,
      applications,
      conversations,
      listenerPresence,
      liveSessions,
      incomingSessionRequest,
      heldSessionRequests,
      liveThreadUpdates,
      liveListenerRatings,
      listenerOnline,
      listenerEarnings,
      token,
      user,
    ],
  );

  return (
    <AppDataContext.Provider value={value}>
      {children}
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error("useAppData must be used within an AppDataProvider");
  }
  return context;
}
