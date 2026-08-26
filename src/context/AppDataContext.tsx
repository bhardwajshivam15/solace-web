import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  listenerApplications as seedApplications,
  listenerEarnings as seedListenerEarnings,
} from "../data/mockData";
import type {
  ChatMessage,
  ListenerApplication,
  ListenerEarnings,
  LiveSession,
  Transaction,
} from "../types";
import { useAuth } from "./AuthContext";
import { apiRequest, ApiError, resolveWsUrl } from "../lib/apiClient";

interface AppDataContextValue {
  walletBalance: number;
  transactions: Transaction[];
  applications: ListenerApplication[];
  conversations: Record<string, ChatMessage[]>;
  listenerPresence: Record<string, boolean>;
  liveSessions: Record<string, LiveSession>;
  incomingSessionRequest: LiveSession | null;
  addMoney: (amount: number) => Promise<void>;
  loadConversation: (otherPartyId: string) => void;
  setActiveThread: (otherPartyId: string | null) => void;
  sendMessage: (otherPartyId: string, text: string) => void;
  requestSession: (listenerId: string) => Promise<LiveSession>;
  acceptSessionRequest: (sessionId: string) => Promise<LiveSession>;
  rejectSessionRequest: (sessionId: string) => Promise<void>;
  joinSession: (sessionId: string, otherPartyId: string) => Promise<LiveSession>;
  endLiveSession: (sessionId: string, otherPartyId: string) => Promise<LiveSession>;
  loadCurrentSession: (otherPartyId: string) => Promise<void>;
  dismissIncomingSessionRequest: () => void;
  approveApplication: (id: string) => void;
  rejectApplication: (id: string) => void;
  listenerOnline: boolean;
  toggleListenerOnline: () => void;
  listenerEarnings: ListenerEarnings;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

interface RawMessage {
  id: string;
  sender: "speaker" | "listener";
  text: string;
  delivered: boolean;
  read: boolean;
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

function toChatMessage(message: RawMessage): ChatMessage {
  return {
    id: message.id,
    sender: message.sender,
    text: message.text,
    time: new Date(message.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    status: message.read ? "read" : message.delivered ? "delivered" : "sent",
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
  // The listener-side "New Conversation Request" overlay — global, not tied
  // to whichever page the listener happens to be on when it arrives.
  const [incomingSessionRequest, setIncomingSessionRequest] = useState<LiveSession | null>(null);
  const loadedThreads = useRef<Set<string>>(new Set());
  // Ref, not state — read from inside the WebSocket handler's closure, which
  // is set up once and would otherwise never see updates to "which thread is
  // currently open on screen."
  const activeThreadRef = useRef<string | null>(null);
  const [listenerOnline, setListenerOnline] = useState(false);
  const [listenerEarnings] = useState<ListenerEarnings>(seedListenerEarnings);

  useEffect(() => {
    if (user?.role !== "listener") return;
    apiRequest<{ availability: { online: boolean } }>("/listener/availability", { token })
      .then((response) => setListenerOnline(response.availability.online))
      .catch(() => {});
  }, [user?.role, token]);

  // Catches a request that arrived while the listener wasn't connected yet —
  // live ones after this are handled by the WebSocket SESSION_REQUESTED push.
  useEffect(() => {
    if (user?.role !== "listener") return;
    apiRequest<{ session: LiveSession | null }>("/listener/sessions/pending", { token })
      .then((response) => {
        if (response.session) setIncomingSessionRequest(response.session);
      })
      .catch(() => {});
  }, [user?.role, token]);

  const refreshWallet = () => {
    if (user?.role !== "speaker") return;
    apiRequest<{ balance: number }>("/speaker/wallet", { token })
      .then((response) => setWalletBalance(Number(response.balance)))
      .catch(() => {});
    apiRequest<{ data: RawWalletTransaction[] }>("/speaker/wallet/transactions", { token })
      .then((response) => setTransactions(response.data.map(toTransaction)))
      .catch(() => {});
  };

  useEffect(() => {
    refreshWallet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role, token]);

  const conversationsBasePath = user?.role === "listener" ? "/listener/conversations" : "/speaker/conversations";
  const sessionsBasePath = user?.role === "listener" ? "/listener/sessions" : "/speaker/sessions";

  // Fetching a thread's history is also how the backend learns "I've seen
  // this" — GET .../messages marks the other party's messages as read and
  // notifies them. Used both for the first open (loadConversation) and to
  // re-mark-read when a live message arrives while the thread is already
  // the one on screen (see the WebSocket handler below).
  const fetchThread = (otherPartyId: string) => {
    apiRequest<{ data: RawMessage[] }>(`${conversationsBasePath}/${otherPartyId}/messages`, { token })
      .then((response) => {
        setConversations((prev) => ({ ...prev, [otherPartyId]: response.data.map(toChatMessage) }));
      })
      .catch(() => {
        loadedThreads.current.delete(otherPartyId);
      });
  };

  const loadConversation = (otherPartyId: string) => {
    if (loadedThreads.current.has(otherPartyId)) return;
    loadedThreads.current.add(otherPartyId);
    fetchThread(otherPartyId);
  };

  const setActiveThread = (otherPartyId: string | null) => {
    activeThreadRef.current = otherPartyId;
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
        | { type: "presence"; listenerId: string; online: boolean }
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

      if (payload.type === "message" && payload.message) {
        const message = payload.message;
        setConversations((prev) => ({
          ...prev,
          [payload.threadWithUserId]: [...(prev[payload.threadWithUserId] ?? []), toChatMessage(message)],
        }));
        // The thread this arrived in is already open on screen right now —
        // re-fetch so the backend marks it read and tells the sender.
        // Otherwise it would sit as "delivered" until the thread is reopened.
        if (activeThreadRef.current === payload.threadWithUserId) {
          fetchThread(payload.threadWithUserId);
        }
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

      if ("session" in payload) {
        const session = payload.session;
        const key = myRole === "speaker" ? session.listenerId : session.speakerId;
        setLiveSessions((prev) => ({ ...prev, [key]: session }));

        if (payload.type === "SESSION_REQUESTED" && myRole === "listener") {
          setIncomingSessionRequest(session);
        }
        if (
          (payload.type === "SESSION_EXPIRED" || payload.type === "SESSION_REJECTED") &&
          myRole === "listener"
        ) {
          setIncomingSessionRequest((prev) => (prev?.id === session.id ? null : prev));
        }
        if (payload.type === "SESSION_ENDED") {
          refreshWallet();
        }
      }
    };

    return () => socket.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token]);

  const addMoney = async (amount: number) => {
    const response = await apiRequest<{ balance: number }>("/speaker/wallet/topup", {
      method: "POST",
      token,
      body: { amount },
    });
    setWalletBalance(Number(response.balance));
    refreshWallet();
  };

  const sendMessage = (otherPartyId: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    apiRequest<{ message: RawMessage }>(
      `${conversationsBasePath}/${otherPartyId}/messages`,
      { method: "POST", token, body: { text: trimmed } },
    )
      .then((response) => {
        setConversations((prev) => ({
          ...prev,
          [otherPartyId]: [...(prev[otherPartyId] ?? []), toChatMessage(response.message)],
        }));
      })
      .catch(() => {});
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
    setIncomingSessionRequest((prev) => (prev?.id === sessionId ? null : prev));
    return dto;
  };

  const rejectSessionRequest = async (sessionId: string): Promise<void> => {
    const dto = await apiRequest<LiveSession>(`/listener/sessions/${sessionId}/reject`, {
      method: "POST",
      token,
    });
    setLiveSessions((prev) => ({ ...prev, [dto.speakerId]: dto }));
    setIncomingSessionRequest((prev) => (prev?.id === sessionId ? null : prev));
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

  const dismissIncomingSessionRequest = () => setIncomingSessionRequest(null);

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

  const value = useMemo(
    () => ({
      walletBalance,
      transactions,
      applications,
      conversations,
      listenerPresence,
      liveSessions,
      incomingSessionRequest,
      addMoney,
      loadConversation,
      setActiveThread,
      sendMessage,
      requestSession,
      acceptSessionRequest,
      rejectSessionRequest,
      joinSession,
      endLiveSession,
      loadCurrentSession,
      dismissIncomingSessionRequest,
      approveApplication,
      rejectApplication,
      listenerOnline,
      toggleListenerOnline,
      listenerEarnings,
    }),
    [
      walletBalance,
      transactions,
      applications,
      conversations,
      listenerPresence,
      liveSessions,
      incomingSessionRequest,
      listenerOnline,
      listenerEarnings,
      token,
      user,
    ],
  );

  return (
    <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
  );
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error("useAppData must be used within an AppDataProvider");
  }
  return context;
}
