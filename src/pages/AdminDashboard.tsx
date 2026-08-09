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
import {
  revenueOverview,
  revenueOverviewMonthly,
  sessionsPerDay,
  withdrawalRequests as seedWithdrawalRequests,
  topListeners,
  platformHealth,
  reportedConversations,
  adminOverviewStats,
} from "../data/mockData";
import { useAuth } from "../context/AuthContext";
import { apiRequest, ApiError } from "../lib/apiClient";
import RevenueChart from "../components/RevenueChart";
import SessionsBarChart from "../components/SessionsBarChart";

interface PendingApplication {
  id: string;
  name: string;
  avatar: string | null;
  topic: string | null;
}

function ApplicationAvatar({ name, avatar }: { name: string; avatar: string | null }) {
  if (avatar) {
    return <img src={avatar} alt={name} className="h-9 w-9 rounded-full object-cover" />;
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

const stats = [
  { label: "Total Users", value: adminOverviewStats.totalUsers.toLocaleString("en-IN"), icon: Users },
  { label: "Active Listeners", value: adminOverviewStats.activeListeners.toLocaleString("en-IN"), icon: Headphones },
  { label: "Today's Sessions", value: adminOverviewStats.todaysSessions.toLocaleString("en-IN"), icon: History },
  { label: "Today's Revenue", value: `₹ ${adminOverviewStats.todaysRevenue.toLocaleString("en-IN")}`, icon: IndianRupee },
  { label: "Pending Withdrawals", value: adminOverviewStats.pendingWithdrawals, icon: Banknote },
  { label: "Pending Approvals", value: adminOverviewStats.pendingApprovals, icon: UserCheck },
  { label: "Online Users", value: adminOverviewStats.onlineUsers.toLocaleString("en-IN"), icon: Wifi },
  { label: "Online Listeners", value: adminOverviewStats.onlineListeners.toLocaleString("en-IN"), icon: Radio },
  { label: "Reported Conversations", value: adminOverviewStats.reportedConversations, icon: Flag },
];

const statusStyles: Record<string, string> = {
  Pending: "bg-amber-50 text-amber-600",
  Approved: "bg-green-50 text-green-600",
  Rejected: "bg-red-50 text-red-500",
};

const priorityStyles: Record<string, string> = {
  High: "bg-red-50 text-red-500",
  Medium: "bg-amber-50 text-amber-600",
  Low: "bg-gray-100 text-gray-500",
};

const periods = {
  "This Week": revenueOverview,
  "This Month": revenueOverviewMonthly,
} as const;

type Period = keyof typeof periods;

const quickActions = [
  { label: "Approve Listener", icon: UserCheck, to: "/admin/listeners" },
  { label: "Suspend User", icon: UserX, to: "/admin/users" },
  { label: "Send Announcement", icon: Megaphone, to: "/admin/settings" },
  { label: "Create Coupon", icon: Ticket, to: "/admin/settings" },
  { label: "View Analytics", icon: BarChart3, to: "/admin/reports" },
];

export default function AdminDashboard() {
  const { token } = useAuth();
  const [period, setPeriod] = useState<Period>("This Week");
  const [periodMenuOpen, setPeriodMenuOpen] = useState(false);
  const [withdrawals, setWithdrawals] = useState(seedWithdrawalRequests);

  const [applications, setApplications] = useState<PendingApplication[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(true);
  const [applicationsError, setApplicationsError] = useState<string | null>(null);

  useEffect(() => {
    apiRequest<{ data: PendingApplication[] }>("/admin/listener-applications", { token })
      .then((response) => setApplications(response.data))
      .catch((err) => setApplicationsError(err instanceof ApiError ? err.message : "Could not load applications."))
      .finally(() => setApplicationsLoading(false));
  }, [token]);

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

  const activeData = periods[period];

  const setWithdrawalStatus = (id: string, status: "Approved" | "Rejected") => {
    setWithdrawals((prev) =>
      prev.map((request) => (request.id === id ? { ...request, status } : request)),
    );
  };

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
                  {(Object.keys(periods) as Period[]).map((option) => (
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
          <RevenueChart data={activeData} />
          <div className="mt-2 flex justify-between text-xs text-gray-400">
            {activeData.map((point) => (
              <span key={point.day}>{point.day}</span>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <p className="font-semibold text-ink-900">Session Analytics</p>
          <p className="text-xs text-gray-400">Sessions per day</p>
          <div className="mt-4">
            <SessionsBarChart data={sessionsPerDay} />
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <p className="font-semibold text-ink-900">Top Listeners</p>
          <div className="mt-4 space-y-4">
            {topListeners.map((listener, index) => (
              <div key={listener.id} className="flex items-center gap-3">
                <span className="w-4 text-xs font-semibold text-gray-400">
                  {index + 1}
                </span>
                <img
                  src={listener.avatar}
                  alt={listener.name}
                  className="h-9 w-9 rounded-full object-cover"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink-900">{listener.name}</p>
                  <p className="text-xs text-gray-400">
                    {listener.sessions} sessions · ★ {listener.rating}
                  </p>
                </div>
                <p className="text-sm font-semibold text-ink-900">
                  ₹{listener.revenue.toLocaleString("en-IN")}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <p className="font-semibold text-ink-900">Platform Health</p>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500">Avg. Response Time</p>
              <p className="mt-1 text-lg font-bold text-ink-900">
                {platformHealth.avgResponseTime}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Avg. Session Duration</p>
              <p className="mt-1 text-lg font-bold text-ink-900">
                {platformHealth.avgSessionDuration}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Avg. Rating</p>
              <p className="mt-1 text-lg font-bold text-ink-900">
                ★ {platformHealth.avgRating}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Failed Payments</p>
              <p className="mt-1 text-lg font-bold text-red-500">
                {platformHealth.failedPayments}
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-green-50 px-3 py-2 text-sm font-medium text-green-600">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            System {platformHealth.systemStatus}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <p className="font-semibold text-ink-900">Recent Withdrawals</p>
          <div className="mt-4 space-y-4">
            {withdrawals.map((request) => (
              <div key={request.id} className="flex items-center gap-3">
                <img
                  src={request.avatar}
                  alt={request.name}
                  className="h-9 w-9 rounded-full object-cover"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink-900">
                    {request.name}
                  </p>
                  <p className="text-xs text-gray-400">{request.date}</p>
                </div>
                {request.status === "Pending" ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setWithdrawalStatus(request.id, "Approved")}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-green-50 text-green-600 hover:bg-green-100"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setWithdrawalStatus(request.id, "Rejected")}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      statusStyles[request.status]
                    }`}
                  >
                    {request.status}
                  </span>
                )}
              </div>
            ))}
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
                  <ApplicationAvatar name={application.name} avatar={application.avatar} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-ink-900">
                      {application.name}
                    </p>
                    <p className="text-xs text-gray-400">{application.topic ?? "Listener applicant"}</p>
                  </div>
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
          {reportedConversations.map((report) => (
            <div
              key={report.id}
              className="flex items-center gap-3 rounded-xl border border-gray-100 px-4 py-3"
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-ink-900">{report.user}</p>
                <p className="text-xs text-gray-400">{report.reason}</p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  priorityStyles[report.priority]
                }`}
              >
                {report.priority}
              </span>
              <Link
                to="/admin/reports"
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-ink-900 hover:bg-gray-50"
              >
                Review
              </Link>
            </div>
          ))}
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
