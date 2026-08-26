import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Heart, ArrowLeft } from "lucide-react";
import { apiRequest } from "../lib/apiClient";

interface PublicCmsPage {
  title: string;
  slug: string;
  content: string;
}

type LoadState = "loading" | "found" | "not-found";

export default function LegalPage() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<PublicCmsPage | null>(null);
  const [state, setState] = useState<LoadState>("loading");

  useEffect(() => {
    if (!slug) return;
    setState("loading");
    setPage(null);
    apiRequest<{ page: PublicCmsPage }>(`/cms/pages/${slug}`)
      .then((data) => {
        setPage(data.page);
        setState("found");
      })
      .catch(() => setState("not-found"));
  }, [slug]);

  return (
    <div className="min-h-screen bg-white">
      <header className="flex items-center justify-between px-8 py-5 lg:px-16">
        <Link to="/" className="flex items-center gap-2">
          <Heart className="h-6 w-6 fill-brand-600 text-brand-600" />
          <span className="text-lg font-bold text-ink-900">Solace</span>
        </Link>
        <Link
          to="/"
          className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-ink-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-8 py-12 lg:px-0">
        {state === "loading" && <p className="text-gray-500">Loading…</p>}

        {state === "not-found" && (
          <div className="text-center">
            <h1 className="text-2xl font-bold text-ink-900">Page not found</h1>
            <p className="mt-2 text-gray-500">
              This page doesn't exist or isn't published yet.
            </p>
            <Link
              to="/"
              className="mt-6 inline-block rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Return home
            </Link>
          </div>
        )}

        {state === "found" && page && (
          <article>
            <h1 className="text-3xl font-bold text-ink-900">{page.title}</h1>
            <p className="mt-6 whitespace-pre-line text-gray-600">{page.content}</p>
          </article>
        )}
      </main>
    </div>
  );
}
