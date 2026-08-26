import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Star, PhoneCall, Trophy, Clock } from "lucide-react";
import {
  listenerProfile,
  listenerPerformance,
  todaysSchedule,
} from "../data/mockData";
import { useAppData } from "../context/AppDataContext";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../lib/apiClient";
import LiveSessionTimer from "../components/LiveSessionTimer";

const earningTabs = ["Today", "Week", "Month", "Lifetime"] as const;
type EarningTab = (typeof earningTabs)[number];

const earningKeyMap: Record<EarningTab, "today" | "week" | "month" | "lifetime"> = {
  Today: "today",
  Week: "week",
  Month: "month",
  Lifetime: "lifetime",
};

interface Review {
  id: string;
  reviewerLabel: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

interface RatingSummary {
  averageRating: number;
  reviewCount: number;
  reviews: Review[];
}

export default function ListenerDashboard() {
  const { listenerOnline, toggleListenerOnline, listenerEarnings, liveSessions } = useAppData();
  const { token } = useAuth();
  const [earningTab, setEarningTab] = useState<EarningTab>("Today");
  const [ratingSummary, setRatingSummary] = useState<RatingSummary | null>(null);

  useEffect(() => {
    apiRequest<RatingSummary>("/listener/ratings", { token })
      .then(setRatingSummary)
      .catch(() => {});
  }, [token]);

  const performanceCards = [
    {
      label: "Average Rating",
      value: ratingSummary && ratingSummary.reviewCount > 0 ? `★ ${ratingSummary.averageRating.toFixed(1)}` : "★ —",
    },
    { label: "Acceptance Rate", value: `${listenerPerformance.acceptanceRate}%` },
    { label: "Response Time", value: listenerPerformance.responseTime },
    { label: "Completed Sessions", value: listenerPerformance.completedSessions },
    { label: "Repeat Users", value: listenerPerformance.repeatUsers },
  ];

  const activeSession = Object.values(liveSessions).find((session) => session.status === "ACTIVE");

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-8">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 p-8 text-white shadow-soft">
        <div>
          <h1 className="text-2xl font-bold">Welcome back {listenerProfile.name}</h1>
          <p className="mt-1 text-sm text-brand-100">Today's Earnings</p>
          <p className="mt-1 text-3xl font-bold">₹{listenerEarnings.today}</p>
        </div>
        <button
          onClick={toggleListenerOnline}
          className={`flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold transition-colors ${
            listenerOnline
              ? "bg-white text-green-600"
              : "bg-white/15 text-white"
          }`}
        >
          {listenerOnline ? "🟢 Online" : "🔴 Offline"}
        </button>
      </div>

      {activeSession && (
        <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 text-brand-600">
              <PhoneCall className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-ink-900">{activeSession.speakerLabel}</p>
              <p className="text-xs text-gray-400">
                Active Session ·{" "}
                {activeSession.startedAt && (
                  <LiveSessionTimer
                    startedAt={activeSession.startedAt}
                    pausedSeconds={activeSession.pausedSeconds}
                  />
                )}
              </p>
            </div>
          </div>
          <Link
            to={`/listener/messages?speaker=${activeSession.speakerId}`}
            className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Join Chat
          </Link>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <p className="font-semibold text-ink-900">Earnings</p>
          <div className="mt-3 inline-flex rounded-xl bg-gray-100 p-1">
            {earningTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setEarningTab(tab)}
                className={`rounded-lg px-4 py-1.5 text-xs font-medium transition-colors ${
                  earningTab === tab
                    ? "bg-brand-600 text-white shadow-sm"
                    : "text-gray-500 hover:text-ink-900"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <p className="mt-4 text-3xl font-bold text-ink-900">
            ₹{listenerEarnings[earningKeyMap[earningTab]].toLocaleString("en-IN")}
          </p>
        </div>

        <div className="rounded-2xl bg-brand-50 p-5">
          <p className="text-sm text-gray-500">Current Earnings</p>
          <p className="mt-1 text-2xl font-bold text-ink-900">
            ₹{listenerEarnings.lifetime.toLocaleString("en-IN")}
          </p>
          <Link
            to="/listener/withdrawals"
            className="mt-4 inline-block rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Withdraw
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-5">
        <p className="font-semibold text-ink-900">Performance</p>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-5">
          {performanceCards.map((card) => (
            <div key={card.label}>
              <p className="text-xs text-gray-500">{card.label}</p>
              <p className="mt-1 text-lg font-bold text-ink-900">{card.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-brand-600" />
            <p className="font-semibold text-ink-900">Leaderboard</p>
          </div>
          <p className="mt-3 text-sm text-gray-500">Current Rank</p>
          <p className="text-3xl font-bold text-ink-900">#{listenerProfile.rank}</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-brand-600" />
            <p className="font-semibold text-ink-900">Today's Schedule</p>
          </div>
          <div className="mt-3 space-y-2">
            {todaysSchedule.map((item) => (
              <div key={item.id} className="flex items-center gap-3 text-sm">
                <span className="w-20 shrink-0 font-medium text-gray-500">
                  {item.time}
                </span>
                <span className="text-ink-900">{item.title}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-gray-400">
            No upcoming bookings yet.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-5">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-ink-900">Latest Reviews</p>
          <Link to="/listener/ratings" className="text-xs font-medium text-brand-600 hover:text-brand-700">
            View all
          </Link>
        </div>
        <div className="mt-4 space-y-4">
          {(ratingSummary?.reviews ?? []).slice(0, 3).map((review) => (
            <div key={review.id} className="border-b border-gray-50 pb-4 last:border-0 last:pb-0">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star
                    key={index}
                    className={`h-3.5 w-3.5 ${
                      index < review.rating
                        ? "fill-amber-400 text-amber-400"
                        : "text-gray-200"
                    }`}
                  />
                ))}
              </div>
              {review.comment && <p className="mt-1.5 text-sm text-gray-600">{review.comment}</p>}
              <p className="mt-1 text-xs text-gray-400">
                {new Date(review.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
          ))}
          {ratingSummary && ratingSummary.reviews.length === 0 && (
            <p className="py-6 text-center text-sm text-gray-400">No reviews yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
