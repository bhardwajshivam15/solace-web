import { Outlet } from "react-router-dom";
import ListenerSidebar from "../components/ListenerSidebar";
import IncomingSessionRequestModal from "../components/IncomingSessionRequestModal";

export default function ListenerLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <ListenerSidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
      <IncomingSessionRequestModal />
    </div>
  );
}
