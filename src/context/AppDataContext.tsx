import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  initialWalletBalance,
  listenerApplications as seedApplications,
  listeners,
  seedConversation,
  sessions as seedSessions,
  transactions as seedTransactions,
} from "../data/mockData";
import type {
  ChatMessage,
  Listener,
  ListenerApplication,
  Session,
  Transaction,
} from "../types";

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
  addMoney: (amount: number) => void;
  sendMessage: (listenerId: string, text: string) => void;
  endSession: (listener: Listener) => void;
  rateSession: (sessionId: string, rating: number) => void;
  approveApplication: (id: string) => void;
  rejectApplication: (id: string) => void;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

const buildInitialConversations = () =>
  Object.fromEntries(
    listeners.map((listener) => [
      listener.id,
      seedConversation.map((message) => ({ ...message })),
    ]),
  );

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [walletBalance, setWalletBalance] = useState(initialWalletBalance);
  const [transactions, setTransactions] = useState<Transaction[]>(seedTransactions);
  const [sessions, setSessions] = useState<Session[]>(seedSessions);
  const [applications, setApplications] = useState<ListenerApplication[]>(seedApplications);
  const [conversations, setConversations] = useState<Record<string, ChatMessage[]>>(
    buildInitialConversations,
  );

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

  const sendMessage = (listenerId: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const message: ChatMessage = {
      id: nextId("m"),
      sender: "speaker",
      text: trimmed,
      time: timeNow(),
      status: "sent",
    };
    setConversations((prev) => ({
      ...prev,
      [listenerId]: [...(prev[listenerId] ?? []), message],
    }));
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

  const value = useMemo(
    () => ({
      walletBalance,
      transactions,
      sessions,
      applications,
      conversations,
      addMoney,
      sendMessage,
      endSession,
      rateSession,
      approveApplication,
      rejectApplication,
    }),
    [walletBalance, transactions, sessions, applications, conversations],
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
