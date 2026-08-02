import { Star } from "lucide-react";
import {
  listenerReviews,
  ratingDistribution,
  listenerPerformance,
} from "../data/mockData";

export default function Ratings() {
  const maxCount = Math.max(...ratingDistribution.map((entry) => entry.count));

  return (
    <div className="mx-auto max-w-3xl p-8">
      <h1 className="text-xl font-bold text-ink-900">Ratings & Reviews</h1>

      <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-5 text-center">
        <p className="text-4xl font-bold text-ink-900">
          {listenerPerformance.averageRating}
        </p>
        <div className="mt-2 flex items-center justify-center gap-1">
          {Array.from({ length: 5 }).map((_, index) => (
            <Star
              key={index}
              className={`h-4 w-4 ${
                index < Math.round(listenerPerformance.averageRating)
                  ? "fill-amber-400 text-amber-400"
                  : "text-gray-200"
              }`}
            />
          ))}
        </div>
        <p className="mt-1 text-xs text-gray-400">Average Rating</p>
      </div>

      <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-5">
        <p className="font-semibold text-ink-900">Rating Breakdown</p>
        <div className="mt-4 space-y-2">
          {ratingDistribution.map((entry) => (
            <div key={entry.star} className="flex items-center gap-3">
              <span className="flex w-8 shrink-0 items-center gap-0.5 text-xs font-medium text-gray-500">
                {entry.star}
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-amber-400"
                  style={{ width: `${(entry.count / maxCount) * 100}%` }}
                />
              </div>
              <span className="w-10 shrink-0 text-right text-xs text-gray-400">
                {entry.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-5">
        <p className="font-semibold text-ink-900">All Reviews</p>
        <div className="mt-4 space-y-4">
          {listenerReviews.map((review) => (
            <div
              key={review.id}
              className="border-b border-gray-50 pb-4 last:border-0 last:pb-0"
            >
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star
                    key={index}
                    className={`h-3.5 w-3.5 ${
                      index < review.rating
                        ? "fill-amber-400 text-amber-400"
                        : "text-gray-200"
                    }`}
                  />
                ))}
              </div>
              <p className="mt-1.5 text-sm text-gray-600">{review.text}</p>
              <p className="mt-1 text-xs text-gray-400">{review.date}</p>
            </div>
          ))}

          {listenerReviews.length === 0 && (
            <p className="py-6 text-center text-sm text-gray-400">
              No reviews yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
