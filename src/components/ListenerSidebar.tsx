import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Heart,
  LayoutDashboard,
  MessageSquare,
  History,
  Banknote,
  Wallet,
  Star,
  UserCircle,
  Settings,
  LogOut,
  Bell,
  HelpCircle,
} from "lucide-react";
import { useAppData } from "../context/AppDataContext";
import { useAuth } from "../context/AuthContext";
import ToggleSwitch from "./ToggleSwitch";

const navItems = [
  { to: "/listener", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/listener/messages", label: "Messages", icon: MessageSquare },
  { to: "/listener/sessions", label: "Sessions", icon: History },
  { to: "/listener/notifications", label: "Notifications", icon: Bell },
  { to: "/listener/earnings", label: "Earnings", icon: Wallet },
  { to: "/listener/withdrawals", label: "Withdrawals", icon: Banknote },
  { to: "/listener/ratings", label: "Ratings", icon: Star },
  { to: "/listener/profile", label: "Profile", icon: UserCircle },
  { to: "/listener/settings", label: "Settings", icon: Settings },
  { to: "/listener/support", label: "Help & Support", icon: HelpCircle },
];

export default function ListenerSidebar() {
  const { listenerOnline, toggleListenerOnline } = useAppData();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-gray-100 bg-white">
      <Link to="/" className="flex items-center gap-2 px-6 py-6">
        <Heart className="h-6 w-6 fill-brand-600 text-brand-600" />
        <span className="text-lg font-bold text-ink-900">Solace</span>
        <span className="ml-auto rounded-md bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700">
          Listener
        </span>
      </Link>

      <nav className="flex-1 space-y-1 px-3">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-brand-50 text-brand-700"
                  : "text-gray-500 hover:bg-gray-50 hover:text-ink-900"
              }`
            }
          >
            <Icon className="h-[18px] w-[18px]" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div
        className={`m-3 flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
          listenerOnline
            ? "bg-green-50 text-green-600"
            : "bg-gray-100 text-gray-500"
        }`}
      >
        {listenerOnline ? "Online" : "Offline"}
        <ToggleSwitch
          checked={listenerOnline}
          onChange={toggleListenerOnline}
          aria-label="Toggle online status"
        />
      </div>

      <div className="mx-3 mb-3 flex items-center justify-between border-t border-gray-100 pt-3">
        <span className="truncate text-sm font-medium text-ink-900">
          {user?.name ?? "Guest"}
        </span>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-red-500"
        >
          <LogOut className="h-3.5 w-3.5" />
          Logout
        </button>
      </div>
    </aside>
  );
}
