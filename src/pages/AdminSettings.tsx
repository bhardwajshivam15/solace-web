import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { apiRequest, ApiError } from "../lib/apiClient";

interface PlatformSettingsData {
  sessionPricePerMinute: number;
  platformFeePercent: number;
  minWithdrawalAmount: number;
  listenerPayoutPerMinute: number;
  supportEmail: string;
  acceptanceTimeoutSeconds: number;
  reconnectionGracePeriodSeconds: number;
  minimumWalletBalance: number;
}

export default function AdminSettings() {
  const { token } = useAuth();
  const [settings, setSettings] = useState<PlatformSettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    apiRequest<{ settings: PlatformSettingsData }>("/admin/settings", { token })
      .then((response) => setSettings(response.settings))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Could not load platform settings."))
      .finally(() => setLoading(false));
  }, [token]);

  const handleNumberChange = (field: keyof Omit<PlatformSettingsData, "supportEmail">, value: string) => {
    setSettings((prev) => (prev ? { ...prev, [field]: Number(value) } : prev));
  };

  const handleEmailChange = (value: string) => {
    setSettings((prev) => (prev ? { ...prev, supportEmail: value } : prev));
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setError(null);
    try {
      const response = await apiRequest<{ settings: PlatformSettingsData }>("/admin/settings", {
        method: "PATCH",
        token,
        body: settings,
      });
      setSettings(response.settings);
      setConfirmation("Settings saved successfully.");
      window.setTimeout(() => setConfirmation(null), 2500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save these settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold text-ink-900">Settings</h1>

      {error && (
        <div className="mt-4 flex max-w-xl items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-600">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="mt-6 max-w-xl rounded-2xl border border-gray-100 bg-white p-5">
        <p className="font-semibold text-ink-900">Platform Settings</p>

        {loading && <p className="mt-4 text-sm text-gray-400">Loading…</p>}

        {!loading && settings && (
          <div className="mt-4 space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-500">
                Session Price Per Minute (₹)
              </label>
              <input
                type="number"
                value={settings.sessionPricePerMinute}
                onChange={(e) => handleNumberChange("sessionPricePerMinute", e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-ink-900 focus:border-brand-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500">Platform Fee (%)</label>
              <input
                type="number"
                value={settings.platformFeePercent}
                onChange={(e) => handleNumberChange("platformFeePercent", e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-ink-900 focus:border-brand-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500">
                Minimum Withdrawal Amount (₹)
              </label>
              <input
                type="number"
                value={settings.minWithdrawalAmount}
                onChange={(e) => handleNumberChange("minWithdrawalAmount", e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-ink-900 focus:border-brand-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500">
                Listener Payout Per Minute (₹)
              </label>
              <input
                type="number"
                value={settings.listenerPayoutPerMinute}
                onChange={(e) => handleNumberChange("listenerPayoutPerMinute", e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-ink-900 focus:border-brand-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500">Support Email</label>
              <input
                type="text"
                value={settings.supportEmail}
                onChange={(e) => handleEmailChange(e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-ink-900 focus:border-brand-400 focus:outline-none"
              />
            </div>

            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-semibold uppercase text-gray-400">Live Session Rules</p>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500">
                Acceptance Timeout (seconds)
              </label>
              <p className="text-[11px] text-gray-400">
                How long a speaker has to join after a listener accepts before the request expires.
              </p>
              <input
                type="number"
                value={settings.acceptanceTimeoutSeconds}
                onChange={(e) => handleNumberChange("acceptanceTimeoutSeconds", e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-ink-900 focus:border-brand-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500">
                Reconnection Grace Period (seconds)
              </label>
              <p className="text-[11px] text-gray-400">
                How long a dropped session stays paused waiting for both sides to reconnect.
              </p>
              <input
                type="number"
                value={settings.reconnectionGracePeriodSeconds}
                onChange={(e) => handleNumberChange("reconnectionGracePeriodSeconds", e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-ink-900 focus:border-brand-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500">
                Minimum Wallet Balance (₹)
              </label>
              <p className="text-[11px] text-gray-400">
                A speaker's active session ends automatically once their remaining balance would drop below this.
              </p>
              <input
                type="number"
                value={settings.minimumWalletBalance}
                onChange={(e) => handleNumberChange("minimumWalletBalance", e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-ink-900 focus:border-brand-400 focus:outline-none"
              />
            </div>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving || loading || !settings}
          className="mt-5 w-full rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>

        {confirmation && (
          <p className="mt-3 flex items-center justify-center gap-2 text-sm text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            {confirmation}
          </p>
        )}
      </div>
    </div>
  );
}
