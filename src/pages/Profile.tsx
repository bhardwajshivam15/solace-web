import { useEffect, useRef, useState } from "react";
import { Globe, Clock, Camera, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { apiRequest, resolveAssetUrl, ApiError } from "../lib/apiClient";

interface SpeakerProfileData {
  displayName: string;
  avatar: string | null;
  bio: string;
  preferredLanguage: string;
  timezone: string;
  notificationPreferences: { email: boolean; push: boolean; sms: boolean };
}

type PrefKey = "email" | "push" | "sms";

const prefLabels: Record<PrefKey, string> = {
  email: "Email notifications",
  push: "Push notifications",
  sms: "SMS notifications",
};

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
  const [preferences, setPreferences] = useState({ email: true, push: true, sms: false });

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
      <h1 className="text-xl font-bold text-ink-900">Profile</h1>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-600">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      {saved && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2.5 text-sm text-green-700">
          <CheckCircle2 className="h-4 w-4" />
          Profile updated.
        </div>
      )}

      <div className="mt-5 rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-4">
          <div className="group relative h-16 w-16 shrink-0">
            {profile?.avatar ? (
              <img
                src={resolveAssetUrl(profile.avatar) ?? undefined}
                alt={displayName}
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-lg font-semibold text-brand-700">
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
          <div>
            <p className="text-lg font-semibold text-ink-900">{displayName}</p>
            <p className="text-sm text-gray-500">
              {uploading ? "Uploading..." : "Click your photo to change it"}
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-4 border-t border-gray-100 pt-5">
          <div>
            <label className="text-xs font-medium text-gray-500">Display Name</label>
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-ink-900"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Bio</label>
            <textarea
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-ink-900"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                <Globe className="h-3.5 w-3.5" />
                Preferred Language
              </label>
              <input
                value={preferredLanguage}
                onChange={(event) => setPreferredLanguage(event.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-ink-900"
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
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-ink-900"
              />
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-gray-100 p-6">
        <p className="font-semibold text-ink-900">Notification Preferences</p>
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
    </div>
  );
}
