import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Headphones,
  Wallet as WalletIcon,
  History,
  UserCircle,
  Quote,
  ChevronRight,
} from "lucide-react";
import { categories, dailyQuotes, moods } from "../data/mockData";
import { useAuth } from "../context/AuthContext";
import { useAppData } from "../context/AppDataContext";
import { apiRequest, resolveAssetUrl } from "../lib/apiClient";
import ListenerCard from "../components/ListenerCard";
import type { Listener } from "../types";

const moodTagMap: Record<string, string> = {
  Happy: "Self Love",
  Okay: "Life Advice",
  Sad: "Loneliness",
  Anxious: "Anxiety",
  Heartbroken: "Breakup",
  Exhausted: "Stress",
};

interface RecentSession {
  id: string;
  listenerId: string;
  listenerName: string;
  listenerAvatar: string | null;
  status: "COMPLETED" | "REJECTED" | "EXPIRED";
  requestedAt: string;
  durationSeconds: number | null;
  speakerAmount: number | null;
}

interface PublicListener {
  id: string;
  name: string;
  avatar: string | null;
  bio: string | null;
  topics: string[];
  languages: string[];
  experienceYears: number;
  verified: boolean;
  online: boolean;
  pricePerMinute: number;
  listenerEarningPerMinute: number;
  platformFeePerMinute: number;
  rating: number;
  reviewCount: number;
}

function toListener(listener: PublicListener): Listener {
  return {
    id: listener.id,
    name: listener.name,
    avatar: resolveAssetUrl(listener.avatar) ?? initialsAvatar(listener.name),
    verified: listener.verified,
    rating: listener.rating,
    reviewCount: listener.reviewCount,
    tags: listener.topics,
    pricePerMinute: listener.pricePerMinute,
    online: listener.online,
  };
}

function initialsAvatar(name: string): string {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150"><rect width="150" height="150" fill="#ede9fe"/><text x="50%" y="50%" dy=".35em" text-anchor="middle" font-family="sans-serif" font-size="60" fill="#6d28d9">${initial}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

export default function Home() {
  const { token } = useAuth();
  const { walletBalance } = useAppData();
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [listeners, setListeners] = useState<Listener[]>([]);
  const [loadingListeners, setLoadingListeners] = useState(true);
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [quote] = useState(
    () => dailyQuotes[Math.floor(Math.random() * dailyQuotes.length)],
  );

  const greeting = useMemo(getGreeting, []);

  useEffect(() => {
    apiRequest<{ data: PublicListener[] }>("/listeners", { token })
      .then((response) => setListeners(response.data.map(toListener)))
      .catch(() => {})
      .finally(() => setLoadingListeners(false));
  }, [token]);

  useEffect(() => {
    apiRequest<{ data: RecentSession[] }>("/speaker/sessions", { token })
      .then((response) => setRecentSessions(response.data.filter((s) => s.status === "COMPLETED").slice(0, 3)))
      .catch(() => {});
  }, [token]);

  const recommended = useMemo(() => {
    const tag = selectedMood ? moodTagMap[selectedMood] : null;
    if (!tag) return listeners;
    const matches = listeners.filter((listener) => listener.tags.includes(tag));
    return matches.length > 0 ? matches : listeners;
  }, [selectedMood, listeners]);

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-8">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">{greeting} 👋</h1>
        <p className="mt-1 text-gray-500">How are you feeling today?</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {moods.map((mood) => (
            <button
              key={mood.label}
              onClick={() =>
                setSelectedMood((prev) => (prev === mood.label ? null : mood.label))
              }
              className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                selectedMood === mood.label
                  ? "border-brand-300 bg-brand-50 text-brand-700"
                  : "border-gray-200 text-gray-600 hover:border-brand-200"
              }`}
            >
              <span className="text-base">{mood.emoji}</span>
              {mood.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 p-8 text-center text-white shadow-soft">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
          <Headphones className="h-7 w-7" />
        </div>
        <h2 className="mt-4 text-xl font-bold">Need someone to listen?</h2>
        <p className="mt-1 text-sm text-brand-100">
          Talk anonymously with a trained listener.
        </p>
        <Link
          to="/app/find-listeners"
          className="mt-5 inline-block rounded-xl bg-white px-6 py-3 text-sm font-semibold text-brand-700 hover:bg-brand-50"
        >
          Find a Listener
        </Link>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-ink-900">Recommended for you</h3>
          <Link
            to="/app/find-listeners"
            className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            See all
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
          {loadingListeners && (
            <p className="py-6 text-sm text-gray-400">Loading listeners…</p>
          )}
          {!loadingListeners &&
            recommended.map((listener) => (
              <div key={listener.id} className="w-44 shrink-0">
                <Link to={`/app/find-listeners?listener=${listener.id}`}>
                  <ListenerCard listener={listener} active={false} onSelect={() => {}} />
                </Link>
              </div>
            ))}
          {!loadingListeners && recommended.length === 0 && (
            <p className="py-6 text-sm text-gray-400">No listeners available right now.</p>
          )}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-ink-900">Browse by topic</h3>
        <div className="mt-4 flex flex-wrap gap-2">
          {categories.map((category) => (
            <Link
              key={category.label}
              to={`/app/find-listeners?filter=${encodeURIComponent(category.label)}`}
              className="flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-brand-50 hover:text-brand-700"
            >
              <span>{category.emoji}</span>
              {category.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-brand-50 p-6">
          <p className="text-sm text-gray-500">Wallet Balance</p>
          <p className="mt-1 text-2xl font-bold text-ink-900">
            ₹ {walletBalance.toLocaleString("en-IN")}
          </p>
          <Link
            to="/app/wallet"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            <WalletIcon className="h-4 w-4" />
            Add Money
          </Link>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6">
          <div className="flex items-start gap-3">
            <Quote className="h-6 w-6 shrink-0 text-brand-400" />
            <p className="text-sm italic text-gray-600">"{quote}"</p>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-ink-900">Recent Sessions</h3>
          <Link
            to="/app/sessions"
            className="text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            View all
          </Link>
        </div>
        <div className="mt-4 divide-y divide-gray-100 rounded-2xl border border-gray-100">
          {recentSessions.map((session) => (
            <div key={session.id} className="flex items-center gap-4 px-4 py-3.5">
              <img
                src={resolveAssetUrl(session.listenerAvatar) ?? initialsAvatar(session.listenerName)}
                alt={session.listenerName}
                className="h-10 w-10 rounded-full object-cover"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-ink-900">
                  {session.listenerName}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(session.requestedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  {session.durationSeconds != null &&
                    ` · ${Math.floor(session.durationSeconds / 60)}m ${session.durationSeconds % 60}s`}
                </p>
              </div>
              <p className="text-sm font-semibold text-ink-900">
                ₹{session.speakerAmount?.toFixed(2) ?? "—"}
              </p>
              <Link
                to="/app/sessions"
                className="text-xs font-medium text-brand-600 hover:text-brand-700"
              >
                View Chat
              </Link>
            </div>
          ))}
          {recentSessions.length === 0 && (
            <p className="py-8 text-center text-sm text-gray-400">
              No sessions yet — talk to a listener to get started.
            </p>
          )}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-ink-900">Quick Actions</h3>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Link
            to="/app/find-listeners"
            className="flex flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-white py-5 text-sm font-medium text-ink-900 hover:border-brand-200"
          >
            <Headphones className="h-5 w-5 text-brand-600" />
            Find Listener
          </Link>
          <Link
            to="/app/wallet"
            className="flex flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-white py-5 text-sm font-medium text-ink-900 hover:border-brand-200"
          >
            <WalletIcon className="h-5 w-5 text-brand-600" />
            Wallet
          </Link>
          <Link
            to="/app/sessions"
            className="flex flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-white py-5 text-sm font-medium text-ink-900 hover:border-brand-200"
          >
            <History className="h-5 w-5 text-brand-600" />
            My Sessions
          </Link>
          <Link
            to="/app/profile"
            className="flex flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-white py-5 text-sm font-medium text-ink-900 hover:border-brand-200"
          >
            <UserCircle className="h-5 w-5 text-brand-600" />
            Profile
          </Link>
        </div>
      </div>
    </div>
  );
}
