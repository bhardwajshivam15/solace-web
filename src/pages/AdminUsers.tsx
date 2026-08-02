import { useState } from "react";
import { platformUsers as seedPlatformUsers } from "../data/mockData";

const statusStyles: Record<string, string> = {
  Active: "bg-green-50 text-green-600",
  Suspended: "bg-red-50 text-red-500",
};

export default function AdminUsers() {
  const [users, setUsers] = useState(seedPlatformUsers);

  const toggleStatus = (id: string) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === id
          ? { ...user, status: user.status === "Active" ? "Suspended" : "Active" }
          : user,
      ),
    );
  };

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold text-ink-900">Users</h1>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <p className="text-sm text-gray-500">Total Users</p>
          <p className="mt-2 text-2xl font-bold text-ink-900">{users.length}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <p className="text-sm text-gray-500">Active</p>
          <p className="mt-2 text-2xl font-bold text-ink-900">
            {users.filter((u) => u.status === "Active").length}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <p className="text-sm text-gray-500">Suspended</p>
          <p className="mt-2 text-2xl font-bold text-ink-900">
            {users.filter((u) => u.status === "Suspended").length}
          </p>
        </div>
      </div>

      <div className="mt-6 divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white">
        {users.map((user) => (
          <div key={user.id} className="flex items-center gap-3 px-5 py-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-ink-900">{user.name}</p>
              <p className="text-xs text-gray-400">{user.email}</p>
            </div>
            <div className="hidden w-28 sm:block">
              <p className="text-xs text-gray-400">Joined</p>
              <p className="text-sm text-ink-900">{user.joinedDate}</p>
            </div>
            <div className="hidden w-24 sm:block">
              <p className="text-xs text-gray-400">Sessions</p>
              <p className="text-sm text-ink-900">{user.sessionsCount}</p>
            </div>
            <div className="hidden w-24 sm:block">
              <p className="text-xs text-gray-400">Wallet</p>
              <p className="text-sm font-semibold text-ink-900">
                ₹{user.walletBalance.toLocaleString("en-IN")}
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyles[user.status]}`}
            >
              {user.status}
            </span>
            <button
              onClick={() => toggleStatus(user.id)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                user.status === "Active"
                  ? "border-red-200 text-red-500 hover:bg-red-50"
                  : "border-green-200 text-green-600 hover:bg-green-50"
              }`}
            >
              {user.status === "Active" ? "Suspend" : "Reinstate"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
