import Link from "next/link";
import { Bookmark } from "lucide-react";
import { NoticeItem } from "@/types/notices";

export function NoticeCard({ item }: { item: NoticeItem }) {
  const unread = !item.read;

  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5">
            {item.category_ai ?? "#기타"}
          </span>
          {item.source_college && (
            <span className="truncate">{item.source_college}</span>
          )}
        </div>
        {item.posted_at && (
          <time className="shrink-0">
            {new Date(item.posted_at).toLocaleDateString()}
          </time>
        )}
      </div>

      <Link
        href={`/notices/${item.id}`}
        className={`mt-2 block text-gray-900 line-clamp-2 ${
          unread ? "font-semibold" : "font-medium"
        }`}
      >
        {item.title}
      </Link>

      {item.summary_raw && (
        <p className="mt-1 text-sm text-gray-600 line-clamp-2">
          {item.summary_raw}
        </p>
      )}

      <div className="mt-3 flex items-center justify-end">
        <button
          aria-label="북마크"
          className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50"
        >
          <Bookmark size={16} />
        </button>
      </div>
    </article>
  );
}
