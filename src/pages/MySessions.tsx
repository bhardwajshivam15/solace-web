import { useState } from "react";
import { Star } from "lucide-react";
import { useAppData } from "../context/AppDataContext";

const tabs = ["All", "Completed", "Cancelled"] as const;
type Tab = (typeof tabs)[number];

function RatingCell({
  sessionId,
  rating,
  onRate,
}: {
  sessionId: string;
  rating: number;
  onRate: (sessionId: string, rating: number) => void;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            onClick={() => {
              onRate(sessionId, value);
              setEditing(false);
            }}
          >
            <Star
              className={`h-4 w-4 ${
                value <= rating
                  ? "fill-amber-400 text-amber-400"
                  : "text-gray-300"
              }`}
            />
          </button>
        ))}
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="text-xs font-medium text-brand-600 hover:text-brand-700"
    >
      {rating > 0 ? (
        <span className="flex items-center gap-1 text-gray-500">
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
          {rating.toFixed(1)}
        </span>
      ) : (
        "Rate"
      )}
    </button>
  );
}

export default function MySessions() {
  const { sessions, rateSession } = useAppData();
  const [tab, setTab] = useState<Tab>("All");

  const filtered = sessions.filter((session) => {
    if (tab === "All") return true;
    return session.status === tab.toLowerCase();
  });

  return (
    <div className="mx-auto max-w-3xl p-8">
      <h1 className="text-xl font-bold text-ink-900">My Sessions</h1>

      <div className="mt-5 inline-flex rounded-xl bg-gray-100 p-1">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-5 py-2 text-sm font-medium transition-colors ${
              tab === t
                ? "bg-brand-600 text-white shadow-sm"
                : "text-gray-500 hover:text-ink-900"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-3">
        {filtered.map((session) => (
          <div
            key={session.id}
            className="flex items-center gap-4 rounded-2xl border border-gray-100 p-4"
          >
            <img
              src={session.avatar}
              alt={session.listenerName}
              className="h-12 w-12 rounded-full object-cover"
            />

            <div className="flex-1">
              <p className="font-semibold text-ink-900">
                {session.listenerName}
              </p>
              <p className="text-xs text-gray-400">
                {session.date} · {session.time}
              </p>
            </div>

            <div className="text-center">
              <p className="text-sm font-semibold text-ink-900">
                {session.duration}
              </p>
              <p className="text-xs capitalize text-gray-400">
                {session.status}
              </p>
            </div>

            <div className="w-20 text-right">
              <p className="font-semibold text-ink-900">₹{session.amount}</p>
              {session.status === "completed" && (
                <RatingCell
                  sessionId={session.id}
                  rating={session.rating}
                  onRate={rateSession}
                />
              )}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-gray-400">
            No sessions here yet.
          </p>
        )}
      </div>
    </div>
  );
}
