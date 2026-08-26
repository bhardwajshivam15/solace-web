import { Star } from "lucide-react";

export default function RatingBadge({
  rating,
  reviewCount,
}: {
  rating: number;
  reviewCount?: number;
}) {
  if (!reviewCount) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-400">
        <Star className="h-3.5 w-3.5 text-gray-300" />
        New
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-600">
      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
      {rating}
      <span className="text-gray-400">({reviewCount}+)</span>
    </span>
  );
}
