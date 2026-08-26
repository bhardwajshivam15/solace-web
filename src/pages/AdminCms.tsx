import { useEffect, useState } from "react";
import { Plus, Trash2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { apiRequest, ApiError } from "../lib/apiClient";

interface CmsPageSummary {
  id: string;
  title: string;
  status: "Published" | "Draft";
  lastEdited: string;
}

interface CmsPageDetail extends CmsPageSummary {
  content: string;
  createdAt: string;
}

const statusStyles: Record<string, string> = {
  Published: "bg-green-50 text-green-600",
  Draft: "bg-amber-50 text-amber-600",
};

export default function AdminCms() {
  const { token } = useAuth();

  const [pages, setPages] = useState<CmsPageSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [editing, setEditing] = useState<CmsPageDetail | { id: null; title: string; content: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const loadPages = () => {
    setLoading(true);
    apiRequest<{ data: CmsPageSummary[] }>("/admin/cms/pages", { token })
      .then((response) => setPages(response.data))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Could not load CMS pages."))
      .finally(() => setLoading(false));
  };

  useEffect(loadPages, [token]);

  const openEdit = async (id: string) => {
    setError(null);
    try {
      const { page } = await apiRequest<{ page: CmsPageDetail }>(`/admin/cms/pages/${id}`, { token });
      setEditing(page);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load that page.");
    }
  };

  const openCreate = () => {
    setError(null);
    setEditing({ id: null, title: "", content: "" });
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    setError(null);
    try {
      if (editing.id) {
        await apiRequest(`/admin/cms/pages/${editing.id}`, {
          method: "PATCH",
          token,
          body: { title: editing.title, content: editing.content },
        });
      } else {
        await apiRequest("/admin/cms/pages", {
          method: "POST",
          token,
          body: { title: editing.title, content: editing.content },
        });
      }
      setEditing(null);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
      loadPages();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save this page.");
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (page: CmsPageSummary) => {
    setError(null);
    const nextStatus = page.status === "Published" ? "Draft" : "Published";
    try {
      await apiRequest(`/admin/cms/pages/${page.id}/status`, {
        method: "PATCH",
        token,
        body: { status: nextStatus },
      });
      setPages((prev) => prev.map((p) => (p.id === page.id ? { ...p, status: nextStatus } : p)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update this page's status.");
    }
  };

  const handleDelete = async (id: string) => {
    setError(null);
    try {
      await apiRequest(`/admin/cms/pages/${id}`, { method: "DELETE", token });
      setPages((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not delete this page.");
    }
  };

  if (editing) {
    return (
      <div className="mx-auto max-w-2xl p-8">
        <h1 className="text-xl font-bold text-ink-900">
          {editing.id ? "Edit Page" : "New Page"}
        </h1>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-600">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="mt-5 space-y-4 rounded-2xl border border-gray-100 bg-white p-6">
          <div>
            <label className="text-xs font-medium text-gray-500">Title</label>
            <input
              value={editing.title}
              onChange={(event) => setEditing({ ...editing, title: event.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-ink-900"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Content</label>
            <textarea
              value={editing.content}
              onChange={(event) => setEditing({ ...editing, content: event.target.value })}
              rows={12}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-ink-900"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving || !editing.title.trim()}
              className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={() => setEditing(null)}
              className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-semibold text-ink-900 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink-900">CMS Pages</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          New Page
        </button>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-600">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      {saved && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2.5 text-sm text-green-700">
          <CheckCircle2 className="h-4 w-4" />
          Page saved.
        </div>
      )}

      <div className="mt-6 divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white">
        {loading && <p className="px-5 py-6 text-center text-sm text-gray-400">Loading...</p>}

        {!loading &&
          pages.map((page) => (
            <div key={page.id} className="flex items-center gap-3 px-5 py-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-ink-900">{page.title}</p>
                <p className="text-xs text-gray-400">
                  Last edited {new Date(page.lastEdited).toLocaleString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyles[page.status]}`}>
                {page.status}
              </span>
              <button
                onClick={() => openEdit(page.id)}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-ink-900 hover:bg-gray-50"
              >
                Edit
              </button>
              <button
                onClick={() => togglePublish(page)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                  page.status === "Published"
                    ? "border-red-200 text-red-500 hover:bg-red-50"
                    : "border-green-200 text-green-600 hover:bg-green-50"
                }`}
              >
                {page.status === "Published" ? "Unpublish" : "Publish"}
              </button>
              <button
                onClick={() => handleDelete(page.id)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 hover:bg-red-50 hover:text-red-500"
                title="Delete page"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}

        {!loading && pages.length === 0 && (
          <p className="px-5 py-6 text-center text-sm text-gray-400">No CMS pages yet.</p>
        )}
      </div>
    </div>
  );
}
