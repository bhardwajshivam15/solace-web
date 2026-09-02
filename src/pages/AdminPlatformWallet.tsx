import { useEffect, useState } from "react";
import { Wallet, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { apiRequest, ApiError } from "../lib/apiClient";

interface PlatformWalletTransaction {
  id: string;
  amount: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
}

export default function AdminPlatformWallet() {
  const { token } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<PlatformWalletTransaction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiRequest<{ balance: number }>("/admin/platform-wallet", { token }),
      apiRequest<{ data: PlatformWalletTransaction[] }>("/admin/platform-wallet/transactions", { token }),
    ])
      .then(([walletResponse, transactionsResponse]) => {
        setBalance(Number(walletResponse.balance));
        setTransactions(transactionsResponse.data);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Could not load the platform wallet."))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold text-ink-900">Platform Wallet</h1>
      <p className="mt-1 text-sm text-gray-500">
        The company's own real running balance — credited automatically with its commission cut the instant a
        session's billing is finalized. No withdrawal flow exists yet; this is a read-only ledger for now.
      </p>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-600">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="mt-6 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-white shadow-soft">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-brand-100">Current Balance</p>
            <p className="mt-1 text-3xl font-bold">
              {loading ? "…" : `₹${(balance ?? 0).toLocaleString("en-IN")}`}
            </p>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
            <Wallet className="h-7 w-7" />
          </div>
        </div>
      </div>

      <div className="mt-6">
        <p className="text-sm font-medium text-gray-500">Commission History</p>
        <div className="mt-3 divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white">
          {loading && <p className="px-5 py-6 text-center text-sm text-gray-400">Loading…</p>}

          {!loading &&
            transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center gap-3 px-5 py-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink-900">{transaction.description}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(transaction.createdAt).toLocaleString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-green-600">+₹{transaction.amount.toFixed(2)}</p>
                  <p className="text-xs text-gray-400">Balance: ₹{transaction.balanceAfter.toFixed(2)}</p>
                </div>
              </div>
            ))}

          {!loading && transactions.length === 0 && (
            <p className="px-5 py-6 text-center text-sm text-gray-400">No commission recorded yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
