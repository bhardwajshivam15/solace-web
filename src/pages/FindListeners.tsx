import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, Headphones } from "lucide-react";
import { chatFilters, listeners } from "../data/mockData";
import ListenerCard from "../components/ListenerCard";
import ChatPanel from "../components/ChatPanel";

const sortOptions = ["Recommended", "Price: Low to High", "Rating: High to Low"] as const;
type SortOption = (typeof sortOptions)[number];

export default function FindListeners() {
  const [searchParams] = useSearchParams();
  const filterFromUrl = searchParams.get("filter");
  const listenerFromUrl = searchParams.get("listener");

  const [activeFilter, setActiveFilter] = useState(
    filterFromUrl && chatFilters.includes(filterFromUrl) ? filterFromUrl : "All",
  );
  const [selectedId, setSelectedId] = useState<string | null>(
    listenerFromUrl && listeners.some((listener) => listener.id === listenerFromUrl)
      ? listenerFromUrl
      : null,
  );
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("Recommended");
  const [showSortMenu, setShowSortMenu] = useState(false);

  const selectedListener = listeners.find((l) => l.id === selectedId) ?? null;

  const filtered = listeners
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
          {chatFilters.map((filter) => (
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

        <div className="mt-5 grid flex-1 grid-cols-2 gap-3 overflow-y-auto pb-2">
          {filtered.map((listener) => (
            <ListenerCard
              key={listener.id}
              listener={listener}
              active={listener.id === selectedId}
              onSelect={() => setSelectedId(listener.id)}
            />
          ))}
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
