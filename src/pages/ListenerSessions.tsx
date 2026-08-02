import { useState } from "react";
import { Star } from "lucide-react";
import { listenerSessionHistory } from "../data/mockData";

const tabs = ["All", "Completed", "Cancelled"] as const;
type Tab = (typeof tabs)[number];

const statusStyles: Record<string, string> = {
  completed: "bg-green-50 text-green-600",
  cancelled: "bg-red-50 text-red-500",
};

export default function ListenerSessions() {
  const [tab, setTab] = useState<Tab>("All");

  const filtered = listenerSessionHistory.filter((session) => {
    if (tab === "All") return true;
    return session.status === tab.toLowerCase();
  });

  return (
    <div className="mx-auto max-w-3xl p-8">
      <h1 className="text-xl font-bold text-ink-900">Sessions</h1>

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
            <div className="flex-1">
              <p className="font-semibold text-ink-900">
                {session.speakerLabel}
              </p>
              <p className="text-xs text-gray-400">
                {session.date} · {session.time}
              </p>
            </div>

            <div className="text-center">
              <p className="text-sm font-semibold text-ink-900">
                {session.duration}
              </p>
              <span
                className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-medium capitalize ${
                  statusStyles[session.status]
                }`}
              >
                {session.status}
              </span>
            </div>

            <div className="w-24 text-right">
              <p className="font-semibold text-ink-900">₹{session.earning}</p>
              {session.status === "completed" && (
                <div className="mt-1 flex items-center justify-end gap-0.5">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star
                      key={index}
                      className={`h-3.5 w-3.5 ${
                        index < session.rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-gray-200"
                      }`}
                    />
                  ))}
                </div>
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
