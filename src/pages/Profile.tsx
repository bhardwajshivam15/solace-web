import { useState } from "react";
import { Globe, Clock } from "lucide-react";
import { speakerProfile } from "../data/mockData";

type PrefKey = "email" | "push" | "sms";

const prefLabels: Record<PrefKey, string> = {
  email: "Email notifications",
  push: "Push notifications",
  sms: "SMS notifications",
};

export default function Profile() {
  const [preferences, setPreferences] = useState(
    speakerProfile.notificationPreferences,
  );

  const togglePreference = (key: PrefKey) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="mx-auto max-w-2xl p-8">
      <h1 className="text-xl font-bold text-ink-900">Profile</h1>

      <div className="mt-5 rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-4">
          <img
            src={speakerProfile.avatar}
            alt={speakerProfile.displayName}
            className="h-16 w-16 rounded-full object-cover"
          />
          <div>
            <p className="text-lg font-semibold text-ink-900">
              {speakerProfile.displayName}
            </p>
            <p className="text-sm text-gray-500">{speakerProfile.bio}</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-gray-100 pt-5">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-brand-600" />
            <div>
              <p className="text-xs text-gray-400">Preferred Language</p>
              <p className="text-sm font-medium text-ink-900">
                {speakerProfile.preferredLanguage}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-brand-600" />
            <div>
              <p className="text-xs text-gray-400">Timezone</p>
              <p className="text-sm font-medium text-ink-900">
                {speakerProfile.timezone}
              </p>
            </div>
          </div>
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
