import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import AcceptedSessionBanner from "../components/AcceptedSessionBanner";

export default function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AcceptedSessionBanner />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
