import { useEffect, useState } from "react";
import { Star, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { apiRequest, ApiError } from "../lib/apiClient";

interface RatingDistributionEntry {
  star: number;
  count: number;
}

interface Review {
  id: string;
  reviewerLabel: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

interface RatingSummary {
  averageRating: number;
  reviewCount: number;
  distribution: RatingDistributionEntry[];
  reviews: Review[];
}

// A single review's rating is always a whole number (1-5), but the
// aggregate average is fractional (e.g. 3.5) — rounding it to the nearest
// whole star for display would show a full 4th star instead of a half one.
function starFill(value: number, starIndex: number): "full" | "half" | "empty" {
  const diff = value - starIndex;
  if (diff >= 0.75) return "full";
  if (diff >= 0.25) return "half";
  return "empty";
}

function RatingStar({ fill, sizeClassName }: { fill: "full" | "half" | "empty"; sizeClassName: string }) {
  if (fill === "empty") return <Star className={`${sizeClassName} text-gray-200`} />;
  if (fill === "full") return <Star className={`${sizeClassName} fill-amber-400 text-amber-400`} />;
  return (
    <span className={`relative inline-block ${sizeClassName}`}>
      <Star className={`${sizeClassName} text-gray-200`} />
      <span className="absolute inset-0 w-1/2 overflow-hidden">
        <Star className={`${sizeClassName} fill-amber-400 text-amber-400`} />
      </span>
    </span>
  );
}

export default function Ratings() {
  const { token } = useAuth();
  const [summary, setSummary] = useState<RatingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiRequest<RatingSummary>("/listener/ratings", { token })
      .then(setSummary)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Could not load your ratings."))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading || !summary) {
    return (
      <div className="mx-auto max-w-3xl p-8">
        <h1 className="text-xl font-bold text-ink-900">Ratings & Reviews</h1>
        <p className="mt-6 text-sm text-gray-400">Loading...</p>
      </div>
    );
  }

  const maxCount = Math.max(1, ...summary.distribution.map((entry) => entry.count));

  return (
    <div className="mx-auto max-w-3xl p-8">
      <h1 className="text-xl font-bold text-ink-900">Ratings & Reviews</h1>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-600">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-5 text-center">
        <p className="text-4xl font-bold text-ink-900">
          {summary.reviewCount > 0 ? summary.averageRating.toFixed(1) : "—"}
        </p>
        <div className="mt-2 flex items-center justify-center gap-1">
          {Array.from({ length: 5 }).map((_, index) => (
            <RatingStar key={index} fill={starFill(summary.averageRating, index)} sizeClassName="h-4 w-4" />
          ))}
        </div>
        <p className="mt-1 text-xs text-gray-400">
          {summary.reviewCount > 0
            ? `Average Rating · ${summary.reviewCount} review${summary.reviewCount === 1 ? "" : "s"}`
            : "No ratings yet"}
        </p>
      </div>

      <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-5">
        <p className="font-semibold text-ink-900">Rating Breakdown</p>
        <div className="mt-4 space-y-2">
          {summary.distribution.map((entry) => (
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
          {summary.reviews.map((review) => (
            <div
              key={review.id}
              className="border-b border-gray-50 pb-4 last:border-0 last:pb-0"
            >
              <div className="flex items-center justify-between">
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
                <span className="text-xs text-gray-400">{review.reviewerLabel}</span>
              </div>
              {review.comment && <p className="mt-1.5 text-sm text-gray-600">{review.comment}</p>}
              <p className="mt-1 text-xs text-gray-400">
                {new Date(review.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
          ))}

          {summary.reviews.length === 0 && (
            <p className="py-6 text-center text-sm text-gray-400">
              No reviews yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
