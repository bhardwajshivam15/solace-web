import { useState } from "react";
import { Banknote } from "lucide-react";
import { listenerWithdrawalHistory } from "../data/mockData";
import { useAppData } from "../context/AppDataContext";
import type { ListenerWithdrawalRecord } from "../types";

let uid = 1;
const nextId = () => `lw-new-${uid++}`;

const statusStyles: Record<string, string> = {
  Pending: "bg-amber-50 text-amber-600",
  Approved: "bg-green-50 text-green-600",
  Paid: "bg-green-50 text-green-600",
  Rejected: "bg-red-50 text-red-500",
};

export default function Withdrawals() {
  const { walletBalance } = useAppData();
  const [history, setHistory] = useState<ListenerWithdrawalRecord[]>(
    listenerWithdrawalHistory,
  );
  const [amount, setAmount] = useState(1000);
  const [method, setMethod] = useState<"Bank" | "UPI">("Bank");
  const [confirmation, setConfirmation] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!amount || amount <= 0) return;
    setHistory((prev) => [
      {
        id: nextId(),
        amount,
        date: "Today",
        status: "Pending",
        method,
      },
      ...prev,
    ]);
    setConfirmation(`Withdrawal request for ₹${amount.toLocaleString("en-IN")} submitted.`);
    window.setTimeout(() => setConfirmation(null), 2500);
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
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-gray-500">Amount</label>
            <input
              type="number"
              value={amount}
              onChange={(event) => setAmount(Number(event.target.value))}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-ink-900"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Method</label>
            <select
              value={method}
              onChange={(event) => setMethod(event.target.value as "Bank" | "UPI")}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-ink-900"
            >
              <option value="Bank">Bank Transfer</option>
              <option value="UPI">UPI</option>
            </select>
          </div>
        </div>
        <button
          onClick={handleSubmit}
          className="mt-4 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Request Withdrawal
        </button>
        {confirmation && (
          <p className="mt-3 text-sm text-green-600">{confirmation}</p>
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
                  {record.date} · {record.method === "Bank" ? "Bank Transfer" : "UPI"}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyles[record.status]}`}
              >
                {record.status}
              </span>
            </div>
          ))}

          {history.length === 0 && (
            <p className="py-6 text-center text-sm text-gray-400">
              No withdrawal history yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
