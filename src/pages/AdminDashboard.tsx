import { useState } from "react";
import { Check, X, ChevronDown } from "lucide-react";
import {
  revenueOverview,
  revenueOverviewMonthly,
  withdrawalRequests,
} from "../data/mockData";
import { useAppData } from "../context/AppDataContext";
import RevenueChart from "../components/RevenueChart";

const stats = [
  { label: "Total Users", value: "12,345", delta: "+12.5% this month" },
  { label: "Active Listeners", value: "456", delta: "+8.2% this month" },
  { label: "Today's Sessions", value: "1,234", delta: "+15.3% this month" },
  { label: "Today's Revenue", value: "₹ 45,678", delta: "+18.7% this month" },
];

const statusStyles: Record<string, string> = {
  Pending: "bg-amber-50 text-amber-600",
  Approved: "bg-green-50 text-green-600",
  Rejected: "bg-red-50 text-red-500",
};

const periods = {
  "This Week": revenueOverview,
  "This Month": revenueOverviewMonthly,
} as const;

type Period = keyof typeof periods;

export default function AdminDashboard() {
  const { applications, approveApplication, rejectApplication } = useAppData();
  const [period, setPeriod] = useState<Period>("This Week");
  const [periodMenuOpen, setPeriodMenuOpen] = useState(false);

  const activeData = periods[period];

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

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-gray-100 bg-white p-5"
          >
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="mt-2 text-2xl font-bold text-ink-900">
              {stat.value}
            </p>
            <p className="mt-1 text-xs font-medium text-green-600">
              {stat.delta}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-5">
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

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <p className="font-semibold text-ink-900">Recent Withdrawals</p>
          <div className="mt-4 space-y-4">
            {withdrawalRequests.map((request) => (
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
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    statusStyles[request.status]
                  }`}
                >
                  {request.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <p className="font-semibold text-ink-900">Listener Applications</p>
          <div className="mt-4 space-y-4">
            {applications.map((application) => (
              <div key={application.id} className="flex items-center gap-3">
                <img
                  src={application.avatar}
                  alt={application.name}
                  className="h-9 w-9 rounded-full object-cover"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink-900">
                    {application.name}
                  </p>
                  <p className="text-xs text-gray-400">{application.topic}</p>
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

            {applications.length === 0 && (
              <p className="py-6 text-center text-sm text-gray-400">
                No pending applications.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
