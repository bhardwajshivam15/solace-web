import { useEffect, useRef, useState } from "react";
import {
  Globe,
  Clock,
  Camera,
  AlertCircle,
  CheckCircle2,
  User,
  FileText,
  Mail,
  Smartphone,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { apiRequest, resolveAssetUrl, ApiError } from "../lib/apiClient";

interface SpeakerProfileData {
  displayName: string;
  avatar: string | null;
  bio: string;
  preferredLanguage: string;
  timezone: string;
  notificationPreferences: { email: boolean; push: boolean };
}

type PrefKey = "email" | "push";

const preferenceOptions: { key: PrefKey; label: string; description: string; icon: typeof Mail }[] = [
  { key: "email", label: "Email notifications", description: "Session updates and receipts", icon: Mail },
  { key: "push", label: "Push notifications", description: "Real-time alerts on your device", icon: Smartphone },
];

export default function Profile() {
  const { token } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<SpeakerProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState("");
  const [timezone, setTimezone] = useState("");
  const [preferences, setPreferences] = useState({ email: true, push: true });

  useEffect(() => {
    apiRequest<{ profile: SpeakerProfileData }>("/speaker/profile", { token })
      .then(({ profile: p }) => {
        setProfile(p);
        setDisplayName(p.displayName);
        setBio(p.bio ?? "");
        setPreferredLanguage(p.preferredLanguage ?? "");
        setTimezone(p.timezone ?? "");
        setPreferences(p.notificationPreferences);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Could not load your profile."))
      .finally(() => setLoading(false));
  }, [token]);

  const togglePreference = (key: PrefKey) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const { profile: updated } = await apiRequest<{ profile: SpeakerProfileData }>("/speaker/profile", {
        method: "PATCH",
        token,
        body: { displayName, bio, preferredLanguage, timezone },
      });
      setProfile(updated);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save your changes.");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { avatar } = await apiRequest<{ avatar: string }>("/speaker/profile/avatar", {
        method: "POST",
        token,
        body: formData,
      });
      setProfile((prev) => (prev ? { ...prev, avatar } : prev));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not upload that image.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl p-8">
        <h1 className="text-xl font-bold text-ink-900">Profile</h1>
        <p className="mt-6 text-sm text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-8">
      <div>
        <h1 className="text-xl font-bold text-ink-900">Profile</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage how you appear to listeners and how Solace reaches you.
        </p>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-600">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      {saved && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-green-50 px-3 py-2.5 text-sm text-green-700">
          <CheckCircle2 className="h-4 w-4" />
          Profile updated.
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-soft">
        <div className="h-20 bg-gradient-to-r from-brand-500 to-brand-700" />
        <div className="flex flex-col items-center gap-3 px-6 pb-6 sm:flex-row sm:items-end sm:gap-5">
          <div className="group relative -mt-10 h-20 w-20 shrink-0">
            {profile?.avatar ? (
              <img
                src={resolveAssetUrl(profile.avatar) ?? undefined}
                alt={displayName}
                className="h-20 w-20 rounded-full object-cover ring-4 ring-white"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-100 text-xl font-semibold text-brand-700 ring-4 ring-white">
                {displayName.slice(0, 1).toUpperCase() || "?"}
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 text-white opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100 disabled:cursor-wait"
              title="Change photo"
            >
              <Camera className="h-5 w-5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>
          <div className="pb-1 text-center sm:text-left">
            <p className="text-lg font-semibold text-ink-900">{displayName}</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="text-xs font-medium text-brand-600 hover:text-brand-700 disabled:opacity-60"
            >
              {uploading ? "Uploading…" : "Change photo"}
            </button>
          </div>
        </div>

        <div className="space-y-5 border-t border-gray-100 px-6 py-6">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
              <User className="h-3.5 w-3.5" />
              Display Name
            </label>
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-ink-900 outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
              <FileText className="h-3.5 w-3.5" />
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              rows={3}
              placeholder="Tell listeners a little about yourself"
              className="mt-1.5 w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-ink-900 outline-none transition-colors placeholder:text-gray-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                <Globe className="h-3.5 w-3.5" />
                Preferred Language
              </label>
              <input
                value={preferredLanguage}
                onChange={(event) => setPreferredLanguage(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-ink-900 outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                <Clock className="h-3.5 w-3.5" />
                Timezone
              </label>
              <input
                value={timezone}
                onChange={(event) => setTimezone(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-ink-900 outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end border-t border-gray-100 bg-gray-50/60 px-6 py-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-gray-100 bg-white p-6 shadow-soft">
        <p className="font-semibold text-ink-900">Notification Preferences</p>
        <p className="mt-1 text-sm text-gray-500">Choose how you'd like to hear from us.</p>
        <div className="mt-4 space-y-2">
          {preferenceOptions.map(({ key, label, description, icon: Icon }) => (
            <div
              key={key}
              className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 px-4 py-3.5"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-ink-900">{label}</p>
                  <p className="text-xs text-gray-500">{description}</p>
                </div>
              </div>
              <button
                onClick={() => togglePreference(key)}
                role="switch"
                aria-checked={preferences[key]}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                  preferences[key] ? "bg-brand-600" : "bg-gray-200"
                }`}
              >
                <span
                  className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    preferences[key] ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
