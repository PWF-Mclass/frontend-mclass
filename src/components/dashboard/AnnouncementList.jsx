import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listAnnouncements } from "../../services/announcementService";

function mapFromBackend(item) {
  const isUrgent = item.priority === "urgent" || item.priority === "important";
  const isHoliday = item.category === "holiday";
  return {
    id: item.id,
    tag: isHoliday
      ? "LIBUR"
      : isUrgent
      ? "PENTING"
      : (item.category || "INFO").toUpperCase(),
    tagColor: isHoliday
      ? "bg-red-500"
      : isUrgent
      ? "bg-emerald-600"
      : "bg-blue-500",
    title: item.title,
    meta: `${String(item.publish_date).slice(0, 10)} • Target: ${(
      item.target_audience || "semua"
    ).toUpperCase()}`,
    desc: item.description,
  };
}

const DASHBOARD_ANNOUNCEMENTS_PER_PAGE = 6;

export default function AnnouncementList() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setCurrentPage(1);
    listAnnouncements({
      category: selectedCategory || undefined,
    })
      .then((data) => {
        if (!isMounted) return;
        if (Array.isArray(data)) {
          setItems(data.map(mapFromBackend));
        } else {
          setItems([]);
        }
      })
      .catch(() => {
        if (isMounted) setItems([]);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedCategory]);

  const totalPages = Math.max(
    1,
    Math.ceil(items.length / DASHBOARD_ANNOUNCEMENTS_PER_PAGE)
  );
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * DASHBOARD_ANNOUNCEMENTS_PER_PAGE;
  const paginatedItems = items.slice(
    startIndex,
    startIndex + DASHBOARD_ANNOUNCEMENTS_PER_PAGE
  );

  return (
    <div className="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-5">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-base font-bold text-gray-900">
            Pengumuman Kelas & Madrasah
          </h3>
          <p className="mt-0.5 text-xs text-gray-500">
            Informasi terbaru seputar kegiatan KBM & dispensasi siswa.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 focus:outline-none"
          >
            <option value="">Semua Kategori</option>
            <option value="important">Penting</option>
            <option value="academic">Akademik</option>
            <option value="activity">Kegiatan</option>
            <option value="holiday">Libur</option>
            <option value="info">Info</option>
          </select>

          <Link
            to="/buat-pengumuman"
            className="flex items-center gap-1 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5v14" />
            </svg>
            Tambah
          </Link>
        </div>
      </div>

      {/* List */}
      <div className="mt-4 flex-1 divide-y divide-gray-100">
        {isLoading ? (
          <p className="py-4 text-center text-xs text-gray-400">
            Memuat pengumuman...
          </p>
        ) : paginatedItems.length === 0 ? (
          <p className="py-4 text-center text-xs text-gray-400">
            Tidak ada pengumuman pada kategori ini.
          </p>
        ) : (
          paginatedItems.map((item) => (
            <div key={item.id} className="py-4 first:pt-0 last:pb-0">
              <div className="flex items-center gap-2">
                <span className={`rounded px-2 py-0.5 text-[9px] font-bold text-white ${item.tagColor}`}>
                  {item.tag}
                </span>
                <span className="text-[10px] font-medium text-gray-500">
                  {item.meta}
                </span>
              </div>
              <h4 className="mt-2 text-sm font-bold text-gray-900">
                {item.title}
              </h4>
              <p className="mt-1 text-xs leading-relaxed text-gray-500">
                {item.desc}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {!isLoading && items.length > 0 && (
        <div className="relative mt-auto flex flex-col items-center justify-center gap-2 border-t border-gray-100 pt-4 text-[10px] text-gray-500 sm:flex-row">
          <span className="sm:absolute sm:left-0">
            Menampilkan{" "}
            <strong className="text-gray-700">
              {`${startIndex + 1}–${Math.min(
                startIndex + DASHBOARD_ANNOUNCEMENTS_PER_PAGE,
                items.length
              )}`}
            </strong>{" "}
            dari <strong className="text-gray-700">{items.length}</strong>
          </span>

          <div className="flex items-center justify-center gap-1">
            <button
              type="button"
              disabled={safeCurrentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="flex h-7 items-center gap-1 rounded-md border border-gray-200 bg-white px-2 text-[11px] font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ‹ Sebelumnya
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                type="button"
                onClick={() => setCurrentPage(pageNum)}
                className={`flex h-7 min-w-7 items-center justify-center rounded-md border px-2 text-[11px] font-bold transition ${
                  pageNum === safeCurrentPage
                    ? "border-emerald-700 bg-emerald-700 text-white"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {pageNum}
              </button>
            ))}

            <button
              type="button"
              disabled={safeCurrentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="flex h-7 items-center gap-1 rounded-md border border-gray-200 bg-white px-2 text-[11px] font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Berikutnya ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
