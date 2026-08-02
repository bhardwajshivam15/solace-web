import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { speakerProfile } from "../data/mockData";

type PrefKey = "email" | "push" | "sms";

const prefLabels: Record<PrefKey, string> = {
  email: "Email notifications",
  push: "Push notifications",
  sms: "SMS notifications",
};

export default function Settings() {
  const [email, setEmail] = useState("guest.speaker@solace.app");
  const [preferences, setPreferences] = useState(
    speakerProfile.notificationPreferences,
  );

  const togglePreference = (key: PrefKey) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="mx-auto max-w-2xl p-8">
      <h1 className="text-xl font-bold text-ink-900">Settings</h1>

      <div className="mt-5 rounded-2xl border border-gray-100 p-6">
        <p className="font-semibold text-ink-900">Account</p>
        <div className="mt-4">
          <label className="text-xs font-medium text-gray-500">
            Email address
          </label>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-ink-900 outline-none focus:border-brand-300"
          />
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-gray-100 p-6">
        <p className="font-semibold text-ink-900">Notifications</p>
        <div className="mt-4 space-y-3">
          {(Object.keys(prefLabels) as PrefKey[]).map((key) => (
            <div
              key={key}
              className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3"
            >
              <p className="text-sm font-medium text-ink-900">
                {prefLabels[key]}
              </p>
              <button
                onClick={() => togglePreference(key)}
                className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                  preferences[key]
                    ? "bg-brand-600 text-white"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {preferences[key] ? "On" : "Off"}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-red-200 bg-red-50/40 p-6">
        <div className="flex items-center gap-2 text-red-500">
          <AlertTriangle className="h-4 w-4" />
          <p className="font-semibold">Danger Zone</p>
        </div>
        <p className="mt-2 text-sm text-red-500/80">
          Deleting your account is permanent and will remove your wallet
          balance, session history, and messages. This cannot be undone.
        </p>
        <button
          disabled
          className="mt-4 cursor-not-allowed rounded-lg border border-red-200 bg-white px-5 py-2.5 text-sm font-semibold text-red-400 opacity-60"
        >
          Delete Account
        </button>
      </div>
    </div>
  );
}
