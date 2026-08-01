import { Navigate, Route, Routes } from "react-router-dom";
import { AppDataProvider } from "./context/AppDataContext";
import AppLayout from "./layouts/AppLayout";
import AdminLayout from "./layouts/AdminLayout";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import FindListeners from "./pages/FindListeners";
import Wallet from "./pages/Wallet";
import Transactions from "./pages/Transactions";
import MySessions from "./pages/MySessions";
import AdminDashboard from "./pages/AdminDashboard";
import ComingSoon from "./pages/ComingSoon";

export default function App() {
  return (
    <AppDataProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />

        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Navigate to="find-listeners" replace />} />
          <Route path="home" element={<ComingSoon title="Home" />} />
          <Route path="find-listeners" element={<FindListeners />} />
          <Route path="sessions" element={<MySessions />} />
          <Route path="wallet" element={<Wallet />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="messages" element={<ComingSoon title="Messages" />} />
          <Route path="notifications" element={<ComingSoon title="Notifications" />} />
          <Route path="settings" element={<ComingSoon title="Settings" />} />
          <Route path="help" element={<ComingSoon title="Help & Support" />} />
        </Route>

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<ComingSoon title="Users" />} />
          <Route path="listeners" element={<ComingSoon title="Listeners" />} />
          <Route path="sessions" element={<ComingSoon title="Sessions" />} />
          <Route path="transactions" element={<ComingSoon title="Transactions" />} />
          <Route path="withdrawals" element={<ComingSoon title="Withdrawals" />} />
          <Route path="reports" element={<ComingSoon title="Reports" />} />
          <Route path="leaderboard" element={<ComingSoon title="Leaderboard" />} />
          <Route path="settings" element={<ComingSoon title="Settings" />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppDataProvider>
  );
}
