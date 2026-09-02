import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../lib/apiClient";
import type { AdminWithdrawalRequestRecord } from "../types";

const statusStyles: Record<string, string> = {
  PROCESSING: "bg-amber-50 text-amber-600",
  SUCCESS: "bg-green-50 text-green-600",
  FAILED: "bg-red-50 text-red-500",
};

// Read-only — withdrawals are fully automatic (PayoutService.requestWithdrawal
// on the backend). There is no approve/reject action here, or anywhere else
// in the app; this page exists purely for visibility into what's happened.
export default function AdminWithdrawals() {
  const { token } = useAuth();
  const [withdrawals, setWithdrawals] = useState<AdminWithdrawalRequestRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<{ data: AdminWithdrawalRequestRecord[] }>("/admin/withdrawals", { token })
      .then((response) => setWithdrawals(response.data))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold text-ink-900">Withdrawals</h1>
      <p className="mt-1 text-sm text-gray-400">
        Automatic — listeners are paid out the moment they request a withdrawal. Nothing here needs action.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <p className="text-sm text-gray-500">Total Requests</p>
          <p className="mt-2 text-2xl font-bold text-ink-900">{withdrawals.length}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <p className="text-sm text-gray-500">Processing</p>
          <p className="mt-2 text-2xl font-bold text-ink-900">
            {withdrawals.filter((w) => w.status === "PROCESSING").length}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <p className="text-sm text-gray-500">Paid</p>
          <p className="mt-2 text-2xl font-bold text-ink-900">
            {withdrawals.filter((w) => w.status === "SUCCESS").length}
          </p>
        </div>
      </div>

      <div className="mt-6 divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white">
        {withdrawals.map((request) => (
          <div key={request.id} className="flex items-center gap-3 px-5 py-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
              {request.listenerName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-ink-900">{request.listenerName}</p>
              <p className="text-xs text-gray-400">
                {new Date(request.createdAt).toLocaleDateString("en-IN")}
                {request.failureReason ? ` · ${request.failureReason}` : ""}
              </p>
            </div>
            <div className="hidden w-24 sm:block">
              <p className="text-xs text-gray-400">Amount</p>
              <p className="text-sm font-semibold text-ink-900">
                ₹{request.amount.toLocaleString("en-IN")}
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyles[request.status]}`}
            >
              {request.status}
            </span>
          </div>
        ))}

        {!loading && withdrawals.length === 0 && (
          <p className="py-6 text-center text-sm text-gray-400">No withdrawals yet.</p>
        )}
      </div>
    </div>
  );
}
