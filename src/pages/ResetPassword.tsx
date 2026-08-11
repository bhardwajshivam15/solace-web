import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Heart, Lock, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../lib/apiClient";

export default function ResetPassword() {
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword(token, password);
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
          Set a new password
        </h1>

        {!token && (
          <div className="mt-5 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-600">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            This link is missing its reset token. Request a new one from the
            forgot password page.
          </div>
        )}

        {submitted ? (
          <div className="mt-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50">
              <CheckCircle2 className="h-7 w-7 text-green-600" />
            </div>
            <p className="mt-4 text-sm text-gray-600">
              Your password has been reset.
            </p>
            <Link
              to="/login"
              className="mt-6 inline-block w-full rounded-lg bg-brand-600 py-3 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Log in
            </Link>
          </div>
        ) : (
          token && (
            <>
              {error && (
                <div className="mt-5 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-600">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    New password
                  </label>
                  <div className="mt-1 flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 focus-within:border-brand-400">
                    <Lock className="h-4 w-4 text-gray-400" />
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-400">At least 8 characters.</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Confirm new password
                  </label>
                  <div className="mt-1 flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 focus-within:border-brand-400">
                    <Lock className="h-4 w-4 text-gray-400" />
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-lg bg-brand-600 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
                >
                  {submitting ? "Resetting..." : "Reset password"}
                </button>
              </form>
            </>
          )
        )}

        <p className="mt-6 text-center text-sm text-gray-500">
          <Link to="/forgot-password" className="font-medium text-brand-600 hover:text-brand-700">
            Request a new link
          </Link>
          {" · "}
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="font-medium text-brand-600 hover:text-brand-700"
          >
            Back to login
          </button>
        </p>
      </div>
    </div>
  );
}
