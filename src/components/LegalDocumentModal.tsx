import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { apiRequest } from "../lib/apiClient";

interface PublicCmsPage {
  title: string;
  slug: string;
  content: string;
}

type LoadState = "loading" | "found" | "not-found";

// Shows a full CMS legal document inline, without navigating away from
// whatever form is currently open — LegalPage.tsx's /#/legal/:slug route
// would unmount an in-progress SignUp.tsx form, which is exactly what this
// avoids.
export default function LegalDocumentModal({
  slug,
  fallbackTitle,
  onClose,
}: {
  slug: string;
  fallbackTitle: string;
  onClose: () => void;
}) {
  const [page, setPage] = useState<PublicCmsPage | null>(null);
  const [state, setState] = useState<LoadState>("loading");

  useEffect(() => {
    apiRequest<{ page: PublicCmsPage }>(`/cms/pages/${slug}`)
      .then((data) => {
        setPage(data.page);
        setState("found");
      })
      .catch(() => setState("not-found"));
  }, [slug]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex w-full max-w-2xl flex-col rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-bold text-ink-900">{page?.title ?? fallbackTitle}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[65vh] overflow-y-auto px-6 py-5">
          {state === "loading" && <p className="text-sm text-gray-500">Loading…</p>}
          {state === "not-found" && (
            <p className="text-sm text-gray-500">This document isn't available right now. Please try again later.</p>
          )}
          {state === "found" && page && (
            <p className="whitespace-pre-line text-sm text-gray-600">{page.content}</p>
          )}
        </div>

        <div className="flex justify-end border-t border-gray-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
