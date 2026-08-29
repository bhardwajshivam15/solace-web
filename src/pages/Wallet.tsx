import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Wallet as WalletIcon, ArrowDownLeft, ArrowUpRight, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useAppData } from "../context/AppDataContext";
import { apiRequest, ApiError } from "../lib/apiClient";
import { useAuth } from "../context/AuthContext";

const quickAmounts = [500, 1000, 2000, 5000];
const COUPON_CHECK_DEBOUNCE_MS = 450;

type CouponStatus = "idle" | "checking" | "valid" | "invalid";

export default function Wallet() {
  const { walletBalance, transactions, addMoney } = useAppData();
  const { token } = useAuth();
  const [selectedAmount, setSelectedAmount] = useState(1000);
  const [couponCode, setCouponCode] = useState("");
  const [couponStatus, setCouponStatus] = useState<CouponStatus>("idle");
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Live preview as the code is typed, debounced — matches the same
  // idle/checking/valid/invalid UX convention used for username availability
  // on the signup form, so a green "you'll get ₹X" here can never be
  // contradicted by a surprise rejection at actual submit.
  useEffect(() => {
    const code = couponCode.trim();
    if (!code) {
      setCouponStatus("idle");
      setCouponMessage(null);
      return;
    }
    setCouponStatus("checking");
    const handle = setTimeout(() => {
      apiRequest<{ valid: boolean; message: string | null }>(
        `/speaker/wallet/coupons/validate?code=${encodeURIComponent(code)}&amount=${selectedAmount}`,
        { token },
      )
        .then((result) => {
          setCouponStatus(result.valid ? "valid" : "invalid");
          setCouponMessage(result.message);
        })
        .catch(() => {
          setCouponStatus("idle");
          setCouponMessage(null);
        });
    }, COUPON_CHECK_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [couponCode, selectedAmount, token]);

  const handleAddMoney = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const result = await addMoney(selectedAmount, couponCode.trim() || undefined);
      setConfirmation(
        result.bonusApplied > 0
          ? `Added ₹${selectedAmount.toLocaleString("en-IN")} + ₹${result.bonusApplied.toLocaleString("en-IN")} bonus to your wallet.`
          : `Added ₹${selectedAmount.toLocaleString("en-IN")} to your wallet.`,
      );
      setCouponCode("");
      setCouponStatus("idle");
      window.setTimeout(() => setConfirmation(null), 3000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not add money to your wallet. Please try again.");
    } finally {
      setSubmitting(false);
    }
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

      <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-5">
        <label className="text-sm font-medium text-gray-500">Coupon Code (optional)</label>
        <input
          value={couponCode}
          onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
          placeholder="e.g. WELCOME50"
          className="mt-1.5 w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm uppercase text-ink-900 outline-none focus:border-brand-400"
        />
        <div className="mt-1.5 flex items-center gap-1 text-xs">
          {couponStatus === "checking" && (
            <span className="flex items-center gap-1 text-gray-400">
              <Loader2 className="h-3 w-3 animate-spin" /> Checking code…
            </span>
          )}
          {couponStatus === "valid" && (
            <span className="flex items-center gap-1 text-green-600">
              <CheckCircle2 className="h-3 w-3" /> {couponMessage}
            </span>
          )}
          {couponStatus === "invalid" && (
            <span className="flex items-center gap-1 text-red-500">
              <AlertCircle className="h-3 w-3" /> {couponMessage}
            </span>
          )}
        </div>

        {error && (
          <p className="mt-3 flex items-center gap-1.5 text-sm text-red-500">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </p>
        )}

        <button
          onClick={handleAddMoney}
          disabled={submitting || couponStatus === "checking" || couponStatus === "invalid"}
          className="mt-4 w-full rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Adding…" : "Add Money"}
        </button>
        {confirmation && (
          <p className="mt-3 flex items-center justify-center gap-2 text-sm text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            {confirmation}
          </p>
        )}
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
