import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Check,
  X,
  ChevronDown,
  Users,
  Headphones,
  History,
  IndianRupee,
  Banknote,
  UserCheck,
  Radio,
  Wifi,
  Flag,
  Megaphone,
  Ticket,
  BarChart3,
  UserX,
} from "lucide-react";
import { platformHealth as platformHealthMock } from "../data/mockData";
import { useAuth } from "../context/AuthContext";
import { apiRequest, ApiError, resolveAssetUrl } from "../lib/apiClient";
import RevenueChart from "../components/RevenueChart";
import SessionsBarChart from "../components/SessionsBarChart";
import type { AdminWithdrawalRequestRecord } from "../types";

interface PendingApplication {
  id: string;
  name: string;
  avatar: string | null;
  topics: string[];
}

interface AdminOverview {
  totalUsers: number;
  activeListeners: number;
  todaysSessions: number;
  todaysRevenue: number;
  pendingApprovals: number;
  onlineUsers: number;
  onlineListeners: number;
  reportedConversations: number;
}

interface ConversationReport {
  id: string;
  reportedByName: string;
  reportedUserName: string;
  reason: string;
  status: "Open" | "Reviewing" | "Resolved";
  priority: "High" | "Medium" | "Low";
}

interface LeaderboardEntry {
  listenerId: string;
  name: string;
  avatarUrl: string | null;
  rating: number;
  reviewCount: number;
  revenue: number;
  sessionCount: number;
}

interface PlatformHealth {
  avgResponseTimeSeconds: number | null;
  avgSessionDurationSeconds: number | null;
  avgRating: number;
  systemStatus: string;
}

interface ChartPoint {
  day: string;
  value: number;
}

interface RevenueOverview {
  weekly: ChartPoint[];
  monthly: ChartPoint[];
}

interface SessionAnalytics {
  daily: ChartPoint[];
}

const TOP_LISTENERS_LIMIT = 5;

function initialsAvatar(name: string): string {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150"><rect width="150" height="150" fill="#ede9fe"/><text x="50%" y="50%" dy=".35em" text-anchor="middle" font-family="sans-serif" font-size="60" fill="#6d28d9">${initial}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

// Matches the original mock's style ("22s", "13m 40s") — omits the minutes
// segment entirely when it's zero rather than always showing "0m Xs".
function formatDurationHuman(seconds: number | null): string {
  if (seconds == null) return "—";
  const total = Math.round(seconds);
  const minutes = Math.floor(total / 60);
  const secs = total % 60;
  return minutes === 0 ? `${secs}s` : `${minutes}m ${secs}s`;
}

function ApplicationAvatar({ name, avatar }: { name: string; avatar: string | null }) {
  const resolvedAvatar = resolveAssetUrl(avatar);
  if (resolvedAvatar) {
    return <img src={resolvedAvatar} alt={name} className="h-9 w-9 rounded-full object-cover" />;
  }
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
      {initials}
    </div>
  );
}

function buildStats(overview: AdminOverview | null, processingWithdrawals: number) {
  return [
    { label: "Total Users", value: overview ? overview.totalUsers.toLocaleString("en-IN") : "—", icon: Users },
    { label: "Active Listeners", value: overview ? overview.activeListeners.toLocaleString("en-IN") : "—", icon: Headphones },
    { label: "Today's Sessions", value: overview ? overview.todaysSessions.toLocaleString("en-IN") : "—", icon: History },
    { label: "Today's Revenue", value: overview ? `₹ ${overview.todaysRevenue.toFixed(2)}` : "—", icon: IndianRupee },
    { label: "Processing Withdrawals", value: processingWithdrawals, icon: Banknote },
    { label: "Pending Approvals", value: overview ? overview.pendingApprovals.toLocaleString("en-IN") : "—", icon: UserCheck },
    { label: "Online Users", value: overview ? overview.onlineUsers.toLocaleString("en-IN") : "—", icon: Wifi },
    { label: "Online Listeners", value: overview ? overview.onlineListeners.toLocaleString("en-IN") : "—", icon: Radio },
    { label: "Reported Conversations", value: overview ? overview.reportedConversations.toLocaleString("en-IN") : "—", icon: Flag },
  ];
}

const withdrawalStatusStyles: Record<string, string> = {
  PROCESSING: "bg-amber-50 text-amber-600",
  SUCCESS: "bg-green-50 text-green-600",
  FAILED: "bg-red-50 text-red-500",
};

const priorityStyles: Record<string, string> = {
  High: "bg-red-50 text-red-500",
  Medium: "bg-amber-50 text-amber-600",
  Low: "bg-gray-100 text-gray-500",
};

const periodOptions = ["This Week", "This Month"] as const;

type Period = (typeof periodOptions)[number];

const quickActions = [
  // Was labeled "Approve Listener" but linked to the active/suspend listing,
  // which has no approve/reject action at all — that only exists on this
  // same Dashboard's "Listener Applications" card and its detail page.
  // Relabeled to match what this destination actually does.
  { label: "Manage Listeners", icon: UserCheck, to: "/admin/listeners" },
  { label: "Suspend User", icon: UserX, to: "/admin/users" },
  { label: "Send Announcement", icon: Megaphone, to: "/admin/notifications" },
  { label: "Create Coupon", icon: Ticket, to: "/admin/coupons" },
  // Was linking to /admin/reports (the conversation-report queue, unrelated
  // to analytics) — /admin/sessions has the real session-level stats
  // (completed/ongoing/cancelled counts, filtering).
  { label: "View Analytics", icon: BarChart3, to: "/admin/sessions" },
];

export default function AdminDashboard() {
  const { token } = useAuth();
  const [period, setPeriod] = useState<Period>("This Week");
  const [periodMenuOpen, setPeriodMenuOpen] = useState(false);
  const [withdrawals, setWithdrawals] = useState<AdminWithdrawalRequestRecord[]>([]);

  const [applications, setApplications] = useState<PendingApplication[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(true);
  const [applicationsError, setApplicationsError] = useState<string | null>(null);

  const [overview, setOverview] = useState<AdminOverview | null>(null);

  const [reports, setReports] = useState<ConversationReport[]>([]);
  const [reportsUpdatingId, setReportsUpdatingId] = useState<string | null>(null);

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  const [platformHealth, setPlatformHealth] = useState<PlatformHealth | null>(null);

  const [revenueOverview, setRevenueOverview] = useState<RevenueOverview | null>(null);
  const [sessionAnalytics, setSessionAnalytics] = useState<SessionAnalytics | null>(null);

  useEffect(() => {
    apiRequest<RevenueOverview>("/admin/revenue-overview", { token })
      .then(setRevenueOverview)
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    apiRequest<SessionAnalytics>("/admin/session-analytics", { token })
      .then(setSessionAnalytics)
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    apiRequest<{ data: PendingApplication[] }>("/admin/listener-applications", { token })
      .then((response) => setApplications(response.data))
      .catch((err) => setApplicationsError(err instanceof ApiError ? err.message : "Could not load applications."))
      .finally(() => setApplicationsLoading(false));
  }, [token]);

  useEffect(() => {
    apiRequest<AdminOverview>("/admin/overview", { token })
      .then(setOverview)
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    apiRequest<{ data: ConversationReport[] }>("/admin/reports", { token })
      .then((response) => setReports(response.data.filter((r) => r.status === "Open")))
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    apiRequest<{ data: LeaderboardEntry[] }>("/admin/leaderboard", { token })
      .then((response) => setLeaderboard(response.data.slice(0, TOP_LISTENERS_LIMIT)))
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    apiRequest<PlatformHealth>("/admin/platform-health", { token })
      .then(setPlatformHealth)
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    apiRequest<{ data: AdminWithdrawalRequestRecord[] }>("/admin/withdrawals", { token })
      .then((response) => setWithdrawals(response.data))
      .catch(() => {});
  }, [token]);

  const stats = buildStats(overview, withdrawals.filter((w) => w.status === "PROCESSING").length);

  const resolveReport = async (id: string) => {
    setReportsUpdatingId(id);
    try {
      await apiRequest(`/admin/reports/${id}/status`, { method: "PATCH", token, body: { status: "RESOLVED" } });
      setReports((prev) => prev.filter((r) => r.id !== id));
    } catch {
      // surfaced on the dedicated Reports page if this silently fails here
    } finally {
      setReportsUpdatingId(null);
    }
  };

  const approveApplication = async (id: string) => {
    try {
      await apiRequest(`/admin/listener-applications/${id}/approve`, { method: "POST", token });
      setApplications((prev) => prev.filter((application) => application.id !== id));
    } catch (err) {
      setApplicationsError(err instanceof ApiError ? err.message : "Could not approve this application.");
    }
  };

  const rejectApplication = async (id: string) => {
    try {
      await apiRequest(`/admin/listener-applications/${id}/reject`, { method: "POST", token });
      setApplications((prev) => prev.filter((application) => application.id !== id));
    } catch (err) {
      setApplicationsError(err instanceof ApiError ? err.message : "Could not reject this application.");
    }
  };

  const activeData = revenueOverview ? (period === "This Week" ? revenueOverview.weekly : revenueOverview.monthly) : [];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink-900">Dashboard</h1>
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
            A
          </span>
          Admin
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-gray-100 bg-white p-5"
          >
            <div className="flex items-center gap-2 text-gray-500">
              <stat.icon className="h-4 w-4" />
              <p className="text-sm">{stat.label}</p>
            </div>
            <p className="mt-2 text-2xl font-bold text-ink-900">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-ink-900">Revenue Overview</p>
            <div className="relative">
              <button
                onClick={() => setPeriodMenuOpen((prev) => !prev)}
                className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500"
              >
                {period}
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              {periodMenuOpen && (
                <div className="absolute right-0 z-10 mt-1 w-32 rounded-lg border border-gray-100 bg-white p-1 shadow-soft">
                  {periodOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setPeriod(option);
                        setPeriodMenuOpen(false);
                      }}
                      className={`block w-full rounded-md px-2 py-1.5 text-left text-xs ${
                        option === period
                          ? "bg-brand-50 text-brand-700"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          {activeData.length > 0 ? (
            <>
              <RevenueChart data={activeData} />
              <div className="mt-2 flex justify-between text-xs text-gray-400">
                {activeData.map((point) => (
                  <span key={point.day}>{point.day}</span>
                ))}
              </div>
            </>
          ) : (
            <p className="py-14 text-center text-sm text-gray-400">Loading...</p>
          )}
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <p className="font-semibold text-ink-900">Session Analytics</p>
          <p className="text-xs text-gray-400">Sessions per day</p>
          <div className="mt-4">
            {sessionAnalytics ? (
              <SessionsBarChart data={sessionAnalytics.daily} />
            ) : (
              <p className="py-14 text-center text-sm text-gray-400">Loading...</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <p className="font-semibold text-ink-900">Top Listeners</p>
          <div className="mt-4 space-y-4">
            {leaderboard.map((entry, index) => (
              <div key={entry.listenerId} className="flex items-center gap-3">
                <span className="w-4 text-xs font-semibold text-gray-400">
                  {index + 1}
                </span>
                <img
                  src={resolveAssetUrl(entry.avatarUrl) ?? initialsAvatar(entry.name)}
                  alt={entry.name}
                  className="h-9 w-9 rounded-full object-cover"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink-900">{entry.name}</p>
                  <p className="text-xs text-gray-400">
                    {entry.sessionCount} sessions · ★ {entry.rating.toFixed(1)}
                  </p>
                </div>
                <p className="text-sm font-semibold text-ink-900">
                  ₹{entry.revenue.toLocaleString("en-IN")}
                </p>
              </div>
            ))}

            {leaderboard.length === 0 && (
              <p className="py-6 text-center text-sm text-gray-400">No listener activity yet.</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <p className="font-semibold text-ink-900">Platform Health</p>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500">Avg. Response Time</p>
              <p className="mt-1 text-lg font-bold text-ink-900">
                {formatDurationHuman(platformHealth?.avgResponseTimeSeconds ?? null)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Avg. Session Duration</p>
              <p className="mt-1 text-lg font-bold text-ink-900">
                {formatDurationHuman(platformHealth?.avgSessionDurationSeconds ?? null)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Avg. Rating</p>
              <p className="mt-1 text-lg font-bold text-ink-900">
                ★ {platformHealth ? platformHealth.avgRating.toFixed(1) : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Failed Payments</p>
              <p className="mt-1 text-lg font-bold text-red-500">
                {platformHealthMock.failedPayments}
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-green-50 px-3 py-2 text-sm font-medium text-green-600">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            System {platformHealth?.systemStatus ?? "—"}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <p className="font-semibold text-ink-900">Recent Withdrawals</p>
          <div className="mt-4 space-y-4">
            {withdrawals.slice(0, 5).map((request) => (
              <div key={request.id} className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                  {request.listenerName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink-900">
                    {request.listenerName}
                  </p>
                  <p className="text-xs text-gray-400">
                    ₹{request.amount.toLocaleString("en-IN")} · {new Date(request.createdAt).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${withdrawalStatusStyles[request.status]}`}
                >
                  {request.status}
                </span>
              </div>
            ))}

            {withdrawals.length === 0 && (
              <p className="py-6 text-center text-sm text-gray-400">No withdrawals yet.</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <p className="font-semibold text-ink-900">Listener Applications</p>
          <div className="mt-4 space-y-4">
            {applicationsError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                {applicationsError}
              </p>
            )}

            {applicationsLoading && (
              <p className="py-6 text-center text-sm text-gray-400">Loading...</p>
            )}

            {!applicationsLoading &&
              applications.map((application) => (
                <div key={application.id} className="flex items-center gap-3">
                  <Link
                    to={`/admin/listener-applications/${application.id}`}
                    className="flex min-w-0 flex-1 items-center gap-3 rounded-lg hover:bg-gray-50"
                  >
                    <ApplicationAvatar name={application.name} avatar={application.avatar} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink-900">
                        {application.name}
                      </p>
                      <p className="truncate text-xs text-gray-400">
                        {application.topics.length > 0 ? application.topics.join(", ") : "Listener applicant"}
                      </p>
                    </div>
                  </Link>
                  <button
                    onClick={() => approveApplication(application.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-green-50 text-green-600 hover:bg-green-100"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => rejectApplication(application.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}

            {!applicationsLoading && applications.length === 0 && (
              <p className="py-6 text-center text-sm text-gray-400">
                No pending applications.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-5">
        <p className="font-semibold text-ink-900">Reports Queue</p>
        <div className="mt-4 space-y-3">
          {reports.map((report) => (
            <div
              key={report.id}
              className="flex items-center gap-3 rounded-xl border border-gray-100 px-4 py-3"
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-ink-900">
                  {report.reportedUserName}
                  <span className="ml-2 font-normal text-gray-400">by {report.reportedByName}</span>
                </p>
                <p className="text-xs text-gray-400">{report.reason}</p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  priorityStyles[report.priority]
                }`}
              >
                {report.priority}
              </span>
              <button
                onClick={() => resolveReport(report.id)}
                disabled={reportsUpdatingId === report.id}
                className="rounded-lg border border-green-200 px-3 py-1.5 text-xs font-semibold text-green-600 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Resolve
              </button>
              <Link
                to="/admin/reports"
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-ink-900 hover:bg-gray-50"
              >
                Review
              </Link>
            </div>
          ))}

          {reports.length === 0 && (
            <p className="py-6 text-center text-sm text-gray-400">No open reports.</p>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-5">
        <p className="font-semibold text-ink-900">Quick Admin Actions</p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              to={action.to}
              className="flex flex-col items-center gap-2 rounded-2xl border border-gray-100 py-4 text-center text-xs font-medium text-ink-900 hover:border-brand-200 hover:bg-brand-50"
            >
              <action.icon className="h-5 w-5 text-brand-600" />
              {action.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
