import { useState } from "react";
import { Check, X } from "lucide-react";
import { withdrawalRequests as seedWithdrawalRequests } from "../data/mockData";

const statusStyles: Record<string, string> = {
  Pending: "bg-amber-50 text-amber-600",
  Approved: "bg-green-50 text-green-600",
  Rejected: "bg-red-50 text-red-500",
};

export default function AdminWithdrawals() {
  const [withdrawals, setWithdrawals] = useState(seedWithdrawalRequests);

  const setWithdrawalStatus = (id: string, status: "Approved" | "Rejected") => {
    setWithdrawals((prev) =>
      prev.map((request) => (request.id === id ? { ...request, status } : request)),
    );
  };

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold text-ink-900">Withdrawals</h1>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <p className="text-sm text-gray-500">Total Requests</p>
          <p className="mt-2 text-2xl font-bold text-ink-900">{withdrawals.length}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="mt-2 text-2xl font-bold text-ink-900">
            {withdrawals.filter((w) => w.status === "Pending").length}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <p className="text-sm text-gray-500">Approved</p>
          <p className="mt-2 text-2xl font-bold text-ink-900">
            {withdrawals.filter((w) => w.status === "Approved").length}
          </p>
        </div>
      </div>

      <div className="mt-6 divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white">
        {withdrawals.map((request) => (
          <div key={request.id} className="flex items-center gap-3 px-5 py-4">
            <img
              src={request.avatar}
              alt={request.name}
              className="h-9 w-9 rounded-full object-cover"
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-ink-900">{request.name}</p>
              <p className="text-xs text-gray-400">{request.date}</p>
            </div>
            <div className="hidden w-24 sm:block">
              <p className="text-xs text-gray-400">Amount</p>
              <p className="text-sm font-semibold text-ink-900">
                {request.amount != null ? `₹${request.amount.toLocaleString("en-IN")}` : "—"}
              </p>
            </div>
            <div className="hidden w-20 sm:block">
              <p className="text-xs text-gray-400">Method</p>
              <p className="text-sm text-ink-900">{request.method ?? "—"}</p>
            </div>
            {request.status === "Pending" ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setWithdrawalStatus(request.id, "Approved")}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-green-50 text-green-600 hover:bg-green-100"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setWithdrawalStatus(request.id, "Rejected")}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyles[request.status]}`}
              >
                {request.status}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
