import { useState } from "react";

const notificationLabels: { key: "email" | "push" | "sms"; label: string }[] = [
  { key: "email", label: "Email Notifications" },
  { key: "push", label: "Push Notifications" },
  { key: "sms", label: "SMS Notifications" },
];

export default function ListenerSettings() {
  const [email, setEmail] = useState("aarohi@solace.app");
  const [payoutMethod, setPayoutMethod] = useState<"Bank" | "UPI">("Bank");
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: true,
  });

  const toggleNotification = (key: "email" | "push" | "sms") => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="mx-auto max-w-3xl p-8">
      <h1 className="text-xl font-bold text-ink-900">Settings</h1>

      <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-5">
        <p className="font-semibold text-ink-900">Account</p>
        <div className="mt-4">
          <label className="text-xs font-medium text-gray-500">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-ink-900"
          />
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-5">
        <p className="font-semibold text-ink-900">Payout Method</p>
        <div className="mt-4 flex gap-4">
          {(["Bank", "UPI"] as const).map((option) => (
            <label
              key={option}
              className="flex items-center gap-2 text-sm text-ink-900"
            >
              <input
                type="radio"
                name="payoutMethod"
                checked={payoutMethod === option}
                onChange={() => setPayoutMethod(option)}
                className="h-4 w-4 accent-brand-600"
              />
              {option === "Bank" ? "Bank Transfer" : "UPI"}
            </label>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-5">
        <p className="font-semibold text-ink-900">Notifications</p>
        <div className="mt-4 space-y-3">
          {notificationLabels.map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <span className="text-sm text-ink-900">{item.label}</span>
              <button
                type="button"
                onClick={() => toggleNotification(item.key)}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                  notifications[item.key] ? "bg-brand-600" : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                    notifications[item.key] ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-5">
        <p className="font-semibold text-red-600">Danger Zone</p>
        <p className="mt-1 text-sm text-red-500">
          Deactivating your account will remove you from the listener pool and
          stop future requests.
        </p>
        <button
          disabled
          className="mt-4 cursor-not-allowed rounded-lg bg-red-200 px-5 py-2.5 text-sm font-semibold text-red-500 opacity-70"
        >
          Deactivate Listener Account
        </button>
      </div>
    </div>
  );
}
