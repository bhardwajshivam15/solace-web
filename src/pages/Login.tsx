import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, Lock, Mail } from "lucide-react";

type Role = "speaker" | "listener" | "admin";

const roleDestination: Record<Role, string> = {
  speaker: "/app/home",
  listener: "/listener",
  admin: "/admin",
};

const roleLabel: Record<Role, string> = {
  speaker: "Speaker",
  listener: "Listener",
  admin: "Admin",
};

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("speaker");

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    navigate(roleDestination[role]);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-8 shadow-soft">
        <Link to="/" className="flex items-center justify-center gap-2">
          <Heart className="h-6 w-6 fill-brand-600 text-brand-600" />
          <span className="text-lg font-bold text-ink-900">Solace</span>
        </Link>

        <h1 className="mt-6 text-center text-2xl font-bold text-ink-900">
          Welcome back
        </h1>
        <p className="mt-1 text-center text-sm text-gray-500">
          Log in to continue your conversations.
        </p>

        <div className="mt-5 inline-flex w-full rounded-xl bg-gray-100 p-1">
          {(Object.keys(roleLabel) as Role[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setRole(option)}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                role === option ? "bg-white text-ink-900 shadow-sm" : "text-gray-500"
              }`}
            >
              {roleLabel[option]}
            </button>
          ))}
        </div>

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

          <div>
            <label className="text-sm font-medium text-gray-600">
              Password
            </label>
            <div className="mt-1 flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 focus-within:border-brand-400">
              <Lock className="h-4 w-4 text-gray-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-gray-500">
              <input type="checkbox" className="rounded border-gray-300" />
              Remember me
            </label>
            <button
              type="button"
              className="font-medium text-brand-600 hover:text-brand-700"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-brand-600 py-3 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Log in
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-100" />
          <span className="text-xs text-gray-400">or</span>
          <div className="h-px flex-1 bg-gray-100" />
        </div>

        <button
          onClick={() => navigate(roleDestination[role])}
          className="w-full rounded-lg border border-gray-200 py-3 text-sm font-semibold text-ink-900 hover:bg-gray-50"
        >
          Continue with Google
        </button>

        <p className="mt-6 text-center text-sm text-gray-500">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="font-medium text-brand-600 hover:text-brand-700"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
