import { NavLink } from "react-router-dom";
import {
  Heart,
  LayoutDashboard,
  Users,
  Headphones,
  History,
  Receipt,
  Banknote,
  FileBarChart,
  Trophy,
  Settings,
} from "lucide-react";

const navItems = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/listeners", label: "Listeners", icon: Headphones },
  { to: "/admin/sessions", label: "Sessions", icon: History },
  { to: "/admin/transactions", label: "Transactions", icon: Receipt },
  { to: "/admin/withdrawals", label: "Withdrawals", icon: Banknote },
  { to: "/admin/reports", label: "Reports", icon: FileBarChart },
  { to: "/admin/leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminSidebar() {
  return (
    <aside className="flex h-full w-60 shrink-0 flex-col bg-[#1e1b2e]">
      <div className="flex items-center gap-2 px-6 py-6">
        <Heart className="h-6 w-6 fill-brand-400 text-brand-400" />
        <span className="text-lg font-bold text-white">Solace</span>
        <span className="ml-auto rounded-md bg-white/10 px-2 py-0.5 text-[11px] font-medium text-gray-300">
          Admin
        </span>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-brand-600 text-white"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              }`
            }
          >
            <Icon className="h-[18px] w-[18px]" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
