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

export interface MessageReaction {
  emoji: string;
  sender: "listener" | "speaker";
}

export interface ChatMessage {
  id: string;
  sender: "listener" | "speaker";
  text: string;
  time: string;
  /** Raw ISO timestamp — used for grouping messages under date separators (Today/Yesterday/...). */
  createdAt: string;
  status?: "sent" | "delivered" | "read";
  /** Populated by looking the id up in the same (already-decrypted) local thread — never fetched separately. */
  replyTo?: { id: string; text: string; sender: "listener" | "speaker" } | null;
  reactions: MessageReaction[];
}

export type SessionStatus =
  | "REQUESTED"
  | "ACCEPTED"
  | "CONNECTING"
  | "ACTIVE"
  | "DISCONNECTED"
  | "COMPLETED"
  | "REJECTED"
  | "EXPIRED";

// Mirrors the backend's SessionDto exactly — the server is the sole source
// of truth for status/timestamps/billing, this is just its wire shape.
export interface LiveSession {
  id: string;
  speakerId: string;
  listenerId: string;
  speakerLabel: string;
  listenerName: string;
  listenerAvatar: string | null;
  status: SessionStatus;
  pricePerMinute: number;
  requestedAt: string;
  acceptedAt: string | null;
  acceptDeadlineAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
  durationSeconds: number | null;
  pausedSeconds: number;
  speakerConnected: boolean;
  listenerConnected: boolean;
  lowBalanceWarnedAt: string | null;
  endedBy: "SPEAKER" | "LISTENER" | "SYSTEM" | null;
  speakerAmount: number | null;
  listenerAmount: number | null;
  platformCommission: number | null;
}

export interface Transaction {
  id: string;
  title: string;
  subtitle: string;
  amount: number;
  direction: "credit" | "debit";
  icon: "wallet" | "session";
}

export type PayoutMethodType = "BANK" | "UPI";
export type PayoutStatus = "PROCESSING" | "SUCCESS" | "FAILED";

export interface PayoutDestination {
  type: PayoutMethodType;
  accountHolderName: string | null;
  maskedAccountNumber: string | null;
  ifscCode: string | null;
  maskedUpiVpa: string | null;
}

export interface WithdrawalRequestRecord {
  id: string;
  amount: number;
  currency: string;
  status: PayoutStatus;
  failureReason: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface AdminWithdrawalRequestRecord extends WithdrawalRequestRecord {
  listenerName: string;
}

export interface ListenerApplication {
  id: string;
  name: string;
  avatar: string;
  topic: string;
}

export interface Mood {
  emoji: string;
  label: string;
}

export interface Category {
  label: string;
  emoji: string;
}

export interface ListenerEarnings {
  today: number;
  week: number;
  month: number;
  lifetime: number;
  chart: { day: string; value: number }[];
}

export interface ListenerRequest {
  id: string;
  label: string;
  topic: string;
  waitingSince: string;
}

export interface Review {
  id: string;
  name: string;
  rating: number;
  text: string;
  date: string;
}

export interface ReportedConversation {
  id: string;
  user: string;
  reason: string;
  priority: "High" | "Medium" | "Low";
  status?: "Open" | "Reviewing" | "Resolved";
}

// ---------------------------------------------------------------------------
// Messaging & notifications
// ---------------------------------------------------------------------------

export interface AppNotification {
  id: string;
  type: "session" | "wallet" | "system" | "listener";
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export interface ListenerConversation {
  id: string;
  speakerLabel: string;
  topic: string;
  lastMessage: string;
  lastMessageAt: string;
  unread: number;
}

// ---------------------------------------------------------------------------
// Profiles & settings
// ---------------------------------------------------------------------------

export interface SpeakerProfile {
  displayName: string;
  avatar: string;
  bio: string;
  preferredLanguage: string;
  timezone: string;
  notificationPreferences: { email: boolean; push: boolean };
}

export interface ListenerProfileDetails {
  name: string;
  avatar: string;
  bio: string;
  topics: string[];
  languages: string[];
  experienceYears: number;
  pricePerMinute: number;
  verified: boolean;
  joinedDate: string;
}

// ---------------------------------------------------------------------------
// Support
// ---------------------------------------------------------------------------

export interface SupportTicket {
  id: string;
  user: string;
  subject: string;
  message: string;
  status: "Open" | "In Progress" | "Resolved";
  priority: "Low" | "Medium" | "High";
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Listener extras
// ---------------------------------------------------------------------------

export interface ListenerSessionRecord {
  id: string;
  speakerLabel: string;
  date: string;
  time: string;
  duration: string;
  earning: number;
  rating: number;
  status: "completed" | "cancelled";
}

export interface RatingDistributionEntry {
  star: number;
  count: number;
}

// ---------------------------------------------------------------------------
// Admin extras
// ---------------------------------------------------------------------------

export interface PlatformUser {
  id: string;
  name: string;
  email: string;
  joinedDate: string;
  sessionsCount: number;
  walletBalance: number;
  status: "Active" | "Suspended";
}

export interface PlatformTransaction {
  id: string;
  user: string;
  type: "Top-up" | "Session" | "Withdrawal" | "Refund";
  amount: number;
  date: string;
  status: "Success" | "Pending" | "Failed";
}

export interface AdminAnnouncement {
  id: string;
  title: string;
  message: string;
  audience: "All Users" | "All Listeners" | "Everyone";
  sentAt: string;
}

export interface CmsPage {
  id: string;
  title: string;
  status: "Published" | "Draft";
  lastEdited: string;
}

export interface PlatformSettings {
  sessionPricePerMinute: number;
  platformFeePercent: number;
  minWithdrawalAmount: number;
  listenerPayoutPerMinute: number;
  supportEmail: string;
}
