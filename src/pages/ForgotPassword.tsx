import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Heart, Mail, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../lib/apiClient";

export default function ForgotPassword() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await forgotPassword(email);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-8 shadow-soft">
        <Link to="/" className="flex items-center justify-center gap-2">
          <Heart className="h-6 w-6 fill-brand-600 text-brand-600" />
          <span className="text-lg font-bold text-ink-900">Solace</span>
        </Link>

        <h1 className="mt-6 text-center text-2xl font-bold text-ink-900">
          Forgot your password?
        </h1>
        <p className="mt-1 text-center text-sm text-gray-500">
          Enter your email and we'll send you a link to reset it.
        </p>

        {submitted ? (
          <div className="mt-6 flex items-start gap-2 rounded-lg bg-green-50 px-3 py-2.5 text-sm text-green-700">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            If an account exists for that email, a password reset link has
            been sent.
          </div>
        ) : (
          <>
            {error && (
              <div className="mt-5 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-600">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Email</label>
                <div className="mt-1 flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 focus-within:border-brand-400">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-brand-600 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
              >
                {submitting ? "Sending..." : "Send reset link"}
              </button>
            </form>
          </>
        )}

        <p className="mt-6 text-center text-sm text-gray-500">
          Remembered it?{" "}
          <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
