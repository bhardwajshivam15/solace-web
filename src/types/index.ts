export interface Listener {
  id: string;
  name: string;
  avatar: string;
  verified: boolean;
  rating: number;
  reviewCount: number;
  tags: string[];
  pricePerMinute: number;
  online: boolean;
}

export interface ChatMessage {
  id: string;
  sender: "listener" | "speaker";
  text: string;
  time: string;
  status?: "sent" | "delivered";
}

export interface Session {
  id: string;
  listenerName: string;
  avatar: string;
  date: string;
  time: string;
  duration: string;
  amount: number;
  rating: number;
  status: "completed" | "cancelled";
}

export interface Transaction {
  id: string;
  title: string;
  subtitle: string;
  amount: number;
  direction: "credit" | "debit";
  icon: "wallet" | "session";
}

export interface WithdrawalRequest {
  id: string;
  name: string;
  avatar: string;
  date: string;
  status: "Pending" | "Approved" | "Rejected";
}

export interface ListenerApplication {
  id: string;
  name: string;
  avatar: string;
  topic: string;
}
