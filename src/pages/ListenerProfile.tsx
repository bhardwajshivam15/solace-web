import { useEffect, useRef, useState } from "react";
import { BadgeCheck, Camera, AlertCircle, CheckCircle2, X } from "lucide-react";
import { categories } from "../data/mockData";
import { useAuth } from "../context/AuthContext";
import { apiRequest, resolveAssetUrl, ApiError } from "../lib/apiClient";

interface ListenerProfileData {
  name: string;
  avatar: string | null;
  bio: string;
  topics: string[];
  languages: string[];
  experienceYears: number | null;
  verified: boolean;
  joinedDate: string;
}

export default function ListenerProfile() {
  const { token } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<ListenerProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [bio, setBio] = useState("");
  const [topics, setTopics] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [languageInput, setLanguageInput] = useState("");
  const [experienceYears, setExperienceYears] = useState("");

  useEffect(() => {
    apiRequest<{ profile: ListenerProfileData }>("/listener/profile", { token })
      .then(({ profile: p }) => {
        setProfile(p);
        setBio(p.bio ?? "");
        setTopics(p.topics ?? []);
        setLanguages(p.languages ?? []);
        setExperienceYears(p.experienceYears != null ? String(p.experienceYears) : "");
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Could not load your profile."))
      .finally(() => setLoading(false));
  }, [token]);

  const toggleTopic = (label: string) => {
    setTopics((prev) => (prev.includes(label) ? prev.filter((t) => t !== label) : [...prev, label]));
  };

  const addLanguage = () => {
    const trimmed = languageInput.trim();
    if (trimmed && !languages.includes(trimmed)) {
      setLanguages((prev) => [...prev, trimmed]);
    }
    setLanguageInput("");
  };

  const removeLanguage = (language: string) => {
    setLanguages((prev) => prev.filter((l) => l !== language));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const { profile: updated } = await apiRequest<{ profile: ListenerProfileData }>("/listener/profile", {
        method: "PATCH",
        token,
        body: {
          bio,
          topics,
          languages,
          experienceYears: experienceYears === "" ? null : Number(experienceYears),
        },
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
      const { avatar } = await apiRequest<{ avatar: string }>("/listener/profile/avatar", {
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

  if (loading || !profile) {
    return (
      <div className="mx-auto max-w-3xl p-8">
        <h1 className="text-xl font-bold text-ink-900">Profile</h1>
        <p className="mt-6 text-sm text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-8">
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

      <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-5">
        <div className="flex flex-col items-center text-center">
          <div className="group relative h-20 w-20">
            {profile.avatar ? (
              <img
                src={resolveAssetUrl(profile.avatar) ?? undefined}
                alt={profile.name}
                className="h-20 w-20 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-100 text-xl font-semibold text-brand-700">
                {profile.name.slice(0, 1).toUpperCase()}
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
          <div className="mt-3 flex items-center gap-1">
            <span className="text-lg font-bold text-ink-900">{profile.name}</span>
            {profile.verified && <BadgeCheck className="h-5 w-5 fill-brand-600 text-white" />}
          </div>
          <p className="text-xs text-gray-400">
            {uploading ? "Uploading..." : "Click your photo to change it"}
          </p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-gray-500">Bio</label>
            <textarea
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-ink-900"
            />
          </div>
          <div className="grid grid-cols-2 gap-4 content-start">
            <div>
              <label className="text-xs font-medium text-gray-500">Experience (years)</label>
              <input
                type="number"
                min={0}
                value={experienceYears}
                onChange={(event) => setExperienceYears(event.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-ink-900"
              />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Joined</p>
              <p className="mt-1 rounded-lg border border-transparent px-3 py-2 text-sm font-medium text-ink-900">
                {new Date(profile.joinedDate).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <p className="text-xs font-medium text-gray-500">Topics</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.label}
                type="button"
                onClick={() => toggleTopic(category.label)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  topics.includes(category.label)
                    ? "bg-brand-600 text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {category.emoji} {category.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs font-medium text-gray-500">Languages</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {languages.map((language) => (
              <span
                key={language}
                className="flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600"
              >
                {language}
                <button onClick={() => removeLanguage(language)} className="text-gray-400 hover:text-red-500">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <input
              value={languageInput}
              onChange={(event) => setLanguageInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addLanguage();
                }
              }}
              placeholder="Add a language and press Enter"
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-ink-900 placeholder:text-gray-400"
            />
            <button
              type="button"
              onClick={addLanguage}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-ink-900 hover:bg-gray-50"
            >
              Add
            </button>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-6 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
