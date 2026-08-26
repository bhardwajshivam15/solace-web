import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, Headphones, AlertCircle } from "lucide-react";
import { categories } from "../data/mockData";
import { useAuth } from "../context/AuthContext";
import { useAppData } from "../context/AppDataContext";
import { apiRequest, resolveAssetUrl, ApiError } from "../lib/apiClient";
import ListenerCard from "../components/ListenerCard";
import ChatPanel from "../components/ChatPanel";
import type { Listener } from "../types";

const filters = ["All", ...categories.map((category) => category.label)];
const sortOptions = ["Recommended", "Price: Low to High", "Rating: High to Low"] as const;
type SortOption = (typeof sortOptions)[number];

interface PublicListener {
  id: string;
  name: string;
  avatar: string | null;
  bio: string | null;
  topics: string[];
  languages: string[];
  experienceYears: number | null;
  verified: boolean;
  online: boolean;
  pricePerMinute: number;
  listenerEarningPerMinute: number;
  platformFeePerMinute: number;
  rating: number;
  reviewCount: number;
}

// Pricing is each listener's own choice; the platform fee is deducted
// server-side. RatingBadge shows "New" itself when reviewCount is 0.
function toListener(listener: PublicListener): Listener {
  return {
    id: listener.id,
    name: listener.name,
    avatar: resolveAssetUrl(listener.avatar) ?? initialsAvatar(listener.name),
    verified: listener.verified,
    rating: listener.rating,
    reviewCount: listener.reviewCount,
    tags: listener.topics,
    pricePerMinute: listener.pricePerMinute,
    online: listener.online,
  };
}

function initialsAvatar(name: string): string {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150"><rect width="150" height="150" fill="#ede9fe"/><text x="50%" y="50%" dy=".35em" text-anchor="middle" font-family="sans-serif" font-size="60" fill="#6d28d9">${initial}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export default function FindListeners() {
  const { token } = useAuth();
  const { listenerPresence } = useAppData();
  const [searchParams] = useSearchParams();
  const filterFromUrl = searchParams.get("filter");
  const listenerFromUrl = searchParams.get("listener");

  const [listeners, setListeners] = useState<Listener[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeFilter, setActiveFilter] = useState(
    filterFromUrl && filters.includes(filterFromUrl) ? filterFromUrl : "All",
  );
  const [selectedId, setSelectedId] = useState<string | null>(listenerFromUrl);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("Recommended");
  const [showSortMenu, setShowSortMenu] = useState(false);

  useEffect(() => {
    setLoading(true);
    apiRequest<{ data: PublicListener[] }>("/listeners", { token })
      .then((response) => setListeners(response.data.map(toListener)))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Could not load listeners."))
      .finally(() => setLoading(false));
  }, [token]);

  // Overlay live online/offline pushes on top of whatever was true at fetch
  // time, so a listener toggling status shows up here without a reload.
  const listenersWithPresence = listeners.map((listener) => ({
    ...listener,
    online: listenerPresence[listener.id] ?? listener.online,
  }));

  const selectedListener = listenersWithPresence.find((l) => l.id === selectedId) ?? null;

  const filtered = listenersWithPresence
    .filter((listener) => {
      const matchesFilter =
        activeFilter === "All" || listener.tags.includes(activeFilter);
      const matchesQuery = listener.name
        .toLowerCase()
        .includes(query.toLowerCase());
      return matchesFilter && matchesQuery;
    })
    .sort((a, b) => {
      if (sortBy === "Price: Low to High") return a.pricePerMinute - b.pricePerMinute;
      if (sortBy === "Rating: High to Low") return b.rating - a.rating;
      return 0;
    });

  return (
    <div className="flex h-full">
      <div className="flex w-full max-w-md shrink-0 flex-col border-r border-gray-100 p-6">
        <h1 className="text-xl font-bold text-ink-900">Find a Listener</h1>
        <p className="mt-1 text-sm text-gray-500">
          You're not alone. Talk to someone who cares.
        </p>

        <div className="mt-4 flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, topic or language"
              className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
            />
          </div>
          <div className="relative">
            <button
              onClick={() => setShowSortMenu((prev) => !prev)}
              className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-500"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </button>
            {showSortMenu && (
              <div className="absolute right-0 z-10 mt-1 w-48 rounded-lg border border-gray-100 bg-white p-1 shadow-soft">
                <p className="px-2 py-1 text-[11px] font-medium uppercase text-gray-400">
                  Sort by
                </p>
                {sortOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setSortBy(option);
                      setShowSortMenu(false);
                    }}
                    className={`block w-full rounded-md px-2 py-1.5 text-left text-sm ${
                      option === sortBy
                        ? "bg-brand-50 text-brand-700"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                activeFilter === filter
                  ? "bg-brand-600 text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-600">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="mt-5 grid flex-1 grid-cols-2 gap-3 overflow-y-auto pb-2">
          {loading && (
            <p className="col-span-2 py-10 text-center text-sm text-gray-400">
              Loading listeners…
            </p>
          )}

          {!loading &&
            filtered.map((listener) => (
              <ListenerCard
                key={listener.id}
                listener={listener}
                active={listener.id === selectedId}
                onSelect={() => setSelectedId(listener.id)}
              />
            ))}

          {!loading && filtered.length === 0 && (
            <p className="col-span-2 py-10 text-center text-sm text-gray-400">
              No listeners match your search yet.
            </p>
          )}
        </div>
      </div>

      <div className="flex-1">
        {selectedListener ? (
          <ChatPanel
            listener={selectedListener}
            onBack={() => setSelectedId(null)}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50">
              <Headphones className="h-8 w-8 text-brand-600" />
            </div>
            <h2 className="text-lg font-semibold text-ink-900">
              Pick a listener to start talking
            </h2>
            <p className="max-w-xs text-sm text-gray-500">
              Choose anyone from the list — every conversation here is
              anonymous and private.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
