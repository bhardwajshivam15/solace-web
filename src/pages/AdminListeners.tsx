import { useState } from "react";
import { BadgeCheck } from "lucide-react";
import { adminListeners as seedAdminListeners } from "../data/mockData";

const statusStyles: Record<string, string> = {
  Online: "bg-green-50 text-green-600",
  Offline: "bg-gray-100 text-gray-500",
};

export default function AdminListeners() {
  const [listeners, setListeners] = useState(seedAdminListeners);

  const toggleStatus = (id: string) => {
    setListeners((prev) =>
      prev.map((listener) =>
        listener.id === id
          ? {
              ...listener,
              status: listener.status === "Online" ? "Offline" : "Online",
            }
          : listener,
      ),
    );
  };

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold text-ink-900">Listeners</h1>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <p className="text-sm text-gray-500">Total Listeners</p>
          <p className="mt-2 text-2xl font-bold text-ink-900">{listeners.length}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <p className="text-sm text-gray-500">Online</p>
          <p className="mt-2 text-2xl font-bold text-ink-900">
            {listeners.filter((l) => l.status === "Online").length}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <p className="text-sm text-gray-500">Verified</p>
          <p className="mt-2 text-2xl font-bold text-ink-900">
            {listeners.filter((l) => l.verified).length}
          </p>
        </div>
      </div>

      <div className="mt-6 divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white">
        {listeners.map((listener) => (
          <div key={listener.id} className="flex items-center gap-3 px-5 py-4">
            <img
              src={listener.avatar}
              alt={listener.name}
              className="h-9 w-9 rounded-full object-cover"
            />
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium text-ink-900">{listener.name}</p>
                {listener.verified && (
                  <BadgeCheck className="h-4 w-4 text-brand-600" />
                )}
              </div>
              <p className="text-xs text-gray-400">Joined {listener.joinedDate}</p>
            </div>
            <div className="hidden w-20 sm:block">
              <p className="text-xs text-gray-400">Rating</p>
              <p className="text-sm text-ink-900">★ {listener.rating}</p>
            </div>
            <div className="hidden w-24 sm:block">
              <p className="text-xs text-gray-400">Sessions</p>
              <p className="text-sm text-ink-900">{listener.sessions}</p>
            </div>
            <div className="hidden w-28 sm:block">
              <p className="text-xs text-gray-400">Earnings</p>
              <p className="text-sm font-semibold text-ink-900">
                ₹{listener.earnings.toLocaleString("en-IN")}
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyles[listener.status]}`}
            >
              {listener.status}
            </span>
            <button
              onClick={() => toggleStatus(listener.id)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                listener.status === "Online"
                  ? "border-red-200 text-red-500 hover:bg-red-50"
                  : "border-green-200 text-green-600 hover:bg-green-50"
              }`}
            >
              {listener.status === "Online" ? "Suspend" : "Reinstate"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
