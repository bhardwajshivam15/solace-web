import { Navigate, Route, Routes } from "react-router-dom";
import { AppDataProvider } from "./context/AppDataContext";
import AppLayout from "./layouts/AppLayout";
import AdminLayout from "./layouts/AdminLayout";
import ListenerLayout from "./layouts/ListenerLayout";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";

// Speaker
import Home from "./pages/Home";
import FindListeners from "./pages/FindListeners";
import Wallet from "./pages/Wallet";
import Transactions from "./pages/Transactions";
import MySessions from "./pages/MySessions";
import SpeakerMessages from "./pages/SpeakerMessages";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import HelpSupport from "./pages/HelpSupport";

// Listener
import ListenerDashboard from "./pages/ListenerDashboard";
import ListenerMessages from "./pages/ListenerMessages";
import ListenerSessions from "./pages/ListenerSessions";
import Availability from "./pages/Availability";
import Earnings from "./pages/Earnings";
import Withdrawals from "./pages/Withdrawals";
import Ratings from "./pages/Ratings";
import ListenerProfile from "./pages/ListenerProfile";
import ListenerSettings from "./pages/ListenerSettings";

// Admin
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminListeners from "./pages/AdminListeners";
import AdminSessions from "./pages/AdminSessions";
import AdminTransactions from "./pages/AdminTransactions";
import AdminWithdrawals from "./pages/AdminWithdrawals";
import AdminReports from "./pages/AdminReports";
import AdminLeaderboard from "./pages/AdminLeaderboard";
import AdminNotifications from "./pages/AdminNotifications";
import AdminCms from "./pages/AdminCms";
import AdminSettings from "./pages/AdminSettings";
import AdminAuditLogs from "./pages/AdminAuditLogs";
import AdminSupportTickets from "./pages/AdminSupportTickets";

export default function App() {
  return (
    <AppDataProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />

        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Navigate to="home" replace />} />
          <Route path="home" element={<Home />} />
          <Route path="find-listeners" element={<FindListeners />} />
          <Route path="sessions" element={<MySessions />} />
          <Route path="wallet" element={<Wallet />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="messages" element={<SpeakerMessages />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
          <Route path="help" element={<HelpSupport />} />
        </Route>

        <Route path="/listener" element={<ListenerLayout />}>
          <Route index element={<ListenerDashboard />} />
          <Route path="messages" element={<ListenerMessages />} />
          <Route path="sessions" element={<ListenerSessions />} />
          <Route path="availability" element={<Availability />} />
          <Route path="earnings" element={<Earnings />} />
          <Route path="withdrawals" element={<Withdrawals />} />
          <Route path="ratings" element={<Ratings />} />
          <Route path="profile" element={<ListenerProfile />} />
          <Route path="settings" element={<ListenerSettings />} />
        </Route>

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="listeners" element={<AdminListeners />} />
          <Route path="sessions" element={<AdminSessions />} />
          <Route path="transactions" element={<AdminTransactions />} />
          <Route path="withdrawals" element={<AdminWithdrawals />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="leaderboard" element={<AdminLeaderboard />} />
          <Route path="notifications" element={<AdminNotifications />} />
          <Route path="cms" element={<AdminCms />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="audit-logs" element={<AdminAuditLogs />} />
          <Route path="support-tickets" element={<AdminSupportTickets />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppDataProvider>
  );
}
