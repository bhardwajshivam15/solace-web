import { useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Plus, Trash2, UserPlus } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { apiRequest, ApiError } from "../lib/apiClient";

interface PlatformSettingsData {
  supportEmail: string;
  acceptanceTimeoutSeconds: number;
  reconnectionGracePeriodSeconds: number;
  minimumWalletBalance: number;
  reviewsToShow: number;
}

interface PricingConfigData {
  platformMinimumPrice: number;
  initialListenerMaximumPrice: number;
  platformCommissionPercentage: number;
}

interface RatingRule {
  minimumRating: number;
  maximumPrice: number;
}

export default function AdminSettings() {
  const { token } = useAuth();
  const [settings, setSettings] = useState<PlatformSettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  const [pricingConfig, setPricingConfig] = useState<PricingConfigData | null>(null);
  const [ratingRules, setRatingRules] = useState<RatingRule[]>([]);
  const [pricingLoading, setPricingLoading] = useState(true);
  const [pricingError, setPricingError] = useState<string | null>(null);
  const [pricingSaving, setPricingSaving] = useState(false);
  const [pricingConfirmation, setPricingConfirmation] = useState<string | null>(null);
  const pricingErrorRef = useRef<HTMLDivElement>(null);

  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteConfirmation, setInviteConfirmation] = useState<string | null>(null);

  // The pricing card's error banner renders above the rating-rules table,
  // while "Save Pricing Rules" sits below it — same off-screen-feedback gap
  // fixed on ListenerProfile.tsx, applied here for the same reason.
  useEffect(() => {
    if (pricingError) pricingErrorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [pricingError]);

  useEffect(() => {
    setLoading(true);
    apiRequest<{ settings: PlatformSettingsData }>("/admin/settings", { token })
      .then((response) => setSettings(response.settings))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Could not load platform settings."))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    setPricingLoading(true);
    Promise.all([
      apiRequest<PricingConfigData>("/admin/settings/pricing", { token }),
      apiRequest<{ data: RatingRule[] }>("/admin/settings/pricing/rating-rules", { token }),
    ])
      .then(([config, rules]) => {
        setPricingConfig(config);
        setRatingRules(rules.data);
      })
      .catch((err) => setPricingError(err instanceof ApiError ? err.message : "Could not load pricing rules."))
      .finally(() => setPricingLoading(false));
  }, [token]);

  const handleNumberChange = (field: keyof Omit<PlatformSettingsData, "supportEmail">, value: string) => {
    setSettings((prev) => (prev ? { ...prev, [field]: Number(value) } : prev));
  };

  const handleEmailChange = (value: string) => {
    setSettings((prev) => (prev ? { ...prev, supportEmail: value } : prev));
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setError(null);
    try {
      const response = await apiRequest<{ settings: PlatformSettingsData }>("/admin/settings", {
        method: "PATCH",
        token,
        body: settings,
      });
      setSettings(response.settings);
      setConfirmation("Settings saved successfully.");
      window.setTimeout(() => setConfirmation(null), 2500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save these settings.");
    } finally {
      setSaving(false);
    }
  };

  const handlePricingConfigChange = (field: keyof PricingConfigData, value: string) => {
    setPricingConfig((prev) => (prev ? { ...prev, [field]: Number(value) } : prev));
  };

  const updateRule = (index: number, field: keyof RatingRule, value: string) => {
    setRatingRules((prev) => prev.map((rule, i) => (i === index ? { ...rule, [field]: Number(value) } : rule)));
  };

  const addRule = () => {
    setRatingRules((prev) => [...prev, { minimumRating: 0, maximumPrice: 0 }]);
  };

  const removeRule = (index: number) => {
    setRatingRules((prev) => prev.filter((_, i) => i !== index));
  };

  const validatePricing = (): string | null => {
    if (!pricingConfig) return "Pricing configuration hasn't loaded yet.";
    if (pricingConfig.platformMinimumPrice <= 0) return "Platform minimum price must be greater than 0.";
    if (pricingConfig.initialListenerMaximumPrice <= 0) return "New listener maximum must be greater than 0.";
    if (pricingConfig.initialListenerMaximumPrice < pricingConfig.platformMinimumPrice) {
      return "New listener maximum can't be below the platform minimum.";
    }
    if (pricingConfig.platformCommissionPercentage < 0 || pricingConfig.platformCommissionPercentage > 100) {
      return "Platform commission must be between 0 and 100.";
    }
    if (ratingRules.length === 0) return "At least one rating pricing rule is required.";
    const seenThresholds = new Set<number>();
    for (const rule of ratingRules) {
      if (rule.minimumRating < 0 || rule.minimumRating > 5) return "Rating thresholds must be between 0 and 5.";
      if (rule.maximumPrice <= 0) return "Every rating tier's maximum price must be greater than 0.";
      if (rule.maximumPrice < pricingConfig.platformMinimumPrice) {
        return `Maximum price for rating ${rule.minimumRating} can't be below the platform minimum (₹${pricingConfig.platformMinimumPrice}).`;
      }
      if (seenThresholds.has(rule.minimumRating)) return `Duplicate rating threshold: ${rule.minimumRating}.`;
      seenThresholds.add(rule.minimumRating);
    }
    return null;
  };

  const handleInviteAdmin = async () => {
    if (!inviteName.trim() || !inviteEmail.trim()) {
      setInviteError("Name and email are both required.");
      return;
    }
    setInviting(true);
    setInviteError(null);
    try {
      await apiRequest("/admin/users/invite-admin", {
        method: "POST",
        token,
        body: { name: inviteName.trim(), email: inviteEmail.trim() },
      });
      setInviteConfirmation(`Invite sent to ${inviteEmail.trim()}.`);
      window.setTimeout(() => setInviteConfirmation(null), 2500);
      setInviteName("");
      setInviteEmail("");
    } catch (err) {
      setInviteError(err instanceof ApiError ? err.message : "Could not send this invite.");
    } finally {
      setInviting(false);
    }
  };

  const handleSavePricing = async () => {
    const validationError = validatePricing();
    if (validationError) {
      setPricingError(validationError);
      return;
    }
    setPricingSaving(true);
    setPricingError(null);
    try {
      const [config, rules] = await Promise.all([
        apiRequest<PricingConfigData>("/admin/settings/pricing", { method: "PUT", token, body: pricingConfig }),
        apiRequest<{ data: RatingRule[] }>("/admin/settings/pricing/rating-rules", {
          method: "PUT",
          token,
          body: { rules: ratingRules },
        }),
      ]);
      setPricingConfig(config);
      setRatingRules(rules.data);
      setPricingConfirmation("Pricing rules saved successfully.");
      window.setTimeout(() => setPricingConfirmation(null), 2500);
    } catch (err) {
      setPricingError(err instanceof ApiError ? err.message : "Could not save pricing rules.");
    } finally {
      setPricingSaving(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold text-ink-900">Settings</h1>

      {error && (
        <div className="mt-4 flex max-w-xl items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-600">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="mt-6 max-w-xl rounded-2xl border border-gray-100 bg-white p-5">
        <p className="font-semibold text-ink-900">Platform Settings</p>

        {loading && <p className="mt-4 text-sm text-gray-400">Loading…</p>}

        {!loading && settings && (
          <div className="mt-4 space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-500">Support Email</label>
              <input
                type="text"
                value={settings.supportEmail}
                onChange={(e) => handleEmailChange(e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-ink-900 focus:border-brand-400 focus:outline-none"
              />
            </div>

            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-semibold uppercase text-gray-400">Live Session Rules</p>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500">
                Acceptance Timeout (seconds)
              </label>
              <p className="text-[11px] text-gray-400">
                How long a speaker has to join after a listener accepts before the request expires.
              </p>
              <input
                type="number"
                value={settings.acceptanceTimeoutSeconds}
                onChange={(e) => handleNumberChange("acceptanceTimeoutSeconds", e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-ink-900 focus:border-brand-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500">
                Reconnection Grace Period (seconds)
              </label>
              <p className="text-[11px] text-gray-400">
                How long a dropped session stays paused waiting for both sides to reconnect.
              </p>
              <input
                type="number"
                value={settings.reconnectionGracePeriodSeconds}
                onChange={(e) => handleNumberChange("reconnectionGracePeriodSeconds", e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-ink-900 focus:border-brand-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500">
                Minimum Wallet Balance (₹)
              </label>
              <p className="text-[11px] text-gray-400">
                A speaker's active session ends automatically once their remaining balance would drop below this.
              </p>
              <input
                type="number"
                value={settings.minimumWalletBalance}
                onChange={(e) => handleNumberChange("minimumWalletBalance", e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-ink-900 focus:border-brand-400 focus:outline-none"
              />
            </div>

            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-semibold uppercase text-gray-400">Landing Page</p>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500">
                Reviews to Show
              </label>
              <p className="text-[11px] text-gray-400">
                Split as evenly as possible between speaker and listener reviews, highest-rated first.
                Set to 0 to hide the reviews section entirely.
              </p>
              <input
                type="number"
                min={0}
                value={settings.reviewsToShow}
                onChange={(e) => handleNumberChange("reviewsToShow", e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-ink-900 focus:border-brand-400 focus:outline-none"
              />
            </div>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving || loading || !settings}
          className="mt-5 w-full rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>

        {confirmation && (
          <p className="mt-3 flex items-center justify-center gap-2 text-sm text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            {confirmation}
          </p>
        )}
      </div>

      <div className="mt-6 max-w-xl rounded-2xl border border-gray-100 bg-white p-5">
        <p className="font-semibold text-ink-900">Listener Pricing Rules</p>
        <p className="mt-1 text-xs text-gray-400">
          Every listener sets their own price — these rules control the range they're allowed to choose from,
          based on their current rating. Changing a rule never rewrites a listener's existing price or an
          already-active session's locked rate.
        </p>

        {pricingError && (
          <div ref={pricingErrorRef} className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-600">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {pricingError}
          </div>
        )}

        {pricingLoading && <p className="mt-4 text-sm text-gray-400">Loading…</p>}

        {!pricingLoading && pricingConfig && (
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500">Platform Minimum Price (₹/min)</label>
                <input
                  type="number"
                  value={pricingConfig.platformMinimumPrice}
                  onChange={(e) => handlePricingConfigChange("platformMinimumPrice", e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-ink-900 focus:border-brand-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">New Listener Maximum (₹/min)</label>
                <input
                  type="number"
                  value={pricingConfig.initialListenerMaximumPrice}
                  onChange={(e) => handlePricingConfigChange("initialListenerMaximumPrice", e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-ink-900 focus:border-brand-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-semibold uppercase text-gray-400">Rating-Based Pricing</p>
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2 text-[11px] font-medium text-gray-400">
                  <span className="flex-1">Minimum Rating</span>
                  <span className="flex-1">Maximum Price (₹/min)</span>
                  <span className="w-8" />
                </div>
                {ratingRules.map((rule, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.1"
                      min={0}
                      max={5}
                      value={rule.minimumRating}
                      onChange={(e) => updateRule(index, "minimumRating", e.target.value)}
                      className="w-full flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm text-ink-900 focus:border-brand-400 focus:outline-none"
                    />
                    <input
                      type="number"
                      value={rule.maximumPrice}
                      onChange={(e) => updateRule(index, "maximumPrice", e.target.value)}
                      className="w-full flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm text-ink-900 focus:border-brand-400 focus:outline-none"
                    />
                    <button
                      onClick={() => removeRule(index)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500"
                      title="Remove this rule"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={addRule}
                className="mt-3 flex items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-500 hover:border-brand-300 hover:text-brand-600"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Rating Tier
              </button>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <label className="text-xs font-medium text-gray-500">Platform Commission (%)</label>
              <p className="text-[11px] text-gray-400">
                Company's share of every session's cost — the rest goes to the listener. Applied live to
                every session as it completes, never edited after the fact.
              </p>
              <input
                type="number"
                min={0}
                max={100}
                value={pricingConfig.platformCommissionPercentage}
                onChange={(e) => handlePricingConfigChange("platformCommissionPercentage", e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-ink-900 focus:border-brand-400 focus:outline-none"
              />
              <p className="mt-1.5 text-[11px] text-gray-400">
                Example: on a ₹400 session, the platform keeps ₹
                {((pricingConfig.platformCommissionPercentage / 100) * 400).toFixed(0)} and the listener
                receives ₹{(400 - (pricingConfig.platformCommissionPercentage / 100) * 400).toFixed(0)}.
              </p>
            </div>
          </div>
        )}

        <button
          onClick={handleSavePricing}
          disabled={pricingSaving || pricingLoading || !pricingConfig}
          className="mt-5 w-full rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pricingSaving ? "Saving…" : "Save Pricing Rules"}
        </button>

        {pricingConfirmation && (
          <p className="mt-3 flex items-center justify-center gap-2 text-sm text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            {pricingConfirmation}
          </p>
        )}
      </div>

      <div className="mt-6 max-w-xl rounded-2xl border border-gray-100 bg-white p-5">
        <p className="flex items-center gap-2 font-semibold text-ink-900">
          <UserPlus className="h-4 w-4 text-brand-600" />
          Invite Admin
        </p>
        <p className="mt-1 text-xs text-gray-400">
          Creates the account immediately and emails them a link to set their own password —
          only works for an email that isn't already a speaker, listener, or admin.
        </p>

        {inviteError && (
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-600">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {inviteError}
          </div>
        )}

        <div className="mt-4 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500">Name</label>
            <input
              type="text"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-ink-900 focus:border-brand-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Email</label>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-ink-900 focus:border-brand-400 focus:outline-none"
            />
          </div>
        </div>

        <button
          onClick={handleInviteAdmin}
          disabled={inviting}
          className="mt-5 w-full rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {inviting ? "Sending invite…" : "Send Invite"}
        </button>

        {inviteConfirmation && (
          <p className="mt-3 flex items-center justify-center gap-2 text-sm text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            {inviteConfirmation}
          </p>
        )}
      </div>
    </div>
  );
}
