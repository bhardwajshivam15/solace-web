import { useState } from "react";
import { Link } from "react-router-dom";
import { Wallet as WalletIcon, ArrowDownLeft, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { useAppData } from "../context/AppDataContext";

const quickAmounts = [500, 1000, 2000, 5000];

export default function Wallet() {
  const { walletBalance, transactions, addMoney } = useAppData();
  const [selectedAmount, setSelectedAmount] = useState(1000);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  const handleAddMoney = () => {
    addMoney(selectedAmount);
    setConfirmation(`Added ₹${selectedAmount.toLocaleString("en-IN")} to your wallet.`);
    window.setTimeout(() => setConfirmation(null), 2500);
  };

  return (
    <div className="mx-auto max-w-3xl p-8">
      <h1 className="text-xl font-bold text-ink-900">Wallet</h1>

      <div className="mt-6 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-white shadow-soft">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-brand-100">Current Balance</p>
            <p className="mt-1 text-3xl font-bold">
              ₹ {walletBalance.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
            <WalletIcon className="h-7 w-7" />
          </div>
        </div>
        <button
          onClick={handleAddMoney}
          className="mt-5 w-full rounded-xl bg-white py-3 text-sm font-semibold text-brand-700 hover:bg-brand-50"
        >
          Add Money
        </button>
        {confirmation && (
          <p className="mt-3 flex items-center justify-center gap-2 text-sm text-brand-50">
            <CheckCircle2 className="h-4 w-4" />
            {confirmation}
          </p>
        )}
      </div>

      <div className="mt-6">
        <p className="text-sm font-medium text-gray-500">Quick Amount</p>
        <div className="mt-3 flex flex-wrap gap-3">
          {quickAmounts.map((amount) => (
            <button
              key={amount}
              onClick={() => setSelectedAmount(amount)}
              className={`rounded-xl border px-6 py-2.5 text-sm font-semibold transition-colors ${
                selectedAmount === amount
                  ? "border-brand-600 bg-brand-50 text-brand-700"
                  : "border-gray-200 text-gray-600 hover:border-brand-200"
              }`}
            >
              ₹{amount.toLocaleString("en-IN")}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-500">
            Transaction History
          </p>
          <Link
            to="/app/transactions"
            className="text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            View All
          </Link>
        </div>

        <div className="mt-3 divide-y divide-gray-100 rounded-2xl border border-gray-100">
          {transactions.slice(0, 5).map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center gap-3 px-4 py-3.5"
            >
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
        </div>
      </div>
    </div>
  );
}
