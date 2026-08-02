import { ArrowDownLeft, ArrowUpRight, Banknote, RotateCcw } from "lucide-react";
import { platformTransactions } from "../data/mockData";

const statusStyles: Record<string, string> = {
  Success: "bg-green-50 text-green-600",
  Pending: "bg-amber-50 text-amber-600",
  Failed: "bg-red-50 text-red-500",
};

const typeIcons: Record<string, typeof ArrowDownLeft> = {
  "Top-up": ArrowDownLeft,
  Session: ArrowUpRight,
  Withdrawal: Banknote,
  Refund: RotateCcw,
};

export default function AdminTransactions() {
  return (
    <div className="p-8">
      <h1 className="text-xl font-bold text-ink-900">Transactions</h1>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <p className="text-sm text-gray-500">Total Transactions</p>
          <p className="mt-2 text-2xl font-bold text-ink-900">
            {platformTransactions.length}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <p className="text-sm text-gray-500">Successful</p>
          <p className="mt-2 text-2xl font-bold text-ink-900">
            {platformTransactions.filter((t) => t.status === "Success").length}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <p className="text-sm text-gray-500">Failed</p>
          <p className="mt-2 text-2xl font-bold text-ink-900">
            {platformTransactions.filter((t) => t.status === "Failed").length}
          </p>
        </div>
      </div>

      <div className="mt-6 divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white">
        {platformTransactions.map((transaction) => {
          const Icon = typeIcons[transaction.type] ?? ArrowUpRight;
          return (
            <div key={transaction.id} className="flex items-center gap-3 px-5 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-ink-900">{transaction.user}</p>
                <p className="text-xs text-gray-400">{transaction.type}</p>
              </div>
              <div className="hidden w-28 sm:block">
                <p className="text-xs text-gray-400">Date</p>
                <p className="text-sm text-ink-900">{transaction.date}</p>
              </div>
              <p className="w-20 text-right text-sm font-semibold text-ink-900">
                ₹{transaction.amount.toLocaleString("en-IN")}
              </p>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyles[transaction.status]}`}
              >
                {transaction.status}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
