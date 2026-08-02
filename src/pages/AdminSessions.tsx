import { platformSessions } from "../data/mockData";

const statusStyles: Record<string, string> = {
  completed: "bg-green-50 text-green-600",
  cancelled: "bg-gray-100 text-gray-500",
  ongoing: "bg-amber-50 text-amber-600",
};

const statusLabels: Record<string, string> = {
  completed: "Completed",
  cancelled: "Cancelled",
  ongoing: "Ongoing",
};

export default function AdminSessions() {
  return (
    <div className="p-8">
      <h1 className="text-xl font-bold text-ink-900">Sessions</h1>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <p className="text-sm text-gray-500">Total Sessions</p>
          <p className="mt-2 text-2xl font-bold text-ink-900">{platformSessions.length}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <p className="text-sm text-gray-500">Completed</p>
          <p className="mt-2 text-2xl font-bold text-ink-900">
            {platformSessions.filter((s) => s.status === "completed").length}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <p className="text-sm text-gray-500">Ongoing</p>
          <p className="mt-2 text-2xl font-bold text-ink-900">
            {platformSessions.filter((s) => s.status === "ongoing").length}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <p className="text-sm text-gray-500">Cancelled</p>
          <p className="mt-2 text-2xl font-bold text-ink-900">
            {platformSessions.filter((s) => s.status === "cancelled").length}
          </p>
        </div>
      </div>

      <div className="mt-6 divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white">
        {platformSessions.map((session) => (
          <div key={session.id} className="flex items-center gap-3 px-5 py-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-ink-900">
                {session.speaker} <span className="text-gray-400">→</span> {session.listener}
              </p>
              <p className="text-xs text-gray-400">{session.date}</p>
            </div>
            <div className="hidden w-24 sm:block">
              <p className="text-xs text-gray-400">Duration</p>
              <p className="text-sm text-ink-900">{session.duration}</p>
            </div>
            <div className="hidden w-24 sm:block">
              <p className="text-xs text-gray-400">Amount</p>
              <p className="text-sm font-semibold text-ink-900">₹{session.amount}</p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyles[session.status]}`}
            >
              {statusLabels[session.status]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
