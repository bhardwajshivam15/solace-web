import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Check, X, Mail, Calendar, IndianRupee, Tag, Languages, FileText, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { apiRequest, ApiError, resolveAssetUrl } from "../lib/apiClient";

interface ApplicationDetail {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  bio: string | null;
  topics: string[];
  languages: string[];
  pricePerMinute: number | null;
  termsAccepted: boolean | null;
  termsVersion: string | null;
  guidelinesAccepted: boolean | null;
  guidelinesVersion: string | null;
  confidentialityAccepted: boolean | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
}

const statusStyles: Record<ApplicationDetail["status"], string> = {
  PENDING: "bg-amber-50 text-amber-600",
  APPROVED: "bg-green-50 text-green-600",
  REJECTED: "bg-red-50 text-red-500",
};

function AgreementRow({ label, accepted, version }: { label: string; accepted: boolean | null; version: string | null }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="flex items-center gap-2 text-sm text-gray-600">
        {accepted ? (
          <Check className="h-4 w-4 text-green-600" />
        ) : (
          <X className="h-4 w-4 text-red-500" />
        )}
        {label}
      </span>
      {version && <span className="text-xs text-gray-400">v{version}</span>}
    </div>
  );
}

export default function AdminListenerApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deciding, setDeciding] = useState(false);

  useEffect(() => {
    if (!id) return;
    apiRequest<{ application: ApplicationDetail }>(`/admin/listener-applications/${id}`, { token })
      .then((response) => setApplication(response.application))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Could not load this application."))
      .finally(() => setLoading(false));
  }, [id, token]);

  const decide = async (action: "approve" | "reject") => {
    if (!id) return;
    setDeciding(true);
    setError(null);
    try {
      await apiRequest(`/admin/listener-applications/${id}/${action}`, { method: "POST", token });
      navigate("/admin");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : `Could not ${action} this application.`);
      setDeciding(false);
    }
  };

  const initials = application?.name
    ? application.name
        .split(" ")
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "";

  return (
    <div className="mx-auto max-w-3xl p-8">
      <Link to="/admin" className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-ink-900">
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      {loading && <p className="mt-6 text-sm text-gray-400">Loading…</p>}

      {!loading && error && !application && (
        <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 text-center">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}

      {!loading && application && (
        <div className="mt-6 rounded-3xl border border-gray-100 bg-white shadow-soft">
          <div className="flex items-center gap-4 border-b border-gray-100 px-6 py-6">
            {resolveAssetUrl(application.avatar) ? (
              <img
                src={resolveAssetUrl(application.avatar)!}
                alt={application.name}
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-lg font-semibold text-brand-700">
                {initials}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-lg font-bold text-ink-900">{application.name}</h1>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[application.status]}`}>
                  {application.status === "PENDING" ? "Pending" : application.status === "APPROVED" ? "Approved" : "Rejected"}
                </span>
              </div>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
                <Mail className="h-3.5 w-3.5" />
                {application.email}
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-400">
                <Calendar className="h-3.5 w-3.5" />
                Applied{" "}
                {new Date(application.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          {error && <p className="border-b border-gray-100 px-6 py-3 text-sm text-red-500">{error}</p>}

          <div className="space-y-5 px-6 py-6">
            <div>
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase text-gray-400">
                <FileText className="h-3.5 w-3.5" />
                Bio
              </p>
              <p className="mt-1.5 text-sm text-gray-600">{application.bio || "No bio provided."}</p>
            </div>

            <div>
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase text-gray-400">
                <Tag className="h-3.5 w-3.5" />
                Categories
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {application.topics.length > 0 ? (
                  application.topics.map((topic) => (
                    <span key={topic} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                      {topic}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-400">None selected.</span>
                )}
              </div>
            </div>

            <div>
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase text-gray-400">
                <Languages className="h-3.5 w-3.5" />
                Languages
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {application.languages.length > 0 ? (
                  application.languages.map((language) => (
                    <span key={language} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                      {language}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-400">None selected.</span>
                )}
              </div>
            </div>

            <div>
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase text-gray-400">
                <IndianRupee className="h-3.5 w-3.5" />
                Proposed Price
              </p>
              <p className="mt-1.5 text-sm text-gray-600">
                {application.pricePerMinute != null
                  ? `₹${application.pricePerMinute} / minute (re-checked against current pricing rules at approval)`
                  : "Not proposed — will default to the current new-listener price on approval."}
              </p>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase text-gray-400">
                <ShieldCheck className="h-3.5 w-3.5" />
                Agreements
              </p>
              <div className="mt-1 divide-y divide-gray-50">
                <AgreementRow label="Listener Guidelines accepted" accepted={application.guidelinesAccepted} version={application.guidelinesVersion} />
                <AgreementRow label="Terms & Conditions accepted" accepted={application.termsAccepted} version={application.termsVersion} />
                <AgreementRow label="Confidentiality agreement accepted" accepted={application.confidentialityAccepted} version={null} />
              </div>
            </div>
          </div>

          {application.status === "PENDING" && (
            <div className="flex gap-3 border-t border-gray-100 bg-gray-50/60 px-6 py-4">
              <button
                onClick={() => decide("reject")}
                disabled={deciding}
                className="flex-1 rounded-xl border border-red-200 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Reject
              </button>
              <button
                onClick={() => decide("approve")}
                disabled={deciding}
                className="flex-1 rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deciding ? "Saving…" : "Approve"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
