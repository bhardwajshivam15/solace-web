import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Banknote, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAppData } from "../context/AppDataContext";
import { useAuth } from "../context/AuthContext";
import { apiRequest, ApiError } from "../lib/apiClient";
import type { PayoutDestination, WithdrawalRequestRecord } from "../types";

const MIN_WITHDRAWAL = 100;

const statusStyles: Record<string, string> = {
  PROCESSING: "bg-amber-50 text-amber-600",
  SUCCESS: "bg-green-50 text-green-600",
  FAILED: "bg-red-50 text-red-500",
};

const statusLabels: Record<string, string> = {
  PROCESSING: "Processing",
  SUCCESS: "Paid",
  FAILED: "Failed",
};

export default function Withdrawals() {
  const { walletBalance } = useAppData();
  const { token } = useAuth();
  const [history, setHistory] = useState<WithdrawalRequestRecord[]>([]);
  const [destination, setDestination] = useState<PayoutDestination | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState(1000);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      apiRequest<{ data: WithdrawalRequestRecord[] }>("/listener/withdrawals", { token }),
      apiRequest<PayoutDestination | null>("/listener/payout-destination", { token }),
    ])
      .then(([historyResponse, destinationResponse]) => {
        setHistory(historyResponse.data);
        setDestination(destinationResponse);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async () => {
    if (!amount || amount < MIN_WITHDRAWAL) return;
    setSubmitting(true);
    setError(null);
    setConfirmation(null);
    try {
      const request = await apiRequest<WithdrawalRequestRecord>("/listener/withdrawals", {
        method: "POST",
        token,
        body: { amount },
      });
      setHistory((prev) => [request, ...prev]);
      setConfirmation(`Withdrawal of ₹${amount.toLocaleString("en-IN")} is on its way.`);
      window.setTimeout(() => setConfirmation(null), 4000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not submit that withdrawal.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl p-8">
      <h1 className="text-xl font-bold text-ink-900">Withdrawals</h1>

      <div className="mt-6 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-white shadow-soft">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-brand-100">Available Balance</p>
            <p className="mt-1 text-3xl font-bold">
              ₹{walletBalance.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
            <Banknote className="h-7 w-7" />
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-5">
        <p className="font-semibold text-ink-900">Request Withdrawal</p>
        <p className="mt-1 text-xs text-gray-400">
          Withdrawals are automatic — sent straight to your saved payout method, no approval wait.
        </p>

        {!loading && !destination && (
          <p className="mt-4 flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Add a bank account or UPI ID in{" "}
            <Link to="/listener/settings" className="font-semibold underline">
              Settings
            </Link>{" "}
            before requesting a withdrawal.
          </p>
        )}

        <div className="mt-4">
          <label className="text-xs font-medium text-gray-500">Amount (min ₹{MIN_WITHDRAWAL})</label>
          <input
            type="number"
            value={amount}
            onChange={(event) => setAmount(Number(event.target.value))}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-ink-900 sm:w-48"
          />
        </div>

        {error && (
          <p className="mt-3 flex items-center gap-1.5 text-sm text-red-500">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={submitting || !destination || amount < MIN_WITHDRAWAL || amount > walletBalance}
          className="mt-4 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Requesting…" : "Request Withdrawal"}
        </button>
        {confirmation && (
          <p className="mt-3 flex items-center gap-1.5 text-sm text-green-600">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {confirmation}
          </p>
        )}
      </div>

      <div className="mt-6">
        <p className="text-sm font-medium text-gray-500">Withdrawal History</p>
        <div className="mt-3 divide-y divide-gray-100 rounded-2xl border border-gray-100">
          {history.map((record) => (
            <div
              key={record.id}
              className="flex items-center justify-between px-4 py-3.5"
            >
              <div>
                <p className="text-sm font-medium text-ink-900">
                  ₹{record.amount.toLocaleString("en-IN")}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(record.createdAt).toLocaleDateString("en-IN")}
                  {record.failureReason ? ` · ${record.failureReason}` : ""}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyles[record.status]}`}
              >
                {statusLabels[record.status]}
              </span>
            </div>
          ))}

          {!loading && history.length === 0 && (
            <p className="py-6 text-center text-sm text-gray-400">
              No withdrawal history yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
