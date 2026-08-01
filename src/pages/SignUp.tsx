import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Heart, Lock, Mail, User, CheckCircle2 } from "lucide-react";

type Role = "speaker" | "listener";

export default function SignUp() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialRole: Role = searchParams.get("as") === "listener" ? "listener" : "speaker";

  const [role, setRole] = useState<Role>(initialRole);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (role === "speaker") {
      navigate("/app/find-listeners");
      return;
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-soft">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50">
            <CheckCircle2 className="h-7 w-7 text-green-600" />
          </div>
          <h1 className="mt-5 text-xl font-bold text-ink-900">
            Application submitted!
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Thanks, {name || "there"}. Our team will review your listener
            application and get back to you by email.
          </p>
          <Link
            to="/"
            className="mt-6 inline-block w-full rounded-lg bg-brand-600 py-3 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Back to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-8 shadow-soft">
        <Link to="/" className="flex items-center justify-center gap-2">
          <Heart className="h-6 w-6 fill-brand-600 text-brand-600" />
          <span className="text-lg font-bold text-ink-900">Solace</span>
        </Link>

        <h1 className="mt-6 text-center text-2xl font-bold text-ink-900">
          Create your account
        </h1>
        <p className="mt-1 text-center text-sm text-gray-500">
          Join Solace as a speaker or apply to become a listener.
        </p>

        <div className="mt-5 inline-flex w-full rounded-xl bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => setRole("speaker")}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              role === "speaker"
                ? "bg-white text-ink-900 shadow-sm"
                : "text-gray-500"
            }`}
          >
            I'm a Speaker
          </button>
          <button
            type="button"
            onClick={() => setRole("listener")}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              role === "listener"
                ? "bg-white text-ink-900 shadow-sm"
                : "text-gray-500"
            }`}
          >
            I want to be a Listener
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-600">
              Full name
            </label>
            <div className="mt-1 flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 focus-within:border-brand-400">
              <User className="h-4 w-4 text-gray-400" />
              <input
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Jane Doe"
                className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
              />
            </div>
          </div>

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

          <button
            type="submit"
            className="w-full rounded-lg bg-brand-600 py-3 text-sm font-semibold text-white hover:bg-brand-700"
          >
            {role === "speaker" ? "Create Account" : "Submit Application"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-brand-600 hover:text-brand-700"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
