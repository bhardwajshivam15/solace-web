import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { useAppData } from "../context/AppDataContext";

export default function Transactions() {
  const { transactions } = useAppData();

  const totalCredit = transactions
    .filter((t) => t.direction === "credit")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalDebit = transactions
    .filter((t) => t.direction === "debit")
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="mx-auto max-w-3xl p-8">
      <h1 className="text-xl font-bold text-ink-900">Transactions</h1>

      <div className="mt-5 grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-gray-100 p-4">
          <p className="text-xs text-gray-500">Total Added</p>
          <p className="mt-1 text-lg font-bold text-green-600">
            +₹{totalCredit.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-100 p-4">
          <p className="text-xs text-gray-500">Total Spent</p>
          <p className="mt-1 text-lg font-bold text-red-500">
            -₹{totalDebit.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      <div className="mt-6 divide-y divide-gray-100 rounded-2xl border border-gray-100">
        {transactions.map((transaction) => (
          <div key={transaction.id} className="flex items-center gap-3 px-4 py-3.5">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                transaction.direction === "credit"
                  ? "bg-green-50 text-green-600"
                  : "bg-red-50 text-red-500"
              }`}
            >
              {transaction.direction === "credit" ? (
                <ArrowDownLeft className="h-5 w-5" />
              ) : (
                <ArrowUpRight className="h-5 w-5" />
              )}
            </div>

            <div className="flex-1">
              <p className="text-sm font-medium text-ink-900">
                {transaction.title}
              </p>
              <p className="text-xs text-gray-400">{transaction.subtitle}</p>
            </div>

            <p
              className={`text-sm font-semibold ${
                transaction.direction === "credit"
                  ? "text-green-600"
                  : "text-red-500"
              }`}
            >
              {transaction.direction === "credit" ? "+" : "-"}₹
              {transaction.amount}
            </p>
          </div>
        ))}

        {transactions.length === 0 && (
          <p className="py-10 text-center text-sm text-gray-400">
            No transactions yet.
          </p>
        )}
      </div>
    </div>
  );
}
