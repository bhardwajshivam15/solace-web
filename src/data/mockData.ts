import type {
  AdminAnnouncement,
  AppNotification,
  AvailabilitySlot,
  Category,
  CmsPage,
  Listener,
  ListenerApplication,
  ListenerConversation,
  ListenerProfileDetails,
  ListenerSessionRecord,
  ListenerWithdrawalRecord,
  Mood,
  PlatformSettings,
  PlatformTransaction,
  PlatformUser,
  RatingDistributionEntry,
  ReportedConversation,
  Review,
  ScheduleItem,
  SpeakerProfile,
  SupportTicket,
  Transaction,
  WithdrawalRequest,
} from "../types";

const avatar = (seed: string) =>
  `https://i.pravatar.cc/150?img=${seed}`;

export const listeners: Listener[] = [
  {
    id: "aarohi",
    name: "Aarohi",
    avatar: avatar("47"),
    verified: true,
    rating: 4.9,
    reviewCount: 1200,
    tags: ["Relationship", "Anxiety"],
    pricePerMinute: 10,
    online: true,
  },
  {
    id: "kabir",
    name: "Kabir",
    avatar: avatar("12"),
    verified: true,
    rating: 4.8,
    reviewCount: 950,
    tags: ["Loneliness", "Life Advice"],
    pricePerMinute: 10,
    online: true,
  },
  {
    id: "meera",
    name: "Meera",
    avatar: avatar("45"),
    verified: true,
    rating: 4.9,
    reviewCount: 800,
    tags: ["Stress", "Overthinking"],
    pricePerMinute: 10,
    online: true,
  },
  {
    id: "rohan",
    name: "Rohan",
    avatar: avatar("14"),
    verified: true,
    rating: 4.8,
    reviewCount: 700,
    tags: ["Breakup", "Moving On"],
    pricePerMinute: 10,
    online: true,
  },
  {
    id: "ishita",
    name: "Ishita",
    avatar: avatar("32"),
    verified: true,
    rating: 4.9,
    reviewCount: 650,
    tags: ["Anxiety", "Self Love"],
    pricePerMinute: 10,
    online: true,
  },
  {
    id: "dev",
    name: "Dev",
    avatar: avatar("15"),
    verified: true,
    rating: 4.7,
    reviewCount: 500,
    tags: ["Career", "Motivation"],
    pricePerMinute: 10,
    online: true,
  },
];

export const chatFilters = [
  "All",
  "Relationship",
  "Anxiety",
  "Loneliness",
  "Breakup",
  "Stress",
];

export const initialWalletBalance = 1250;

export const transactions: Transaction[] = [
  {
    id: "t1",
    title: "Added Money",
    subtitle: "via Razorpay · 12 May, 2024",
    amount: 1000,
    direction: "credit",
    icon: "wallet",
  },
  {
    id: "t2",
    title: "Session with Aarohi",
    subtitle: "12 May, 2024 · 10:30 AM",
    amount: 120,
    direction: "debit",
    icon: "session",
  },
  {
    id: "t3",
    title: "Session with Kabir",
    subtitle: "11 May, 2024 · 08:20 PM",
    amount: 60,
    direction: "debit",
    icon: "session",
  },
  {
    id: "t4",
    title: "Added Money",
    subtitle: "via Razorpay · 10 May, 2024",
    amount: 500,
    direction: "credit",
    icon: "wallet",
  },
];

export const revenueOverview = [
  { day: "6 May", value: 22000 },
  { day: "7 May", value: 38000 },
  { day: "8 May", value: 30000 },
  { day: "9 May", value: 45000 },
  { day: "10 May", value: 33000 },
  { day: "11 May", value: 48000 },
  { day: "12 May", value: 40000 },
];

export const withdrawalRequests: WithdrawalRequest[] = [
  { id: "w1", name: "Aarohi", avatar: avatar("47"), date: "12 May, 2024", status: "Pending", amount: 2000, method: "UPI" },
  { id: "w2", name: "Kabir", avatar: avatar("12"), date: "12 May, 2024", status: "Approved", amount: 5000, method: "Bank" },
  { id: "w3", name: "Meera", avatar: avatar("45"), date: "11 May, 2024", status: "Pending", amount: 1500, method: "UPI" },
  { id: "w4", name: "Rohan", avatar: avatar("14"), date: "11 May, 2024", status: "Approved", amount: 3000, method: "Bank" },
  { id: "w5", name: "Ishita", avatar: avatar("32"), date: "10 May, 2024", status: "Pending", amount: 1000, method: "UPI" },
  { id: "w6", name: "Dev", avatar: avatar("15"), date: "9 May, 2024", status: "Rejected", amount: 4000, method: "Bank" },
];

export const listenerApplications: ListenerApplication[] = [
  { id: "a1", name: "Neha", avatar: avatar("29"), topic: "Relationship, Anxiety" },
  { id: "a2", name: "Arjun", avatar: avatar("11"), topic: "Life Advice, Motivation" },
  { id: "a3", name: "Priya", avatar: avatar("33"), topic: "Stress, Overthinking" },
];

// ---------------------------------------------------------------------------
// Speaker dashboard
// ---------------------------------------------------------------------------

export const moods: Mood[] = [
  { emoji: "😊", label: "Happy" },
  { emoji: "😐", label: "Okay" },
  { emoji: "😔", label: "Sad" },
  { emoji: "😰", label: "Anxious" },
  { emoji: "💔", label: "Heartbroken" },
  { emoji: "😴", label: "Exhausted" },
];

export const categories: Category[] = [
  { label: "Relationship", emoji: "💞" },
  { label: "Anxiety", emoji: "🌪️" },
  { label: "Work Stress", emoji: "💼" },
  { label: "Loneliness", emoji: "🌙" },
  { label: "Family", emoji: "🏠" },
  { label: "Career", emoji: "🎯" },
  { label: "Depression", emoji: "🌧️" },
  { label: "Student Life", emoji: "🎓" },
  { label: "Self Confidence", emoji: "🌱" },
];

// Shared between SignUp.tsx (listener application) and ListenerProfile.tsx
// (post-approval editing) so the same 18-language list is picked from in
// both places without drifting apart.
export const languageOptions = [
  "English",
  "Hindi",
  "Bengali",
  "Tamil",
  "Telugu",
  "Marathi",
  "Gujarati",
  "Kannada",
  "Malayalam",
  "Punjabi",
  "Urdu",
  "Odia",
  "Spanish",
  "French",
  "German",
  "Mandarin",
  "Arabic",
  "Portuguese",
];

export const dailyQuotes = [
  "It is okay to not be okay.",
  "You don't have to carry it all alone.",
  "Small steps still count as progress.",
  "Talking about it is the first step to feeling better.",
  "Your feelings are valid, always.",
];

// ---------------------------------------------------------------------------
// Listener dashboard
// ---------------------------------------------------------------------------

export const listenerProfile = {
  name: "Aarohi",
  avatar: avatar("47"),
  rank: 12,
};

export const listenerReviews: Review[] = [
  { id: "rv1", name: "Anonymous", rating: 5, text: "Very patient and kind. Really helped me feel heard.", date: "12 May, 2024" },
  { id: "rv2", name: "Anonymous", rating: 5, text: "Great listener, gave me space to talk without judgement.", date: "11 May, 2024" },
  { id: "rv3", name: "Anonymous", rating: 4, text: "Helpful conversation, felt a lot better after.", date: "10 May, 2024" },
];

export const todaysSchedule: ScheduleItem[] = [
  { id: "sc1", time: "09:00 AM", title: "Available for chat requests" },
  { id: "sc2", time: "01:00 PM", title: "Lunch break" },
  { id: "sc3", time: "06:00 PM", title: "Evening availability window" },
];

export const listenerPerformance = {
  averageRating: 4.9,
  acceptanceRate: 92,
  responseTime: "18s",
  completedSessions: 342,
  repeatUsers: 87,
};

// ---------------------------------------------------------------------------
// Admin dashboard
// ---------------------------------------------------------------------------


export const reportedConversations: ReportedConversation[] = [
  { id: "rep1", user: "Anonymous #4821", reason: "Inappropriate language", priority: "High" },
  { id: "rep2", user: "Anonymous #3390", reason: "Suspected spam listener", priority: "Medium" },
  { id: "rep3", user: "Anonymous #1027", reason: "Session disconnected abruptly", priority: "Low" },
];

export const platformHealth = {
  avgResponseTime: "22s",
  avgSessionDuration: "13m 40s",
  avgRating: 4.8,
  failedPayments: 6,
  systemStatus: "Operational",
};

export const adminOverviewStats = {
  totalUsers: 12345,
  activeListeners: 456,
  todaysSessions: 1234,
  todaysRevenue: 45678,
  pendingWithdrawals: withdrawalRequests.filter((w) => w.status === "Pending").length,
  pendingApprovals: listenerApplications.length,
  onlineUsers: 812,
  onlineListeners: 128,
  reportedConversations: reportedConversations.length,
};

// ---------------------------------------------------------------------------
// Messaging & notifications
// ---------------------------------------------------------------------------

export const speakerNotifications: AppNotification[] = [
  { id: "n1", type: "session", title: "Session ended", message: "Your session with Aarohi has ended.", time: "10 min ago", read: false },
  { id: "n2", type: "wallet", title: "Money added", message: "₹1,000 was added to your wallet.", time: "2 hours ago", read: false },
  { id: "n3", type: "listener", title: "New listener online", message: "Ishita is now online and ready to talk.", time: "5 hours ago", read: true },
  { id: "n4", type: "system", title: "Welcome to Solace", message: "Thanks for joining — talk to a listener anytime.", time: "1 day ago", read: true },
];

export const listenerConversations: ListenerConversation[] = [
  { id: "lc1", speakerLabel: "Anonymous User #4821", topic: "Anxiety", lastMessage: "Thank you, that really helped.", lastMessageAt: "10:34 AM", unread: 0 },
  { id: "lc2", speakerLabel: "Anonymous User #3390", topic: "Relationship", lastMessage: "Can we continue tomorrow?", lastMessageAt: "Yesterday", unread: 2 },
  { id: "lc3", speakerLabel: "Anonymous User #1027", topic: "Work Stress", lastMessage: "I feel a bit better now.", lastMessageAt: "2 days ago", unread: 0 },
];

// ---------------------------------------------------------------------------
// Profiles & settings
// ---------------------------------------------------------------------------

export const speakerProfile: SpeakerProfile = {
  displayName: "Guest Speaker",
  avatar: avatar("68"),
  bio: "Just someone who needs to talk sometimes.",
  preferredLanguage: "English",
  timezone: "Asia/Kolkata (IST)",
  notificationPreferences: { email: true, push: true, sms: false },
};

export const listenerProfileDetails: ListenerProfileDetails = {
  name: "Aarohi",
  avatar: avatar("47"),
  bio: "Here to listen without judgement. 2+ years supporting people through anxiety and relationship stress.",
  topics: ["Relationship", "Anxiety"],
  languages: ["English", "Hindi"],
  experienceYears: 2,
  pricePerMinute: 10,
  verified: true,
  joinedDate: "3 Jan, 2023",
};

// ---------------------------------------------------------------------------
// Support
// ---------------------------------------------------------------------------

export const supportTickets: SupportTicket[] = [
  { id: "tk1", user: "You", subject: "Wallet not updated after payment", message: "I added money but balance didn't update immediately.", status: "Resolved", priority: "Medium", createdAt: "9 May, 2024" },
  { id: "tk2", user: "You", subject: "Can't hear listener notifications", message: "Notification sound doesn't play for new messages.", status: "In Progress", priority: "Low", createdAt: "11 May, 2024" },
  { id: "tk3", user: "Anonymous #2214", subject: "Session ended abruptly", message: "My call with a listener disconnected after 3 minutes but I was charged for it.", status: "Open", priority: "High", createdAt: "9 May, 2024" },
  { id: "tk4", user: "Rohan (Listener)", subject: "Withdrawal delayed", message: "My withdrawal request has been pending for 5 days.", status: "Open", priority: "High", createdAt: "10 May, 2024" },
  { id: "tk5", user: "Anonymous #5581", subject: "Can't add money to wallet", message: "Payment fails every time I try to add ₹500.", status: "In Progress", priority: "Medium", createdAt: "8 May, 2024" },
];

export const helpFaqs = [
  { question: "Is my conversation really anonymous?", answer: "Yes. You never have to share your real name, and listeners only see what you choose to tell them." },
  { question: "How much does a session cost?", answer: "Sessions are billed per minute, starting at ₹10/min, deducted from your wallet." },
  { question: "How do I get a refund for a disconnected session?", answer: "Raise a support ticket with the session details and our team will review it within 24 hours." },
];

// ---------------------------------------------------------------------------
// Listener extras
// ---------------------------------------------------------------------------

export const listenerSessionHistory: ListenerSessionRecord[] = [
  { id: "ls1", speakerLabel: "Anonymous User #4821", date: "12 May, 2024", time: "10:30 AM", duration: "12m 45s", earning: 84, rating: 5, status: "completed" },
  { id: "ls2", speakerLabel: "Anonymous User #3390", date: "11 May, 2024", time: "08:20 PM", duration: "15m 30s", earning: 105, rating: 5, status: "completed" },
  { id: "ls3", speakerLabel: "Anonymous User #1027", date: "10 May, 2024", time: "07:15 PM", duration: "16m 05s", earning: 112, rating: 4, status: "completed" },
  { id: "ls4", speakerLabel: "Anonymous User #2214", date: "09 May, 2024", time: "06:00 PM", duration: "3m 10s", earning: 0, rating: 0, status: "cancelled" },
];

export const weeklyAvailability: AvailabilitySlot[] = [
  { day: "Monday", enabled: true, from: "09:00 AM", to: "06:00 PM" },
  { day: "Tuesday", enabled: true, from: "09:00 AM", to: "06:00 PM" },
  { day: "Wednesday", enabled: true, from: "09:00 AM", to: "06:00 PM" },
  { day: "Thursday", enabled: true, from: "09:00 AM", to: "06:00 PM" },
  { day: "Friday", enabled: true, from: "09:00 AM", to: "09:00 PM" },
  { day: "Saturday", enabled: false, from: "10:00 AM", to: "02:00 PM" },
  { day: "Sunday", enabled: false, from: "10:00 AM", to: "02:00 PM" },
];

export const listenerWithdrawalHistory: ListenerWithdrawalRecord[] = [
  { id: "lw1", amount: 5000, date: "1 May, 2024", status: "Paid", method: "Bank" },
  { id: "lw2", amount: 3000, date: "15 Apr, 2024", status: "Paid", method: "UPI" },
  { id: "lw3", amount: 2000, date: "2 May, 2024", status: "Pending", method: "UPI" },
];

export const ratingDistribution: RatingDistributionEntry[] = [
  { star: 5, count: 268 },
  { star: 4, count: 58 },
  { star: 3, count: 12 },
  { star: 2, count: 3 },
  { star: 1, count: 1 },
];

// ---------------------------------------------------------------------------
// Admin extras
// ---------------------------------------------------------------------------

export const platformUsers: PlatformUser[] = [
  { id: "u1", name: "Anonymous #4821", email: "user4821@solace.app", joinedDate: "2 Jan, 2024", sessionsCount: 18, walletBalance: 1250, status: "Active" },
  { id: "u2", name: "Anonymous #3390", email: "user3390@solace.app", joinedDate: "14 Feb, 2024", sessionsCount: 6, walletBalance: 300, status: "Active" },
  { id: "u3", name: "Anonymous #1027", email: "user1027@solace.app", joinedDate: "28 Feb, 2024", sessionsCount: 42, walletBalance: 0, status: "Suspended" },
  { id: "u4", name: "Anonymous #2214", email: "user2214@solace.app", joinedDate: "9 Mar, 2024", sessionsCount: 3, walletBalance: 500, status: "Active" },
  { id: "u5", name: "Anonymous #5581", email: "user5581@solace.app", joinedDate: "22 Mar, 2024", sessionsCount: 11, walletBalance: 90, status: "Active" },
];

export const platformTransactions: PlatformTransaction[] = [
  { id: "pt1", user: "Anonymous #4821", type: "Top-up", amount: 1000, date: "12 May, 2024", status: "Success" },
  { id: "pt2", user: "Anonymous #4821", type: "Session", amount: 120, date: "12 May, 2024", status: "Success" },
  { id: "pt3", user: "Aarohi (Listener)", type: "Withdrawal", amount: 5000, date: "1 May, 2024", status: "Success" },
  { id: "pt4", user: "Anonymous #3390", type: "Session", amount: 150, date: "11 May, 2024", status: "Success" },
  { id: "pt5", user: "Anonymous #2214", type: "Refund", amount: 50, date: "9 May, 2024", status: "Pending" },
  { id: "pt6", user: "Anonymous #5581", type: "Top-up", amount: 500, date: "8 May, 2024", status: "Failed" },
];

export const adminAnnouncements: AdminAnnouncement[] = [
  { id: "an1", title: "Scheduled maintenance", message: "Solace will be briefly unavailable on 15 May, 2 AM IST for maintenance.", audience: "Everyone", sentAt: "10 May, 2024" },
  { id: "an2", title: "New listener bonus", message: "Refer a friend to become a listener and both earn a bonus this month.", audience: "All Listeners", sentAt: "5 May, 2024" },
];

export const cmsPages: CmsPage[] = [
  { id: "cms1", title: "About Us", status: "Published", lastEdited: "2 May, 2024" },
  { id: "cms2", title: "FAQ", status: "Published", lastEdited: "28 Apr, 2024" },
  { id: "cms3", title: "Terms of Service", status: "Published", lastEdited: "10 Mar, 2024" },
  { id: "cms4", title: "Privacy Policy", status: "Published", lastEdited: "10 Mar, 2024" },
  { id: "cms5", title: "Community Guidelines", status: "Draft", lastEdited: "1 May, 2024" },
];

export const platformSettings: PlatformSettings = {
  sessionPricePerMinute: 10,
  platformFeePercent: 30,
  minWithdrawalAmount: 500,
  listenerPayoutPerMinute: 7,
  supportEmail: "support@solace.app",
};
