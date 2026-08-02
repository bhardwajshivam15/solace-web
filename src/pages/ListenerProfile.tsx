import { BadgeCheck } from "lucide-react";
import { listenerProfileDetails } from "../data/mockData";

export default function ListenerProfile() {
  return (
    <div className="mx-auto max-w-3xl p-8">
      <h1 className="text-xl font-bold text-ink-900">Profile</h1>

      <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-5">
        <div className="flex flex-col items-center text-center">
          <img
            src={listenerProfileDetails.avatar}
            alt={listenerProfileDetails.name}
            className="h-20 w-20 rounded-full object-cover"
          />
          <div className="mt-3 flex items-center gap-1">
            <span className="text-lg font-bold text-ink-900">
              {listenerProfileDetails.name}
            </span>
            {listenerProfileDetails.verified && (
              <BadgeCheck className="h-5 w-5 fill-brand-600 text-white" />
            )}
          </div>
          <p className="mt-2 max-w-md text-sm text-gray-500">
            {listenerProfileDetails.bio}
          </p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium text-gray-500">Experience</p>
            <p className="mt-1 text-sm font-semibold text-ink-900">
              {listenerProfileDetails.experienceYears}+ years
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Joined</p>
            <p className="mt-1 text-sm font-semibold text-ink-900">
              {listenerProfileDetails.joinedDate}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <p className="text-xs font-medium text-gray-500">Topics</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {listenerProfileDetails.topics.map((topic) => (
              <span
                key={topic}
                className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs font-medium text-gray-500">Languages</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {listenerProfileDetails.languages.map((language) => (
              <span
                key={language}
                className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600"
              >
                {language}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
