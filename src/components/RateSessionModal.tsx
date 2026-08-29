import { useState } from "react";
import { Star } from "lucide-react";

export default function RateSessionModal({
  listenerName,
  onSubmit,
  onClose,
}: {
  listenerName: string;
  onSubmit: (rating: number) => Promise<void>;
  onClose: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(rating);
      setSubmitted(true);
      window.setTimeout(onClose, 1200);
    } catch {
      setError("Could not save your rating. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
        {submitted ? (
          <>
            <h2 className="text-lg font-bold text-ink-900">Thanks for rating!</h2>
            <p className="mt-1 text-sm text-gray-500">Your feedback helps {listenerName} improve.</p>
          </>
        ) : (
          <>
            <h2 className="text-lg font-bold text-ink-900">Session completed</h2>
            <p className="mt-1 text-sm text-gray-500">How was your conversation with {listenerName}?</p>

            <div className="mt-5 flex items-center justify-center gap-1.5">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  onClick={() => setRating(value)}
                  onMouseEnter={() => setHoverRating(value)}
                  onMouseLeave={() => setHoverRating(0)}
                  disabled={submitting}
                  className="disabled:cursor-not-allowed"
                >
                  <Star
                    className={`h-8 w-8 ${
                      value <= (hoverRating || rating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>

            {error && <p className="mt-3 text-xs text-red-500">{error}</p>}

            <div className="mt-6 flex gap-3">
              <button
                onClick={onClose}
                disabled={submitting}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Skip
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || rating === 0}
                className="flex-1 rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Saving…" : "Submit"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
