import { useEffect, useRef, useState } from "react";
import {
  BadgeCheck,
  Camera,
  AlertCircle,
  CheckCircle2,
  X,
  FileText,
  Briefcase,
  CalendarDays,
  Tag,
  Languages as LanguagesIcon,
  ChevronDown,
  Check,
  IndianRupee,
} from "lucide-react";
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
  pricePerMinute: number;
  verified: boolean;
  joinedDate: string;
}

const LANGUAGE_OPTIONS = [
  "English",
  "Hindi",
  "Bengali",
  "Tamil",
  "Telugu",
  "Marathi",
  "Gujarati",
  "Kannada",
  "Malayalam",
  "Punjabi",
  "Urdu",
  "Odia",
  "Spanish",
  "French",
  "German",
  "Mandarin",
  "Arabic",
  "Portuguese",
];

export default function ListenerProfile() {
  const { token } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const languageMenuRef = useRef<HTMLDivElement>(null);

  const [profile, setProfile] = useState<ListenerProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [bio, setBio] = useState("");
  const [topics, setTopics] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const [experienceYears, setExperienceYears] = useState("");
  const [pricePerMinute, setPricePerMinute] = useState("10");

  useEffect(() => {
    if (!languageMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target as Node)) {
        setLanguageMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [languageMenuOpen]);

  useEffect(() => {
    apiRequest<{ profile: ListenerProfileData }>("/listener/profile", { token })
      .then(({ profile: p }) => {
        setProfile(p);
        setBio(p.bio ?? "");
        setTopics(p.topics ?? []);
        setLanguages(p.languages ?? []);
        setExperienceYears(p.experienceYears != null ? String(p.experienceYears) : "");
        setPricePerMinute(String(p.pricePerMinute));
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Could not load your profile."))
      .finally(() => setLoading(false));
  }, [token]);

  const toggleTopic = (label: string) => {
    setTopics((prev) => (prev.includes(label) ? prev.filter((t) => t !== label) : [...prev, label]));
  };

  const toggleLanguage = (language: string) => {
    setLanguages((prev) =>
      prev.includes(language) ? prev.filter((l) => l !== language) : [...prev, language],
    );
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
          pricePerMinute: pricePerMinute === "" ? null : Number(pricePerMinute),
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
      <div>
        <h1 className="text-xl font-bold text-ink-900">Profile</h1>
        <p className="mt-1 text-sm text-gray-500">
          This is what speakers see before they choose to talk to you.
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
        <div className="flex flex-col items-center px-6 pb-6 text-center">
          <div className="group relative -mt-10 h-20 w-20">
            {profile.avatar ? (
              <img
                src={resolveAssetUrl(profile.avatar) ?? undefined}
                alt={profile.name}
                className="h-20 w-20 rounded-full object-cover ring-4 ring-white"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-100 text-xl font-semibold text-brand-700 ring-4 ring-white">
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
          <div className="mt-3 flex items-center gap-1.5">
            <span className="text-lg font-bold text-ink-900">{profile.name}</span>
            {profile.verified && <BadgeCheck className="h-5 w-5 fill-brand-600 text-white" />}
          </div>
          {profile.verified && (
            <span className="mt-1 rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-medium text-brand-700">
              Verified Listener
            </span>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="mt-2 text-xs font-medium text-brand-600 hover:text-brand-700 disabled:opacity-60"
          >
            {uploading ? "Uploading…" : "Change photo"}
          </button>
        </div>

        <div className="grid gap-5 border-t border-gray-100 px-6 py-6 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
              <FileText className="h-3.5 w-3.5" />
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              rows={4}
              placeholder="Tell speakers a little about yourself"
              className="mt-1.5 w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-ink-900 outline-none transition-colors placeholder:text-gray-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                <Briefcase className="h-3.5 w-3.5" />
                Experience (years)
              </label>
              <input
                type="number"
                min={0}
                value={experienceYears}
                onChange={(event) => setExperienceYears(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-ink-900 outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                <IndianRupee className="h-3.5 w-3.5" />
                Price per minute
              </label>
              <input
                type="number"
                min={1}
                value={pricePerMinute}
                onChange={(event) => setPricePerMinute(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-ink-900 outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
              <p className="mt-1 text-[11px] text-gray-400">What speakers pay to talk to you.</p>
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                <CalendarDays className="h-3.5 w-3.5" />
                Joined
              </label>
              <p className="mt-1.5 w-full rounded-xl border border-gray-100 bg-gray-50 px-3.5 py-2.5 text-sm font-medium text-ink-900">
                {new Date(profile.joinedDate).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 px-6 py-6">
          <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
            <Tag className="h-3.5 w-3.5" />
            Topics
          </label>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.label}
                type="button"
                onClick={() => toggleTopic(category.label)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
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

        <div className="border-t border-gray-100 px-6 py-6">
          <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
            <LanguagesIcon className="h-3.5 w-3.5" />
            Languages
          </label>

          <div ref={languageMenuRef} className="relative mt-1.5">
            <button
              type="button"
              onClick={() => setLanguageMenuOpen((open) => !open)}
              className="flex w-full items-center justify-between rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-ink-900 outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            >
              <span className={languages.length === 0 ? "text-gray-400" : ""}>
                {languages.length === 0 ? "Select languages" : `${languages.length} selected`}
              </span>
              <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${languageMenuOpen ? "rotate-180" : ""}`} />
            </button>

            {languageMenuOpen && (
              <div className="absolute z-10 mt-1.5 max-h-56 w-full overflow-y-auto rounded-xl border border-gray-100 bg-white py-1.5 shadow-soft">
                {LANGUAGE_OPTIONS.map((language) => {
                  const selected = languages.includes(language);
                  return (
                    <button
                      key={language}
                      type="button"
                      onClick={() => toggleLanguage(language)}
                      className="flex w-full items-center justify-between px-3.5 py-2 text-sm text-ink-900 hover:bg-gray-50"
                    >
                      {language}
                      {selected && <Check className="h-4 w-4 text-brand-600" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {languages.map((language) => (
              <span
                key={language}
                className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600"
              >
                {language}
                <button onClick={() => toggleLanguage(language)} className="text-gray-400 hover:text-red-500">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            {languages.length === 0 && (
              <span className="text-xs text-gray-400">No languages selected yet.</span>
            )}
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
    </div>
  );
}
