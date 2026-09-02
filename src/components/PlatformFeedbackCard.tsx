import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Star } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { apiRequest, ApiError } from "../lib/apiClient";

interface PlatformReview {
  rating: number;
  comment: string;
}

// Feedback about SOLACE ITSELF (safety, trust, experience) — shown publicly
// on the landing page — not a rating of a specific listener/session. Shared
// between the speaker and listener Settings pages since the form and API
// are identical either way (see PlatformReviewController, role-agnostic).
export default function PlatformFeedbackCard() {
  const { token } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  useEffect(() => {
    apiRequest<{ review: PlatformReview | null }>("/users/me/platform-review", { token })
      .then((response) => {
        if (response.review) {
          setRating(response.review.rating);
          setComment(response.review.comment);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async () => {
    if (rating === 0 || !comment.trim()) {
      setError("Please choose a rating and write a few words.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await apiRequest("/users/me/platform-review", {
        method: "PUT",
        token,
        body: { rating, comment: comment.trim() },
      });
      setConfirmation("Thanks for your feedback!");
      window.setTimeout(() => setConfirmation(null), 2500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save your feedback.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-5">
      <p className="font-semibold text-ink-900">Give Feedback</p>
      <p className="mt-1 text-xs text-gray-400">
        Tell us what you think of Solace as a platform — safety, experience, anything. We may
        feature it on our landing page (shown with your {" "}
        {/* Matches the anonymity already used everywhere else: speakers stay anonymous, listeners show their real name. */}
        usual display name).
      </p>

      {loading && <p className="mt-4 text-sm text-gray-400">Loading…</p>}

      {!loading && (
        <div className="mt-4 space-y-4">
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                onMouseEnter={() => setHoverRating(value)}
                onMouseLeave={() => setHoverRating(0)}
                disabled={saving}
                className="disabled:cursor-not-allowed"
              >
                <Star
                  className={`h-7 w-7 ${
                    value <= (hoverRating || rating) ? "fill-amber-400 text-amber-400" : "text-gray-300"
                  }`}
                />
              </button>
            ))}
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="What's your experience with Solace been like?"
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-ink-900 focus:border-brand-400 focus:outline-none"
          />
        </div>
      )}

      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-600">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={saving || loading}
        className="mt-4 w-full rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? "Saving…" : "Submit Feedback"}
      </button>

      {confirmation && (
        <p className="mt-3 flex items-center justify-center gap-2 text-sm text-green-600">
          <CheckCircle2 className="h-4 w-4" />
          {confirmation}
        </p>
      )}
    </div>
  );
}
