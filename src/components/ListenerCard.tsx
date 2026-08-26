import { BadgeCheck } from "lucide-react";
import type { Listener } from "../types";
import RatingBadge from "./RatingBadge";

export default function ListenerCard({
  listener,
  active,
  onSelect,
}: {
  listener: Listener;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`flex flex-col rounded-2xl border p-4 text-left transition-colors ${
        active
          ? "border-brand-300 bg-brand-50"
          : "border-gray-100 bg-white hover:border-brand-200"
      }`}
    >
      <div className="relative mx-auto h-16 w-16">
        <img
          src={listener.avatar}
          alt={listener.name}
          className="h-16 w-16 rounded-full object-cover"
        />
        {listener.online && (
          <span className="absolute bottom-0.5 right-0.5 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
        )}
      </div>

      <div className="mt-3 flex items-center justify-center gap-1">
        <span className="font-semibold text-ink-900">{listener.name}</span>
        {listener.verified && (
          <BadgeCheck className="h-4 w-4 fill-brand-600 text-white" />
        )}
      </div>

      <div className="mt-1 flex justify-center">
        <RatingBadge rating={listener.rating} reviewCount={listener.reviewCount} />
      </div>

      <div className="mt-2 flex flex-wrap justify-center gap-1">
        {listener.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="font-semibold text-brand-600">
          ₹{listener.pricePerMinute}/min
        </span>
        <span
          className={`flex items-center gap-1 ${listener.online ? "text-green-600" : "text-gray-400"}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${listener.online ? "bg-green-500" : "bg-gray-300"}`} />
          {listener.online ? "Online" : "Offline"}
        </span>
      </div>
    </button>
  );
}
