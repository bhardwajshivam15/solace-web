import { topListeners } from "../data/mockData";

const medals = ["🥇", "🥈", "🥉"];

export default function AdminLeaderboard() {
  return (
    <div className="p-8">
      <h1 className="text-xl font-bold text-ink-900">Leaderboard</h1>

      <div className="mt-6 divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white">
        {topListeners.map((listener, index) => (
          <div key={listener.id} className="flex items-center gap-4 px-5 py-4">
            <span className="flex w-8 items-center justify-center text-lg font-semibold text-gray-400">
              {medals[index] ?? index + 1}
            </span>
            <img
              src={listener.avatar}
              alt={listener.name}
              className="h-10 w-10 rounded-full object-cover"
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-ink-900">{listener.name}</p>
              <p className="text-xs text-gray-400">
                {listener.sessions} sessions · ★ {listener.rating}
              </p>
            </div>
            <p className="text-sm font-semibold text-ink-900">
              ₹{listener.revenue.toLocaleString("en-IN")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
