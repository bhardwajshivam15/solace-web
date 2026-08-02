import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { platformSettings } from "../data/mockData";

export default function AdminSettings() {
  const [settings, setSettings] = useState(platformSettings);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  const handleNumberChange = (field: keyof Omit<typeof settings, "supportEmail">, value: string) => {
    setSettings((prev) => ({ ...prev, [field]: Number(value) }));
  };

  const handleEmailChange = (value: string) => {
    setSettings((prev) => ({ ...prev, supportEmail: value }));
  };

  const handleSave = () => {
    setConfirmation("Settings saved successfully.");
    window.setTimeout(() => setConfirmation(null), 2500);
  };

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold text-ink-900">Settings</h1>

      <div className="mt-6 max-w-xl rounded-2xl border border-gray-100 bg-white p-5">
        <p className="font-semibold text-ink-900">Platform Settings</p>

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
        </div>

        <button
          onClick={handleSave}
          className="mt-5 w-full rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Save Changes
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
