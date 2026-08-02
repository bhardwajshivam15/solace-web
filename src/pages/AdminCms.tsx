import { useState } from "react";
import { cmsPages as seedCmsPages } from "../data/mockData";

const statusStyles: Record<string, string> = {
  Published: "bg-green-50 text-green-600",
  Draft: "bg-amber-50 text-amber-600",
};

export default function AdminCms() {
  const [pages, setPages] = useState(seedCmsPages);

  const togglePublish = (id: string) => {
    setPages((prev) =>
      prev.map((page) =>
        page.id === id
          ? { ...page, status: page.status === "Published" ? "Draft" : "Published" }
          : page,
      ),
    );
  };

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold text-ink-900">CMS Pages</h1>

      <div className="mt-6 divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white">
        {pages.map((page) => (
          <div key={page.id} className="flex items-center gap-3 px-5 py-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-ink-900">{page.title}</p>
              <p className="text-xs text-gray-400">Last edited {page.lastEdited}</p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyles[page.status]}`}
            >
              {page.status}
            </span>
            <button
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-ink-900 hover:bg-gray-50"
            >
              Edit
            </button>
            <button
              onClick={() => togglePublish(page.id)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                page.status === "Published"
                  ? "border-red-200 text-red-500 hover:bg-red-50"
                  : "border-green-200 text-green-600 hover:bg-green-50"
              }`}
            >
              {page.status === "Published" ? "Unpublish" : "Publish"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
