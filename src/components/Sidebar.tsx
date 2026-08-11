import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Heart,
  Home,
  Search,
  History,
  Wallet,
  Receipt,
  MessageSquare,
  Bell,
  UserCircle,
  Settings,
  HelpCircle,
  LogOut,
} from "lucide-react";
import { useAppData } from "../context/AppDataContext";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/app/home", label: "Home", icon: Home },
  { to: "/app/find-listeners", label: "Find Listeners", icon: Search },
  { to: "/app/sessions", label: "My Sessions", icon: History },
  { to: "/app/wallet", label: "Wallet", icon: Wallet },
  { to: "/app/transactions", label: "Transactions", icon: Receipt },
  { to: "/app/messages", label: "Messages", icon: MessageSquare },
  { to: "/app/notifications", label: "Notifications", icon: Bell },
  { to: "/app/profile", label: "Profile", icon: UserCircle },
  { to: "/app/settings", label: "Settings", icon: Settings },
  { to: "/app/help", label: "Help & Support", icon: HelpCircle },
];

export default function Sidebar() {
  const { walletBalance } = useAppData();
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
      </Link>

      <nav className="flex-1 space-y-1 px-3">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
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

      <div className="m-3 rounded-xl bg-brand-50 p-4">
        <p className="text-xs text-gray-500">Wallet Balance</p>
        <p className="mt-1 text-xl font-bold text-ink-900">
          ₹ {walletBalance.toLocaleString("en-IN")}
        </p>
        <Link
          to="/app/wallet"
          className="mt-3 block w-full rounded-lg bg-brand-600 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          Add Money
        </Link>
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
