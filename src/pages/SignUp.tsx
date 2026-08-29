import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Heart,
  Lock,
  Mail,
  User,
  AtSign,
  CheckCircle2,
  AlertCircle,
  Tag,
  Loader2,
  FileText,
  Languages as LanguagesIcon,
  IndianRupee,
  Camera,
  ChevronDown,
  Check,
  X,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { apiRequest, ApiError } from "../lib/apiClient";
import { categories, languageOptions } from "../data/mockData";
import LegalDocumentModal from "../components/LegalDocumentModal";

type Role = "speaker" | "listener";
type UsernameStatus = "idle" | "checking" | "available" | "unavailable";

const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,20}$/;
const USERNAME_CHECK_DEBOUNCE_MS = 450;

export default function SignUp() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [searchParams] = useSearchParams();
  const initialRole: Role = searchParams.get("as") === "listener" ? "listener" : "speaker";

  const [role, setRole] = useState<Role>(initialRole);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [topics, setTopics] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");
  const [usernameMessage, setUsernameMessage] = useState<string | null>(null);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  // Listener-only profile fields, collected up front now instead of only
  // after admin approval — an admin reviewing the application sees the
  // full proposed profile, and the listener starts fully set up on day one.
  const [bio, setBio] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const languageMenuRef = useRef<HTMLDivElement>(null);
  const [pricePerMinute, setPricePerMinute] = useState("");
  const [priceRange, setPriceRange] = useState<{ minimumPrice: number; maximumPrice: number } | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [photoUploadWarning, setPhotoUploadWarning] = useState<string | null>(null);

  // Required agreements — must all be true before a listener application can
  // be submitted. See ListenerLegalContentSeedRunner (backend) for the full
  // text these link out to.
  const [guidelinesChecked, setGuidelinesChecked] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);
  const [confidentialityChecked, setConfidentialityChecked] = useState(false);
  const [openLegalModal, setOpenLegalModal] = useState<"listener-guidelines" | "listener-terms" | null>(null);

  useEffect(() => {
    apiRequest<{ minimumPrice: number; maximumPrice: number }>("/pricing/new-listener-range")
      .then((range) => {
        setPriceRange(range);
        setPricePerMinute((prev) => (prev === "" ? String(range.maximumPrice) : prev));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!languageMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target as Node)) {
        setLanguageMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [languageMenuOpen]);

  const toggleLanguage = (language: string) => {
    setLanguages((prev) => (prev.includes(language) ? prev.filter((l) => l !== language) : [...prev, language]));
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setPhotoFile(file);
    setPhotoPreviewUrl(file ? URL.createObjectURL(file) : null);
  };

  // Derived, not stored — as soon as a field becomes valid its red border
  // clears on its own, no need to wait for another submit attempt.
  const nameInvalid =
    name.trim().length === 0 ||
    (role === "speaker" && (!USERNAME_PATTERN.test(name) || usernameStatus === "unavailable"));
  const emailInvalid = email.trim().length === 0;
  const passwordInvalid = password.length === 0 || password.length < 8;
  const topicsInvalid = role === "listener" && topics.length === 0;
  const priceValue = pricePerMinute === "" ? null : Number(pricePerMinute);
  const priceInvalid =
    role === "listener" &&
    priceRange != null &&
    (priceValue == null || priceValue < priceRange.minimumPrice || priceValue > priceRange.maximumPrice);
  const agreementsInvalid = role === "listener" && !(guidelinesChecked && termsChecked && confidentialityChecked);

  const fieldBorderClass = (invalid: boolean) =>
    attemptedSubmit && invalid
      ? "border-red-400 focus-within:border-red-400"
      : "border-gray-200 focus-within:border-brand-400";

  // Live "is this taken?" check as a speaker types — debounced so it fires
  // once they pause, not on every keystroke. Purely advisory: the real gate
  // is still the identical check AuthService runs again at submit time.
  useEffect(() => {
    if (role !== "speaker" || name.trim().length === 0) {
      setUsernameStatus("idle");
      setUsernameMessage(null);
      return;
    }
    setUsernameStatus("checking");
    const handle = setTimeout(() => {
      apiRequest<{ available: boolean; reason: string | null }>(
        `/auth/username-availability?username=${encodeURIComponent(name.trim())}`,
      )
        .then((result) => {
          setUsernameStatus(result.available ? "available" : "unavailable");
          setUsernameMessage(result.reason);
        })
        .catch(() => {
          setUsernameStatus("idle");
          setUsernameMessage(null);
        });
    }, USERNAME_CHECK_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [name, role]);

  const toggleTopic = (label: string) => {
    setTopics((prev) => (prev.includes(label) ? prev.filter((t) => t !== label) : [...prev, label]));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setAttemptedSubmit(true);
    // Native `required`/`minLength`/`type=email` validation is disabled
    // (noValidate on the form) so the red-border UX can actually run instead
    // of the browser silently blocking submission first — these checks are
    // what used to be free from the browser, now done explicitly.
    if (name.trim().length === 0) {
      setError(role === "speaker" ? "Please choose a username." : "Please enter your name.");
      return;
    }
    if (email.trim().length === 0) {
      setError("Please enter your email.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (role === "listener" && topics.length === 0) {
      setError("Please select at least one category.");
      return;
    }
    if (role === "speaker" && !USERNAME_PATTERN.test(name)) {
      setError("Username must be 3-20 characters (letters, numbers, underscores only).");
      return;
    }
    if (role === "speaker" && usernameStatus === "unavailable") {
      setError(usernameMessage ?? "This username is already taken.");
      return;
    }
    if (priceInvalid) {
      setError(
        priceRange
          ? `Price per minute must be between ₹${priceRange.minimumPrice} and ₹${priceRange.maximumPrice}.`
          : "Please enter a price per minute.",
      );
      return;
    }
    if (agreementsInvalid) {
      setError("Please accept the Listener Guidelines, Terms & Conditions, and confidentiality agreement.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await register({
        role,
        name,
        email,
        password,
        ...(role === "listener"
          ? {
              topics,
              bio: bio.trim() || undefined,
              languages,
              pricePerMinute: priceValue ?? undefined,
              termsAccepted: true,
              guidelinesAccepted: true,
              confidentialityAccepted: true,
            }
          : {}),
      });
      if (role === "speaker" && response.token) {
        navigate("/app/home");
      } else {
        if (role === "listener" && photoFile && response.user?.id) {
          const formData = new FormData();
          formData.append("file", photoFile);
          try {
            await apiRequest(`/auth/listener-applications/${response.user.id}/avatar`, {
              method: "POST",
              body: formData,
            });
          } catch {
            // The application itself already succeeded — a photo-upload
            // hiccup shouldn't read as a failed signup, just a soft note.
            setPhotoUploadWarning("Your application was submitted, but the photo upload didn't go through. You can add one after approval.");
          }
        }
        setSubmitted(true);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
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
          {photoUploadWarning && (
            <div className="mt-4 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-left text-sm text-amber-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {photoUploadWarning}
            </div>
          )}
          <div className="mt-5 rounded-xl border border-gray-100 bg-gray-50/60 p-4 text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Agreements</p>
            <ul className="mt-1.5 space-y-1 text-sm text-gray-600">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> Listener Guidelines accepted
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> Terms & Conditions accepted
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> Confidentiality agreement accepted
              </li>
            </ul>
          </div>
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

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-600">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-600">
              {role === "speaker" ? "Username" : "Full name"}
            </label>
            <div className={`mt-1 flex items-center gap-2 rounded-lg border px-3 py-2.5 ${fieldBorderClass(nameInvalid)}`}>
              {role === "speaker" ? (
                <AtSign className="h-4 w-4 text-gray-400" />
              ) : (
                <User className="h-4 w-4 text-gray-400" />
              )}
              <input
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={role === "speaker" ? "quiet_fox42" : "Jane Doe"}
                className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
              />
            </div>
            {role === "speaker" && (
              <div className="mt-1 flex items-center gap-1 text-xs">
                {usernameStatus === "checking" && (
                  <span className="flex items-center gap-1 text-gray-400">
                    <Loader2 className="h-3 w-3 animate-spin" /> Checking availability…
                  </span>
                )}
                {usernameStatus === "available" && (
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle2 className="h-3 w-3" /> Username available
                  </span>
                )}
                {usernameStatus === "unavailable" && (
                  <span className="flex items-center gap-1 text-red-500">
                    <AlertCircle className="h-3 w-3" /> {usernameMessage}
                  </span>
                )}
                {usernameStatus === "idle" && (
                  <span className="text-gray-400">
                    Letters, numbers, and underscores only — this is your anonymous identity, no one will see your real name.
                  </span>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">Email</label>
            <div className={`mt-1 flex items-center gap-2 rounded-lg border px-3 py-2.5 ${fieldBorderClass(emailInvalid)}`}>
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
            <div className={`mt-1 flex items-center gap-2 rounded-lg border px-3 py-2.5 ${fieldBorderClass(passwordInvalid)}`}>
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
            <p className={`mt-1 text-xs ${attemptedSubmit && passwordInvalid ? "text-red-500" : "text-gray-400"}`}>
              At least 8 characters.
            </p>
          </div>

          {role === "listener" && (
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-gray-600">
                <Tag className="h-4 w-4 text-gray-400" />
                Categories you can talk about
              </label>
              <div
                className={`mt-2 flex flex-wrap gap-2 rounded-lg p-2 ${
                  attemptedSubmit && topicsInvalid ? "border border-red-400" : "border border-transparent"
                }`}
              >
                {categories.map((category) => (
                  <button
                    key={category.label}
                    type="button"
                    onClick={() => toggleTopic(category.label)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      topics.includes(category.label)
                        ? "bg-brand-600 text-white"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    {category.emoji} {category.label}
                  </button>
                ))}
              </div>
              <p className={`mt-1 text-xs ${attemptedSubmit && topicsInvalid ? "text-red-500" : "text-gray-400"}`}>
                Select at least one.
              </p>
            </div>
          )}

          {role === "listener" && (
            <>
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-600">
                  <FileText className="h-4 w-4 text-gray-400" />
                  Bio <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <textarea
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  maxLength={500}
                  rows={3}
                  placeholder="A little about how you listen and what you're comfortable talking about…"
                  className="mt-1 w-full resize-none rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none placeholder:text-gray-400 focus:border-brand-400"
                />
                <p className="mt-1 text-right text-xs text-gray-400">{bio.length}/500</p>
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-600">
                  <LanguagesIcon className="h-4 w-4 text-gray-400" />
                  Languages <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <div ref={languageMenuRef} className="relative mt-1">
                  <button
                    type="button"
                    onClick={() => setLanguageMenuOpen((open) => !open)}
                    className="flex w-full items-center justify-between rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-ink-900 outline-none transition-colors focus:border-brand-400"
                  >
                    <span className={languages.length === 0 ? "text-gray-400" : ""}>
                      {languages.length === 0 ? "Select languages" : `${languages.length} selected`}
                    </span>
                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${languageMenuOpen ? "rotate-180" : ""}`} />
                  </button>
                  {languageMenuOpen && (
                    <div className="absolute z-10 mt-1.5 max-h-56 w-full overflow-y-auto rounded-xl border border-gray-100 bg-white py-1.5 shadow-soft">
                      {languageOptions.map((language) => {
                        const selected = languages.includes(language);
                        return (
                          <button
                            key={language}
                            type="button"
                            onClick={() => toggleLanguage(language)}
                            className="flex w-full items-center justify-between px-3.5 py-2 text-sm text-ink-900 hover:bg-gray-50"
                          >
                            {language}
                            {selected && <Check className="h-4 w-4 text-brand-600" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                {languages.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {languages.map((language) => (
                      <span
                        key={language}
                        className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600"
                      >
                        {language}
                        <button type="button" onClick={() => toggleLanguage(language)} className="text-gray-400 hover:text-red-500">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-600">
                  <IndianRupee className="h-4 w-4 text-gray-400" />
                  Price per minute
                </label>
                <div className={`mt-1 flex items-center gap-2 rounded-lg border px-3 py-2.5 ${fieldBorderClass(priceInvalid)}`}>
                  <IndianRupee className="h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    min={priceRange?.minimumPrice ?? 1}
                    max={priceRange?.maximumPrice}
                    value={pricePerMinute}
                    onChange={(event) => setPricePerMinute(event.target.value)}
                    placeholder="e.g. 2"
                    className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
                  />
                </div>
                <p className={`mt-1 text-xs ${attemptedSubmit && priceInvalid ? "text-red-500" : "text-gray-400"}`}>
                  {priceRange
                    ? `New listeners can charge between ₹${priceRange.minimumPrice} and ₹${priceRange.maximumPrice} per minute. This may be re-checked when your application is approved.`
                    : "This may be re-checked when your application is approved."}
                </p>
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-600">
                  <Camera className="h-4 w-4 text-gray-400" />
                  Photo <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <div className="mt-1 flex items-center gap-3">
                  {photoPreviewUrl && (
                    <img src={photoPreviewUrl} alt="Preview" className="h-12 w-12 rounded-full object-cover" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="w-full text-sm text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-xs file:font-medium file:text-gray-600 hover:file:bg-gray-200"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
                <h3 className="flex items-center gap-1.5 text-sm font-semibold text-ink-900">
                  <ShieldCheck className="h-4 w-4 text-brand-600" />
                  Before You Apply
                </h3>
                <ul className="mt-2.5 space-y-1.5 text-xs text-gray-600">
                  <li>🔒 Keep conversations on Solace</li>
                  <li>🤝 Respect Speakers</li>
                  <li>🔐 Protect privacy</li>
                  <li>🚫 No personal contact exchange</li>
                  <li>🚫 No off-platform payments</li>
                </ul>

                <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
                  <p className="font-semibold">🔒 Keep conversations on Solace</p>
                  <p className="mt-1">
                    For everyone's privacy and safety, never exchange phone numbers, email addresses,
                    WhatsApp/social media accounts, personal addresses, payment details, or other
                    personal contact information. Do not attempt to contact Speakers outside Solace.
                  </p>
                </div>

                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                  <button
                    type="button"
                    onClick={() => setOpenLegalModal("listener-guidelines")}
                    className="text-xs font-medium text-brand-600 underline-offset-2 hover:underline"
                  >
                    View Full Listener Guidelines
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpenLegalModal("listener-terms")}
                    className="text-xs font-medium text-brand-600 underline-offset-2 hover:underline"
                  >
                    View Listener Terms & Conditions
                  </button>
                </div>

                <div
                  className={`mt-3.5 space-y-2 rounded-lg p-2 ${
                    attemptedSubmit && agreementsInvalid ? "border border-red-400" : "border border-transparent"
                  }`}
                >
                  <label className="flex items-start gap-2 text-xs text-gray-700">
                    <input
                      type="checkbox"
                      checked={guidelinesChecked}
                      onChange={(event) => setGuidelinesChecked(event.target.checked)}
                      className="mt-0.5 rounded border-gray-300 text-brand-600 focus:ring-brand-400"
                    />
                    I have read and agree to the Solace Listener Guidelines.
                  </label>
                  <label className="flex items-start gap-2 text-xs text-gray-700">
                    <input
                      type="checkbox"
                      checked={termsChecked}
                      onChange={(event) => setTermsChecked(event.target.checked)}
                      className="mt-0.5 rounded border-gray-300 text-brand-600 focus:ring-brand-400"
                    />
                    I agree to the Solace Listener Terms & Conditions.
                  </label>
                  <label className="flex items-start gap-2 text-xs text-gray-700">
                    <input
                      type="checkbox"
                      checked={confidentialityChecked}
                      onChange={(event) => setConfidentialityChecked(event.target.checked)}
                      className="mt-0.5 rounded border-gray-300 text-brand-600 focus:ring-brand-400"
                    />
                    I agree to maintain the confidentiality and privacy of Speakers.
                  </label>
                </div>
                {attemptedSubmit && agreementsInvalid && (
                  <p className="mt-1.5 text-xs text-red-500">All three agreements are required.</p>
                )}
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={
              submitting ||
              (role === "speaker" && (usernameStatus === "checking" || usernameStatus === "unavailable"))
            }
            className="w-full rounded-lg bg-brand-600 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {submitting
              ? "Submitting..."
              : role === "speaker"
                ? "Create Account"
                : "Submit Application"}
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

      {openLegalModal && (
        <LegalDocumentModal
          slug={openLegalModal}
          fallbackTitle={openLegalModal === "listener-guidelines" ? "Listener Guidelines" : "Listener Terms & Conditions"}
          onClose={() => setOpenLegalModal(null)}
        />
      )}
    </div>
  );
}
