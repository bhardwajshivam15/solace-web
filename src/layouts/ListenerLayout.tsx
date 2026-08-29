import { Outlet } from "react-router-dom";
import ListenerSidebar from "../components/ListenerSidebar";
import IncomingSessionRequestModal from "../components/IncomingSessionRequestModal";
import HeldSessionRequestsBar from "../components/HeldSessionRequestsBar";
import ListenerGuidelinesGate from "../components/ListenerGuidelinesGate";

export default function ListenerLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <ListenerSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <HeldSessionRequestsBar />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      <IncomingSessionRequestModal />
      <ListenerGuidelinesGate />
    </div>
  );
}
