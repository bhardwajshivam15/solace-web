import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { apiRequest, ApiError } from "../lib/apiClient";

type Role = "speaker" | "listener" | "admin";

interface PlatformUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  joinedDate: string;
}

const roleStyles: Record<Role, string> = {
  speaker: "bg-brand-50 text-brand-700",
  listener: "bg-amber-50 text-amber-600",
  admin: "bg-gray-100 text-gray-600",
};

export default function AdminUsers() {
  const { token } = useAuth();
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    apiRequest<{ data: PlatformUser[] }>("/admin/users", { token })
      .then((response) => setUsers(response.data))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Could not load users."))
      .finally(() => setLoading(false));
  }, [token]);

  const toggleStatus = async (user: PlatformUser) => {
    setError(null);
    setUpdatingId(user.id);
    try {
      const { user: updated } = await apiRequest<{ user: PlatformUser }>(`/admin/users/${user.id}/status`, {
        method: "PATCH",
        token,
        body: { active: !user.active },
      });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update this user.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold text-ink-900">Users</h1>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-600">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <p className="text-sm text-gray-500">Total Users</p>
          <p className="mt-2 text-2xl font-bold text-ink-900">{users.length}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <p className="text-sm text-gray-500">Active</p>
          <p className="mt-2 text-2xl font-bold text-ink-900">
            {users.filter((u) => u.active).length}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <p className="text-sm text-gray-500">Suspended</p>
          <p className="mt-2 text-2xl font-bold text-ink-900">
            {users.filter((u) => !u.active).length}
          </p>
        </div>
      </div>

      <div className="mt-6 divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white">
        {loading && <p className="py-10 text-center text-sm text-gray-400">Loading…</p>}

        {!loading && users.length === 0 && (
          <p className="py-10 text-center text-sm text-gray-400">No users yet.</p>
        )}

        {users.map((user) => (
          <div key={user.id} className="flex items-center gap-3 px-5 py-4">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink-900">{user.name}</p>
              <p className="truncate text-xs text-gray-400">{user.email}</p>
            </div>
            <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${roleStyles[user.role]}`}>
              {user.role}
            </span>
            <div className="hidden w-28 shrink-0 sm:block">
              <p className="text-xs text-gray-400">Joined</p>
              <p className="text-sm text-ink-900">
                {new Date(user.joinedDate).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                user.active ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"
              }`}
            >
              {user.active ? "Active" : "Suspended"}
            </span>
            {user.role !== "admin" && (
              <button
                onClick={() => toggleStatus(user)}
                disabled={updatingId === user.id}
                className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${
                  user.active
                    ? "border-red-200 text-red-500 hover:bg-red-50"
                    : "border-green-200 text-green-600 hover:bg-green-50"
                }`}
              >
                {updatingId === user.id ? "…" : user.active ? "Suspend" : "Reinstate"}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
