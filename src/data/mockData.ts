import type {
  ChatMessage,
  Listener,
  ListenerApplication,
  Session,
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

export const seedConversation: ChatMessage[] = [
  {
    id: "m1",
    sender: "listener",
    text: "Hey there! 👋 I'm here to listen. How are you feeling today?",
    time: "10:30 AM",
  },
  {
    id: "m2",
    sender: "speaker",
    text: "I've been feeling really overwhelmed lately and I just needed someone to talk to.",
    time: "10:32 AM",
    status: "delivered",
  },
  {
    id: "m3",
    sender: "listener",
    text: "It's completely okay to feel that way. Want to tell me more about what's been going on?",
    time: "10:33 AM",
  },
  {
    id: "m4",
    sender: "speaker",
    text: "Yeah...",
    time: "10:34 AM",
    status: "delivered",
  },
];

export const sessions: Session[] = [
  {
    id: "s1",
    listenerName: "Aarohi",
    avatar: avatar("47"),
    date: "12 May, 2024",
    time: "10:30 AM",
    duration: "12m 45s",
    amount: 120,
    rating: 4.9,
    status: "completed",
  },
  {
    id: "s2",
    listenerName: "Kabir",
    avatar: avatar("12"),
    date: "11 May, 2024",
    time: "08:20 PM",
    duration: "15m 30s",
    amount: 150,
    rating: 4.9,
    status: "completed",
  },
  {
    id: "s3",
    listenerName: "Meera",
    avatar: avatar("45"),
    date: "10 May, 2024",
    time: "07:15 PM",
    duration: "16m 05s",
    amount: 150,
    rating: 4.9,
    status: "completed",
  },
  {
    id: "s4",
    listenerName: "Rohan",
    avatar: avatar("14"),
    date: "09 May, 2024",
    time: "06:00 PM",
    duration: "10m 10s",
    amount: 100,
    rating: 4.8,
    status: "completed",
  },
  {
    id: "s5",
    listenerName: "Ishita",
    avatar: avatar("32"),
    date: "08 May, 2024",
    time: "05:40 PM",
    duration: "5m 50s",
    amount: 50,
    rating: 4.9,
    status: "cancelled",
  },
];

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

export const revenueOverviewMonthly = [
  { day: "Jan", value: 620000 },
  { day: "Feb", value: 710000 },
  { day: "Mar", value: 680000 },
  { day: "Apr", value: 790000 },
  { day: "May", value: 860000 },
  { day: "Jun", value: 910000 },
];

export const withdrawalRequests: WithdrawalRequest[] = [
  { id: "w1", name: "Aarohi", avatar: avatar("47"), date: "12 May, 2024", status: "Pending" },
  { id: "w2", name: "Kabir", avatar: avatar("12"), date: "12 May, 2024", status: "Approved" },
  { id: "w3", name: "Meera", avatar: avatar("45"), date: "11 May, 2024", status: "Pending" },
  { id: "w4", name: "Rohan", avatar: avatar("14"), date: "11 May, 2024", status: "Approved" },
];

export const listenerApplications: ListenerApplication[] = [
  { id: "a1", name: "Neha", avatar: avatar("29"), topic: "Relationship, Anxiety" },
  { id: "a2", name: "Arjun", avatar: avatar("11"), topic: "Life Advice, Motivation" },
  { id: "a3", name: "Priya", avatar: avatar("33"), topic: "Stress, Overthinking" },
];
