import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { apiRequest, ApiError } from "../lib/apiClient";

const notificationLabels: { key: "email" | "push" | "sms"; label: string }[] = [
  { key: "email", label: "Email Notifications" },
  { key: "push", label: "Push Notifications" },
  { key: "sms", label: "SMS Notifications" },
];

export default function ListenerSettings() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [payoutMethod, setPayoutMethod] = useState<"Bank" | "UPI">("Bank");
  const [notifications, setNotifications] = useState({ email: true, push: true, sms: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    setLoading(true);
    apiRequest<{ profile: { notificationPreferences: typeof notifications } }>("/listener/profile", { token })
      .then((response) => setNotifications(response.profile.notificationPreferences))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Could not load your settings."))
      .finally(() => setLoading(false));
  }, [token]);

  const toggleNotification = async (key: "email" | "push" | "sms") => {
    const next = { ...notifications, [key]: !notifications[key] };
    setNotifications(next);
    setError(null);
    try {
      await apiRequest("/listener/settings", { method: "PATCH", token, body: next });
    } catch (err) {
      setNotifications(notifications);
      setError(err instanceof ApiError ? err.message : "Could not save that change.");
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      await apiRequest("/listener/account", { method: "DELETE", token });
      logout();
      navigate("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not deactivate your account.");
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl p-8">
      <h1 className="text-xl font-bold text-ink-900">Settings</h1>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-600">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-5">
        <p className="font-semibold text-ink-900">Account</p>
        <div className="mt-4">
          <label className="text-xs font-medium text-gray-500">Email Address</label>
          <input
            type="email"
            value={user?.email ?? ""}
            disabled
            className="mt-1 w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
          />
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-5">
        <p className="font-semibold text-ink-900">Payout Method</p>
        <p className="mt-1 text-xs text-gray-400">Coming soon — payouts aren't processed yet.</p>
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
          {loading && <p className="text-sm text-gray-400">Loading…</p>}
          {!loading &&
            notificationLabels.map((item) => (
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
        {confirmingDelete ? (
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {deleting ? "Deactivating…" : "Yes, deactivate my account"}
            </button>
            <button
              onClick={() => setConfirmingDelete(false)}
              disabled={deleting}
              className="text-sm font-medium text-red-500/70 hover:text-red-600"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmingDelete(true)}
            className="mt-4 rounded-lg bg-red-200 px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-300"
          >
            Deactivate Listener Account
          </button>
        )}
      </div>
    </div>
  );
}
