import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { apiRequest, ApiError } from "../lib/apiClient";
import PlatformFeedbackCard from "../components/PlatformFeedbackCard";

type PrefKey = "email" | "push";

const prefLabels: Record<PrefKey, string> = {
  email: "Email notifications",
  push: "Push notifications",
};

export default function Settings() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [preferences, setPreferences] = useState({ email: true, push: true });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    setLoading(true);
    apiRequest<{ profile: { notificationPreferences: typeof preferences } }>("/speaker/profile", { token })
      .then((response) => setPreferences(response.profile.notificationPreferences))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Could not load your settings."))
      .finally(() => setLoading(false));
  }, [token]);

  const togglePreference = async (key: PrefKey) => {
    const next = { ...preferences, [key]: !preferences[key] };
    setPreferences(next);
    setError(null);
    try {
      await apiRequest("/speaker/settings/notifications", { method: "PATCH", token, body: next });
    } catch (err) {
      setPreferences(preferences);
      setError(err instanceof ApiError ? err.message : "Could not save that change.");
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      await apiRequest("/speaker/account", { method: "DELETE", token });
      logout();
      navigate("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not delete your account.");
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl p-8">
      <h1 className="text-xl font-bold text-ink-900">Settings</h1>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-600">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="mt-5 rounded-2xl border border-gray-100 p-6">
        <p className="font-semibold text-ink-900">Account</p>
        <div className="mt-4">
          <label className="text-xs font-medium text-gray-500">
            Email address
          </label>
          <input
            value={user?.email ?? ""}
            disabled
            className="mt-1.5 w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-500 outline-none"
          />
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-gray-100 p-6">
        <p className="font-semibold text-ink-900">Notifications</p>
        <div className="mt-4 space-y-3">
          {loading && <p className="text-sm text-gray-400">Loading…</p>}
          {!loading &&
            (Object.keys(prefLabels) as PrefKey[]).map((key) => (
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

      <PlatformFeedbackCard />

      <div className="mt-6 rounded-2xl border border-red-200 bg-red-50/40 p-6">
        <div className="flex items-center gap-2 text-red-500">
          <AlertTriangle className="h-4 w-4" />
          <p className="font-semibold">Danger Zone</p>
        </div>
        <p className="mt-2 text-sm text-red-500/80">
          Deleting your account is permanent and will remove your wallet
          balance, session history, and messages. This cannot be undone.
        </p>
        {confirmingDelete ? (
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {deleting ? "Deleting…" : "Yes, delete my account"}
            </button>
            <button
              onClick={() => setConfirmingDelete(false)}
              disabled={deleting}
              className="text-sm font-medium text-gray-500 hover:text-ink-900"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmingDelete(true)}
            className="mt-4 rounded-lg border border-red-200 bg-white px-5 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50"
          >
            Delete Account
          </button>
        )}
      </div>
    </div>
  );
}
