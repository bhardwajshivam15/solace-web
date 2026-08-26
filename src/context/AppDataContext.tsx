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
  initialWalletBalance,
  listenerApplications as seedApplications,
  listenerEarnings as seedListenerEarnings,
  listenerRequests as seedListenerRequests,
  sessions as seedSessions,
  transactions as seedTransactions,
} from "../data/mockData";
import type {
  ChatMessage,
  Listener,
  ListenerApplication,
  ListenerEarnings,
  ListenerRequest,
  Session,
  Transaction,
} from "../types";
import { useAuth } from "./AuthContext";
import { apiRequest, ApiError, resolveWsUrl } from "../lib/apiClient";

let uid = 1000;
const nextId = (prefix: string) => `${prefix}-${uid++}`;

const timeNow = () =>
  new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

interface AppDataContextValue {
  walletBalance: number;
  transactions: Transaction[];
  sessions: Session[];
  applications: ListenerApplication[];
  conversations: Record<string, ChatMessage[]>;
  listenerPresence: Record<string, boolean>;
  addMoney: (amount: number) => void;
  loadConversation: (otherPartyId: string) => void;
  setActiveThread: (otherPartyId: string | null) => void;
  sendMessage: (otherPartyId: string, text: string) => void;
  endSession: (listener: Listener) => void;
  rateSession: (sessionId: string, rating: number) => void;
  approveApplication: (id: string) => void;
  rejectApplication: (id: string) => void;
  listenerOnline: boolean;
  toggleListenerOnline: () => void;
  listenerRequests: ListenerRequest[];
  listenerEarnings: ListenerEarnings;
  acceptListenerRequest: (id: string) => void;
  declineListenerRequest: (id: string) => void;
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

function toChatMessage(message: RawMessage): ChatMessage {
  return {
    id: message.id,
    sender: message.sender,
    text: message.text,
    time: new Date(message.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    status: message.read ? "read" : message.delivered ? "delivered" : "sent",
  };
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { user, token } = useAuth();
  const [walletBalance, setWalletBalance] = useState(initialWalletBalance);
  const [transactions, setTransactions] = useState<Transaction[]>(seedTransactions);
  const [sessions, setSessions] = useState<Session[]>(seedSessions);
  const [applications, setApplications] = useState<ListenerApplication[]>(seedApplications);
  const [conversations, setConversations] = useState<Record<string, ChatMessage[]>>({});
  const [listenerPresence, setListenerPresence] = useState<Record<string, boolean>>({});
  const loadedThreads = useRef<Set<string>>(new Set());
  // Ref, not state — read from inside the WebSocket handler's closure, which
  // is set up once and would otherwise never see updates to "which thread is
  // currently open on screen."
  const activeThreadRef = useRef<string | null>(null);
  const [listenerOnline, setListenerOnline] = useState(false);
  const [listenerRequests, setListenerRequests] = useState<ListenerRequest[]>(
    seedListenerRequests,
  );
  const [listenerEarnings, setListenerEarnings] = useState<ListenerEarnings>(
    seedListenerEarnings,
  );

  useEffect(() => {
    if (user?.role !== "listener") return;
    apiRequest<{ availability: { online: boolean } }>("/listener/availability", { token })
      .then((response) => setListenerOnline(response.availability.online))
      .catch(() => {});
  }, [user?.role, token]);

  const conversationsBasePath = user?.role === "listener" ? "/listener/conversations" : "/speaker/conversations";

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
  // the recipient having to poll or reload the thread.
  useEffect(() => {
    if (!user || !token) return;
    const socket = new WebSocket(resolveWsUrl("/ws/chat", token));

    socket.onmessage = (event) => {
      const payload = JSON.parse(event.data) as
        | { type: "message" | "read"; threadWithUserId: string; message: RawMessage | null }
        | { type: "presence"; listenerId: string; online: boolean };

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
        const myRole = user?.role === "listener" ? "listener" : "speaker";
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
      }
    };

    return () => socket.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token]);

  const addMoney = (amount: number) => {
    setWalletBalance((prev) => prev + amount);
    setTransactions((prev) => [
      {
        id: nextId("t"),
        title: "Added Money",
        subtitle: `via Razorpay · Today, ${timeNow()}`,
        amount,
        direction: "credit",
        icon: "wallet",
      },
      ...prev,
    ]);
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

  const endSession = (listener: Listener) => {
    const amount = 120;
    setWalletBalance((prev) => Math.max(prev - amount, 0));
    setTransactions((prev) => [
      {
        id: nextId("t"),
        title: `Session with ${listener.name}`,
        subtitle: `Today · ${timeNow()}`,
        amount,
        direction: "debit",
        icon: "session",
      },
      ...prev,
    ]);
    setSessions((prev) => [
      {
        id: nextId("s"),
        listenerName: listener.name,
        avatar: listener.avatar,
        date: "Today",
        time: timeNow(),
        duration: "12m 45s",
        amount,
        rating: 0,
        status: "completed",
      },
      ...prev,
    ]);
  };

  const rateSession = (sessionId: string, rating: number) => {
    setSessions((prev) =>
      prev.map((session) =>
        session.id === sessionId ? { ...session, rating } : session,
      ),
    );
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

  const acceptListenerRequest = (id: string) => {
    setListenerRequests((prev) => prev.filter((request) => request.id !== id));
    setListenerEarnings((prev) => ({
      ...prev,
      today: prev.today + 100,
      week: prev.week + 100,
      month: prev.month + 100,
      lifetime: prev.lifetime + 100,
    }));
  };

  const declineListenerRequest = (id: string) => {
    setListenerRequests((prev) => prev.filter((request) => request.id !== id));
  };

  const value = useMemo(
    () => ({
      walletBalance,
      transactions,
      sessions,
      applications,
      conversations,
      listenerPresence,
      addMoney,
      loadConversation,
      setActiveThread,
      sendMessage,
      endSession,
      rateSession,
      approveApplication,
      rejectApplication,
      listenerOnline,
      toggleListenerOnline,
      listenerRequests,
      listenerEarnings,
      acceptListenerRequest,
      declineListenerRequest,
    }),
    [
      walletBalance,
      transactions,
      sessions,
      applications,
      conversations,
      listenerPresence,
      listenerOnline,
      listenerRequests,
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
