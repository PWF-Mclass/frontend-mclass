import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "./dashboard/DashboardLayout";
import Toast from "./Toast";
import {
  deleteAnnouncement,
  getCalendarSummary,
  listAnnouncements,
  updateAnnouncement,
} from "../services/announcementService";

const INDONESIAN_MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const statIcons = {
  calendar: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  ),
  star: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  flag: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7" />
    </svg>
  ),
  activity: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
};

const CATEGORY_LABELS = {
  academic: "Akademik",
  activity: "Kegiatan",
  holiday: "Libur / Cuti",
  important: "Penting",
  achievement: "Prestasi",
  info: "Info",
};

const AUDIENCE_LABELS = {
  all: "Semua",
  siswa: "Siswa",
  guru: "Guru",
  wali: "Wali Murid",
};

const PRIORITY_BADGES = {
  urgent: "bg-red-100 text-red-700",
  important: "bg-amber-100 text-amber-700",
  normal: "bg-emerald-100 text-emerald-700",
  low: "bg-gray-100 text-gray-600",
};

function StatCard({ item }) {
  return (
    <div className={`rounded-xl border-l-4 border border-gray-200 bg-white p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${item.borderColor}`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <span className={`flex h-4 w-4 items-center justify-center rounded ${item.bgIcon}`}>
              <span className="scale-[0.6]">{statIcons[item.icon]}</span>
            </span>
            <p className="text-[10px] font-bold tracking-wide text-gray-600">
              {item.label}
            </p>
          </div>
          <p className="mt-1 text-[10px] font-bold tracking-wide text-gray-500">
            {item.sublabel}
          </p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-gray-900">
              {item.value}
            </span>
          </div>
          <p className="mt-1 text-[10px] text-gray-500">{item.desc}</p>
        </div>
      </div>
    </div>
  );
}

function buildMonthGrid(year, monthIndex0) {
  const firstDay = new Date(year, monthIndex0, 1);
  // JS getDay(): 0=Sun..6=Sat -> Monday=0..Sunday=6
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthIndex0 + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startOffset; i++) {
    cells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(d);
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }
  return cells;
}

const eventTypeSymbols = {
  red: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="currentColor">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7" />
    </svg>
  ),
  amber: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  emerald: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="m3 11 18-5v12L3 14v-3z" />
      <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
    </svg>
  ),
};

function resolveAnnouncementMarkerColor(item) {
  if (item.category === "holiday" || item.type === "libur") {
    return "red";
  }
  if (
    item.category === "important" ||
    item.priority === "important" ||
    item.priority === "urgent" ||
    item.priority_code === "important" ||
    item.priority_code === "urgent"
  ) {
    return "amber";
  }
  return "emerald";
}

const ANNOUNCEMENTS_PER_PAGE = 6;

export default function KalenderAgenda() {
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [selectedMonthIdx, setSelectedMonthIdx] = useState(() => new Date().getMonth());
  const [viewMode, setViewMode] = useState("Bulanan");
  const [selectedDay, setSelectedDay] = useState(null);

  const [calendarSummary, setCalendarSummary] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [categoryFilter, setCategoryFilter] = useState("");
  const [audienceFilter, setAudienceFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingItem, setEditingItem] = useState(null);
  const [editError, setEditError] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [toast, setToast] = useState({
    open: false,
    title: "",
    message: "",
    type: "success",
  });

  const monthString = `${selectedYear}-${String(selectedMonthIdx + 1).padStart(2, "0")}`;
  const currentMonthLabel = `${INDONESIAN_MONTHS[selectedMonthIdx]} ${selectedYear}`;

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [summaryData, announcementItems] = await Promise.all([
        getCalendarSummary(monthString).catch(() => null),
        listAnnouncements({
          category: categoryFilter || undefined,
          audience: audienceFilter || undefined,
        }).catch(() => []),
      ]);

      if (summaryData) {
        setCalendarSummary(summaryData);
      }
      if (Array.isArray(announcementItems)) {
        setAnnouncements(announcementItems);
      }
    } finally {
      setIsLoading(false);
    }
  }, [monthString, categoryFilter, audienceFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter, audienceFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(announcements.length / ANNOUNCEMENTS_PER_PAGE)
  );
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * ANNOUNCEMENTS_PER_PAGE;
  const paginatedAnnouncements = announcements.slice(
    startIndex,
    startIndex + ANNOUNCEMENTS_PER_PAGE
  );

  const handlePrevMonth = () => {
    setSelectedDay(null);
    if (selectedMonthIdx === 0) {
      setSelectedYear((y) => y - 1);
      setSelectedMonthIdx(11);
    } else {
      setSelectedMonthIdx((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    setSelectedDay(null);
    if (selectedMonthIdx === 11) {
      setSelectedYear((y) => y + 1);
      setSelectedMonthIdx(0);
    } else {
      setSelectedMonthIdx((m) => m + 1);
    }
  };

  const handleDeleteAnnouncement = async (id, title) => {
    try {
      await deleteAnnouncement(id);
      setToast({
        open: true,
        title: "Pengumuman Dihapus",
        message: `"${title}" telah dihapus dari daftar pengumuman.`,
        type: "success",
      });
      await loadData();
    } catch (error) {
      setToast({
        open: true,
        title: "Gagal Menghapus Pengumuman",
        message: error.message || "Terjadi kesalahan saat menghapus pengumuman.",
        type: "error",
      });
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingItem) return;

    const trimmedTitle = String(editingItem.title || "").trim();
    const trimmedDesc = String(editingItem.description || "").trim();
    if (!trimmedTitle) {
      setEditError("Judul pengumuman wajib diisi.");
      return;
    }
    if (!trimmedDesc) {
      setEditError("Deskripsi pengumuman wajib diisi.");
      return;
    }

    setEditError("");
    setIsSavingEdit(true);
    try {
      await updateAnnouncement(editingItem.id, {
        title: trimmedTitle,
        category: editingItem.category,
        publish_date: String(editingItem.publish_date).slice(0, 10),
        target_audience: editingItem.target_audience,
        priority: editingItem.priority,
        description: trimmedDesc,
        status: editingItem.status || "published",
      });
      setEditingItem(null);
      setToast({
        open: true,
        title: "Pengumuman Diperbarui",
        message: "Perubahan pengumuman berhasil disimpan.",
        type: "success",
      });
      await loadData();
    } catch (error) {
      setToast({
        open: true,
        title: "Gagal Memperbarui Pengumuman",
        message: error.message || "Terjadi kesalahan saat menyimpan perubahan.",
        type: "error",
      });
    } finally {
      setIsSavingEdit(false);
    }
  };

  const statsData = useMemo(() => {
    const totalAgenda = calendarSummary?.total_agenda ?? 0;
    const pentingTotal = calendarSummary?.agenda_penting?.total ?? 0;
    const pentingMingguIni = calendarSummary?.agenda_penting?.this_week ?? 0;
    const liburNasional = calendarSummary?.libur_nasional ?? 0;
    const sedangBerlangsung = calendarSummary?.sedang_berlangsung ?? 0;

    return [
      {
        label: "TOTAL",
        sublabel: "AGENDA",
        value: String(totalAgenda),
        desc: "Bulan ini",
        borderColor: "border-emerald-500",
        bgIcon: "bg-emerald-50 text-emerald-600",
        icon: "calendar",
      },
      {
        label: "AGENDA",
        sublabel: "PENTING",
        value: String(pentingTotal),
        desc: `${pentingMingguIni} dalam minggu ini`,
        borderColor: "border-amber-500",
        bgIcon: "bg-amber-50 text-amber-600",
        icon: "star",
      },
      {
        label: "LIBUR",
        sublabel: "NASIONAL",
        value: String(liburNasional),
        desc: "Bulan ini",
        borderColor: "border-red-500",
        bgIcon: "bg-red-50 text-red-500",
        icon: "flag",
      },
      {
        label: "SEDANG",
        sublabel: "BERLANGSUNG",
        value: String(sedangBerlangsung),
        desc: "Kegiatan aktif",
        borderColor: "border-blue-500",
        bgIcon: "bg-blue-50 text-blue-600",
        icon: "activity",
      },
    ];
  }, [calendarSummary]);

  const daysHeader = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
  const calendarGrid = useMemo(
    () => buildMonthGrid(selectedYear, selectedMonthIdx),
    [selectedYear, selectedMonthIdx]
  );

  const eventDays = useMemo(() => {
    const map = {};

    if (Array.isArray(calendarSummary?.days) && calendarSummary.days.length > 0) {
      calendarSummary.days.forEach((d) => {
        const dayEvents = Array.isArray(d.events) ? d.events : [];
        const hasEvent = Boolean(d.has_event) || dayEvents.length > 0 || Boolean(d.color);
        if (hasEvent && d.color) {
          map[d.day] = {
            type: d.color,
            label: d.label || dayEvents[0]?.title || "Pengumuman",
            count: dayEvents.length || 1,
            events: dayEvents,
            isToday: d.is_today,
          };
        }
      });
    }

    // Fallback/supplement dari daftar announcements bulan yang dipilih
    if (Array.isArray(announcements) && announcements.length > 0) {
      const daysInCurrentMonth = new Date(selectedYear, selectedMonthIdx + 1, 0).getDate();
      for (let dayNum = 1; dayNum <= daysInCurrentMonth; dayNum++) {
        if (map[dayNum]) continue;
        const dateStr = `${monthString}-${String(dayNum).padStart(2, "0")}`;
        const matching = announcements.filter((item) => {
          const start = String(item.publish_date || item.event_date || "").slice(0, 10);
          const end = String(item.end_date || start).slice(0, 10);
          return start && dateStr >= start && dateStr <= end;
        });

        if (matching.length > 0) {
          const holidayEv = matching.find(
            (ev) => ev.category === "holiday" || ev.type === "libur"
          );
          const importantEv = matching.find(
            (ev) =>
              ev.category === "important" ||
              ev.priority === "important" ||
              ev.priority === "urgent" ||
              ev.priority_code === "important" ||
              ev.priority_code === "urgent"
          );
          const primaryEv = holidayEv ?? importantEv ?? matching[0];
          const color = resolveAnnouncementMarkerColor(primaryEv);

          map[dayNum] = {
            type: color,
            label: primaryEv.title || "Pengumuman",
            count: matching.length,
            events: matching,
            isToday: false,
          };
        }
      }
    }

    return map;
  }, [calendarSummary, announcements, selectedYear, selectedMonthIdx, monthString]);

  const now = new Date();
  const todayFromBackend = calendarSummary?.today
    ? String(calendarSummary.today).slice(0, 10)
    : null;
  const todayDayNumber = useMemo(() => {
    if (todayFromBackend && todayFromBackend.startsWith(monthString)) {
      const parsed = Number(todayFromBackend.slice(8, 10));
      if (!Number.isNaN(parsed)) return parsed;
    }
    const isCurrentRealMonth =
      now.getFullYear() === selectedYear && now.getMonth() === selectedMonthIdx;
    return isCurrentRealMonth ? now.getDate() : null;
  }, [todayFromBackend, monthString, selectedYear, selectedMonthIdx]);

  return (
    <DashboardLayout>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {/* ============ HEADER ============ */}
          <div className="animate-item delay-100 mb-5 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-extrabold text-gray-900">
                Kalender & Manajemen Pengumuman Madrasah
              </h2>
              <p className="mt-1 text-xs text-gray-500">
                Kelola agenda kegiatan madrasah dan pengumuman yang tersinkronisasi ke seluruh pengguna.
              </p>
            </div>

            <Link
              to="/buat-pengumuman"
              className="flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-800 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
              Buat Pengumuman
            </Link>
          </div>

          {/* ============ 4 STAT CARDS ============ */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {statsData.map((s, i) => (
              <div key={i} className="animate-item delay-200">
                <StatCard item={s} />
              </div>
            ))}
          </div>

          {/* ============ KALENDER FULL-WIDTH ============ */}
          <div className="animate-item delay-300 mt-6 flex flex-col rounded-xl border border-gray-200 bg-white p-5">
            {/* Header Kalender */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="rounded-md border border-gray-200 p-1 text-gray-600 hover:bg-gray-50"
                  aria-label="Bulan sebelumnya"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                </button>
                <h3 className="text-base font-bold text-gray-900">
                  {currentMonthLabel}
                </h3>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="rounded-md border border-gray-200 p-1 text-gray-600 hover:bg-gray-50"
                  aria-label="Bulan berikutnya"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </button>
                <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect width="18" height="18" x="3" y="4" rx="2" />
                    <path d="M16 2v4M8 2v4M3 10h18" />
                  </svg>
                  {viewMode}
                </span>
              </div>
            </div>

            {/* Day Headers */}
            <div className="mt-4 grid grid-cols-7 gap-1 text-center">
              {daysHeader.map((d) => (
                <div key={d} className="py-2 text-[10px] font-bold text-gray-400">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="flex flex-1 flex-col justify-center">
              <div className="grid grid-cols-7 gap-1">
                {calendarGrid.map((day, i) => {
                  if (day === null) return <div key={i} className="min-h-[56px]"></div>;

                  const isToday = day === todayDayNumber;
                  const event = eventDays[day];
                  const isWeekend = i % 7 >= 5;
                  const isSelected = selectedDay === day;

                  const markerTheme =
                    event?.type === "red"
                      ? {
                          cell: "border-red-300 bg-red-50/40 hover:bg-red-50",
                          badge: "bg-red-100 text-red-600",
                          bar: "bg-red-500",
                          text: "text-red-700",
                        }
                      : event?.type === "amber"
                      ? {
                          cell: "border-amber-300 bg-amber-50/40 hover:bg-amber-50",
                          badge: "bg-amber-100 text-amber-700",
                          bar: "bg-amber-500",
                          text: "text-amber-800",
                        }
                      : {
                          cell: "border-emerald-300 bg-emerald-50/30 hover:bg-emerald-50/60",
                          badge: "bg-emerald-100 text-emerald-700",
                          bar: "bg-emerald-500",
                          text: "text-emerald-800",
                        };

                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedDay((prev) => (prev === day ? null : day))}
                      title={event ? `${event.label}${event.count > 1 ? ` (+${event.count - 1} lainnya)` : ""}` : undefined}
                      className={`relative min-h-[56px] rounded-lg border p-1.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm ${
                        isToday
                          ? "border-emerald-600 bg-emerald-50 ring-1 ring-emerald-500/30"
                          : event
                          ? markerTheme.cell
                          : "border-transparent hover:bg-gray-50"
                      } ${isSelected ? "ring-2 ring-emerald-600" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs font-bold ${
                            isToday
                              ? "bg-emerald-700 text-white"
                              : isWeekend
                              ? "text-gray-300"
                              : "text-gray-700"
                          }`}
                        >
                          {day}
                        </span>

                        {event && (
                          <span
                            className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${markerTheme.badge}`}
                          >
                            {eventTypeSymbols[event.type] || eventTypeSymbols.emerald}
                            {event.count > 1 && <span>{event.count}</span>}
                          </span>
                        )}
                      </div>

                      {event && (
                        <div className="mt-1">
                          <span
                            className={`inline-block h-1.5 w-full rounded-full ${markerTheme.bar}`}
                          ></span>
                          <p className={`mt-0.5 truncate text-[8px] font-bold ${markerTheme.text}`}>
                            {event.label}
                          </p>
                        </div>
                      )}
                      {isToday && !event && (
                        <p className="mt-1 text-[8px] font-bold text-emerald-700">
                          HARI INI
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Detail Pengumuman pada Tanggal yang Dipilih */}
            {selectedDay && eventDays[selectedDay] && (
              <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50/40 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-gray-900">
                    Pengumuman pada {selectedDay} {currentMonthLabel}
                  </p>
                  <button
                    type="button"
                    onClick={() => setSelectedDay(null)}
                    className="text-[10px] font-semibold text-gray-500 hover:text-gray-700"
                  >
                    Tutup ✕
                  </button>
                </div>
                <div className="mt-2 space-y-1.5">
                  {eventDays[selectedDay].events.map((ev, idx) => {
                    const color = resolveAnnouncementMarkerColor(ev);
                    return (
                      <div
                        key={ev.id || idx}
                        className="flex items-start gap-2 rounded-md bg-white p-2 text-xs shadow-2xs"
                      >
                        <span
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                            color === "red"
                              ? "bg-red-100 text-red-600"
                              : color === "amber"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {eventTypeSymbols[color]}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-gray-900">{ev.title}</p>
                          {ev.description && (
                            <p className="mt-0.5 text-[11px] text-gray-600">
                              {ev.description}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Legend */}
            <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-gray-100 pt-3">
              <div className="flex items-center gap-1.5 text-[10px] text-gray-600">
                <span className="inline-flex h-4 w-4 items-center justify-center rounded bg-emerald-700 text-[9px] font-bold text-white">
                  {todayDayNumber ?? "•"}
                </span>
                Hari Ini
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-gray-600">
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  {eventTypeSymbols.emerald}
                </span>
                Pengumuman / Agenda Aktif
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-gray-600">
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                  {eventTypeSymbols.amber}
                </span>
                Pengumuman Penting (★)
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-gray-600">
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-100 text-red-600">
                  {eventTypeSymbols.red}
                </span>
                Libur Nasional / Cuti (⚑)
              </div>
            </div>
          </div>

          {/* ============ DAFTAR & MANAJEMEN PENGUMUMAN ============ */}
          <div className="animate-item delay-300 mt-6 flex flex-col rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Daftar Pengumuman & Agenda Madrasah
                </h3>
                <p className="mt-0.5 text-xs text-gray-500">
                  Filter visibilitas per kategori/role, ubah, atau hapus pengumuman.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="">Semua Kategori</option>
                  <option value="important">Penting</option>
                  <option value="academic">Akademik</option>
                  <option value="activity">Kegiatan</option>
                  <option value="holiday">Libur / Cuti</option>
                  <option value="achievement">Prestasi</option>
                  <option value="info">Info</option>
                </select>

                <select
                  value={audienceFilter}
                  onChange={(e) => setAudienceFilter(e.target.value)}
                  className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="">Semua Audiens</option>
                  <option value="all">Semua Warga</option>
                  <option value="siswa">Siswa</option>
                  <option value="guru">Guru</option>
                  <option value="wali">Wali Murid</option>
                </select>
              </div>
            </div>

            <div className="mt-4 flex-1 divide-y divide-gray-100">
              {isLoading ? (
                <p className="py-6 text-center text-xs text-gray-400">
                  Memuat daftar pengumuman...
                </p>
              ) : paginatedAnnouncements.length === 0 ? (
                <p className="py-6 text-center text-xs text-gray-400">
                  Belum ada pengumuman yang sesuai dengan filter.
                </p>
              ) : (
                paginatedAnnouncements.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col justify-between gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`rounded px-2 py-0.5 text-[9px] font-bold uppercase ${
                            PRIORITY_BADGES[item.priority] ||
                            "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {CATEGORY_LABELS[item.category] || item.category}
                        </span>
                        <span className="rounded bg-gray-100 px-2 py-0.5 text-[9px] font-semibold text-gray-600">
                          Target: {AUDIENCE_LABELS[item.target_audience] || item.target_audience}
                        </span>
                        <span className="text-[10px] font-medium text-gray-400">
                          • {String(item.publish_date).slice(0, 10)}
                        </span>
                      </div>
                      <h4 className="mt-1.5 text-sm font-bold text-gray-900">
                        {item.title}
                      </h4>
                      <p className="mt-1 text-xs leading-relaxed text-gray-500">
                        {item.description}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingItem({ ...item })}
                        className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAnnouncement(item.id, item.title)}
                        className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-[10px] font-semibold text-red-600 hover:bg-red-100"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer & Pagination Pengumuman */}
            {!isLoading && announcements.length > 0 && (
              <div className="relative mt-auto flex flex-col items-center justify-center gap-3 border-t border-gray-100 pt-4 text-[10px] text-gray-500 sm:flex-row">
                <span className="sm:absolute sm:left-0">
                  Menampilkan{" "}
                  <strong className="text-gray-700">
                    {`${startIndex + 1}–${Math.min(
                      startIndex + ANNOUNCEMENTS_PER_PAGE,
                      announcements.length
                    )}`}
                  </strong>{" "}
                  dari <strong className="text-gray-700">{announcements.length}</strong> pengumuman
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

          {/* MODAL EDIT PENGUMUMAN */}
          {editingItem && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div
                className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
                onClick={() => {
                  setEditingItem(null);
                  setEditError("");
                }}
              ></div>
              <form
                noValidate
                onSubmit={handleSaveEdit}
                className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl"
              >
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <h3 className="text-base font-bold text-gray-900">
                    Edit Pengumuman
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingItem(null);
                      setEditError("");
                    }}
                    className="rounded p-1 text-gray-400 hover:bg-gray-100"
                  >
                    ✕
                  </button>
                </div>

                {editError && (
                  <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" x2="12" y1="8" y2="12" />
                      <line x1="12" x2="12.01" y1="16" y2="16" />
                    </svg>
                    <span>{editError}</span>
                  </div>
                )}

                <div className="mt-4 space-y-3">
                  <div>
                    <label className="mb-1 block text-[11px] font-bold text-gray-700">
                      Judul Pengumuman <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editingItem.title}
                      onChange={(e) => {
                        setEditingItem({ ...editingItem, title: e.target.value });
                        if (editError) setEditError("");
                      }}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-[11px] font-bold text-gray-700">
                        Kategori
                      </label>
                      <select
                        value={editingItem.category}
                        onChange={(e) =>
                          setEditingItem({ ...editingItem, category: e.target.value })
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs"
                      >
                        <option value="academic">Akademik</option>
                        <option value="activity">Kegiatan</option>
                        <option value="holiday">Libur / Cuti</option>
                        <option value="important">Penting</option>
                        <option value="achievement">Prestasi</option>
                        <option value="info">Info</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-[11px] font-bold text-gray-700">
                        Target Audiens
                      </label>
                      <select
                        value={editingItem.target_audience}
                        onChange={(e) =>
                          setEditingItem({
                            ...editingItem,
                            target_audience: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs"
                      >
                        <option value="all">Semua</option>
                        <option value="siswa">Siswa</option>
                        <option value="guru">Guru</option>
                        <option value="wali">Wali Murid</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold text-gray-700">
                      Deskripsi <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={4}
                      value={editingItem.description}
                      onChange={(e) => {
                        setEditingItem({
                          ...editingItem,
                          description: e.target.value,
                        });
                        if (editError) setEditError("");
                      }}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="mt-4 flex justify-end gap-2 border-t border-gray-100 pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingItem(null);
                      setEditError("");
                    }}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingEdit}
                    className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-60"
                  >
                    {isSavingEdit ? "Menyimpan..." : "Simpan Perubahan"}
                  </button>
                </div>
              </form>
            </div>
          )}

          <Toast
            isOpen={toast.open}
            onClose={() => setToast({ ...toast, open: false })}
            title={toast.title}
            message={toast.message}
            type={toast.type}
          />

        </main>
    </DashboardLayout>
  );
}
