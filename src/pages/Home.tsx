import { useMemo, useState } from "react";
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
import { listeners } from "../data/mockData";
import { useAppData } from "../context/AppDataContext";
import ListenerCard from "../components/ListenerCard";

const moodTagMap: Record<string, string> = {
  Happy: "Self Love",
  Okay: "Life Advice",
  Sad: "Loneliness",
  Anxious: "Anxiety",
  Heartbroken: "Breakup",
  Exhausted: "Stress",
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

export default function Home() {
  const { walletBalance, sessions } = useAppData();
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [quote] = useState(
    () => dailyQuotes[Math.floor(Math.random() * dailyQuotes.length)],
  );

  const greeting = useMemo(getGreeting, []);

  const recommended = useMemo(() => {
    const tag = selectedMood ? moodTagMap[selectedMood] : null;
    if (!tag) return listeners;
    const matches = listeners.filter((listener) => listener.tags.includes(tag));
    return matches.length > 0 ? matches : listeners;
  }, [selectedMood]);

  const recentSessions = sessions.slice(0, 3);

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
          {recommended.map((listener) => (
            <div key={listener.id} className="w-44 shrink-0">
              <Link to={`/app/find-listeners?listener=${listener.id}`}>
                <ListenerCard listener={listener} active={false} onSelect={() => {}} />
              </Link>
            </div>
          ))}
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
                src={session.avatar}
                alt={session.listenerName}
                className="h-10 w-10 rounded-full object-cover"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-ink-900">
                  {session.listenerName}
                </p>
                <p className="text-xs text-gray-400">
                  {session.date} · {session.duration}
                </p>
              </div>
              <p className="text-sm font-semibold text-ink-900">
                ₹{session.amount}
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
