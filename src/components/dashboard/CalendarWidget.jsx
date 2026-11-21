import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getCalendarSummary, listAnnouncements } from "../../services/announcementService";

const days = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const SHORT_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];
const FULL_MONTHS = [
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

const eventSymbols = {
  red: "⚑",
  amber: "★",
  emerald: "●",
};

function resolveMarkerColor(item) {
  if (item.category === "holiday" || item.type === "libur") return "red";
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

function buildMonthGrid(year, monthIndex0) {
  const firstDay = new Date(year, monthIndex0, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthIndex0 + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function CalendarWidget() {
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [monthIdx, setMonthIdx] = useState(() => new Date().getMonth());
  const [summary, setSummary] = useState(null);
  const [announcements, setAnnouncements] = useState([]);

  const monthQuery = `${year}-${String(monthIdx + 1).padStart(2, "0")}`;

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      getCalendarSummary(monthQuery).catch(() => null),
      listAnnouncements().catch(() => []),
    ]).then(([summaryData, announcementItems]) => {
      if (!isMounted) return;
      if (summaryData) setSummary(summaryData);
      if (Array.isArray(announcementItems)) setAnnouncements(announcementItems);
    });
    return () => {
      isMounted = false;
    };
  }, [monthQuery]);

  const calendarData = useMemo(
    () => buildMonthGrid(year, monthIdx),
    [year, monthIdx]
  );

  const dayMarkerMap = useMemo(() => {
    const map = {};
    if (Array.isArray(summary?.days)) {
      summary.days.forEach((d) => {
        const dayEvents = Array.isArray(d.events) ? d.events : [];
        const hasEvent = Boolean(d.has_event) || dayEvents.length > 0 || Boolean(d.color);
        if (hasEvent && d.color) {
          map[d.day] = {
            color: d.color,
            label: d.label || dayEvents[0]?.title || "Pengumuman",
          };
        }
      });
    }

    if (Array.isArray(announcements) && announcements.length > 0) {
      const daysInCurrentMonth = new Date(year, monthIdx + 1, 0).getDate();
      for (let dayNum = 1; dayNum <= daysInCurrentMonth; dayNum++) {
        if (map[dayNum]) continue;
        const dateStr = `${monthQuery}-${String(dayNum).padStart(2, "0")}`;
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
          map[dayNum] = {
            color: resolveMarkerColor(primaryEv),
            label: primaryEv.title || "Pengumuman",
          };
        }
      }
    }

    return map;
  }, [summary, announcements, year, monthIdx, monthQuery]);

  const now = new Date();
  const todayFromBackend = summary?.today ? String(summary.today).slice(0, 10) : null;
  const todayDayNumber = useMemo(() => {
    if (todayFromBackend && todayFromBackend.startsWith(monthQuery)) {
      const parsed = Number(todayFromBackend.slice(8, 10));
      if (!Number.isNaN(parsed)) return parsed;
    }
    const isCurrentRealMonth =
      now.getFullYear() === year && now.getMonth() === monthIdx;
    return isCurrentRealMonth ? now.getDate() : null;
  }, [todayFromBackend, monthQuery, year, monthIdx]);

  const monthEvents = useMemo(() => {
    if (Array.isArray(summary?.events) && summary.events.length > 0) {
      return summary.events.slice(0, 3);
    }
    return announcements
      .filter((item) =>
        String(item.publish_date || item.event_date || "").startsWith(monthQuery)
      )
      .slice(0, 3);
  }, [summary, announcements, monthQuery]);

  const handlePrev = () => {
    if (monthIdx === 0) {
      setYear((y) => y - 1);
      setMonthIdx(11);
    } else {
      setMonthIdx((m) => m - 1);
    }
  };

  const handleNext = () => {
    if (monthIdx === 11) {
      setYear((y) => y + 1);
      setMonthIdx(0);
    } else {
      setMonthIdx((m) => m + 1);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-gray-900">Kalender Presensi</h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrev}
            className="rounded p-1 text-gray-400 hover:bg-gray-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <span className="text-xs font-semibold text-gray-700">
            {SHORT_MONTHS[monthIdx]} {year}
          </span>
          <button
            type="button"
            onClick={handleNext}
            className="rounded p-1 text-gray-400 hover:bg-gray-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>

      <p className="mt-0.5 text-[10px] text-gray-500">
        {FULL_MONTHS[monthIdx]} {year} • Semester Ganjil
      </p>

      {/* Day Headers */}
      <div className="mt-3 grid grid-cols-7 gap-1 text-center">
        {days.map((d) => (
          <div key={d} className="py-1 text-[10px] font-bold text-gray-400">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="mt-1 grid grid-cols-7 gap-1">
        {calendarData.map((day, i) => {
          if (day === null) return <div key={i} className="aspect-square"></div>;

          const isToday = day === todayDayNumber;
          const markerInfo = dayMarkerMap[day];
          const marker = markerInfo?.color;
          const isWeekend = i % 7 >= 5;

          return (
            <button
              key={i}
              type="button"
              title={markerInfo?.label}
              className={`relative flex aspect-square flex-col items-center justify-center rounded-md text-xs font-medium transition ${
                isToday
                  ? "bg-emerald-600 text-white font-bold"
                  : marker === "red"
                  ? "border border-red-200 bg-red-50 text-red-600 font-bold"
                  : marker === "amber"
                  ? "border border-amber-200 bg-amber-50 text-amber-700 font-bold"
                  : marker === "emerald"
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-700 font-bold"
                  : isWeekend
                  ? "text-gray-300"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span>{day}</span>
              {marker && (
                <span
                  className={`absolute top-0.5 right-1 text-[8px] leading-none ${
                    isToday
                      ? "text-white"
                      : marker === "red"
                      ? "text-red-500"
                      : marker === "amber"
                      ? "text-amber-600"
                      : "text-emerald-600"
                  }`}
                >
                  {eventSymbols[marker] || "●"}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 space-y-2 border-t border-gray-100 pt-3">
        <div className="flex items-center gap-2 text-xs">
          <span className="h-2.5 w-2.5 shrink-0 rounded-sm bg-emerald-600"></span>
          <span className="font-bold text-gray-800">Hari Ini (06.30 - 14.30 WIB)</span>
        </div>
        {monthEvents.length > 0 ? (
          monthEvents.map((ev) => {
            const color = resolveMarkerColor(ev);
            return (
              <div key={ev.id} className="flex items-center gap-2 text-xs text-gray-600">
                <span
                  className={`inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded text-[9px] font-bold ${
                    color === "red"
                      ? "bg-red-100 text-red-600"
                      : color === "amber"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {eventSymbols[color]}
                </span>
                <span className="truncate">{ev.title}</span>
                <span className="ml-auto shrink-0 text-[10px] font-semibold text-gray-400">
                  {String(ev.publish_date || ev.event_date || "").slice(0, 10)}
                </span>
              </div>
            );
          })
        ) : (
          <div className="flex flex-wrap items-center gap-3 text-[10px] text-gray-500">
            <span className="flex items-center gap-1">
              <span className="font-bold text-emerald-600">●</span> Agenda Aktif
            </span>
            <span className="flex items-center gap-1">
              <span className="font-bold text-amber-600">★</span> Penting
            </span>
            <span className="flex items-center gap-1">
              <span className="font-bold text-red-600">⚑</span> Libur
            </span>
          </div>
        )}
      </div>

      <Link
        to="/kalender"
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white py-2.5 text-xs font-bold text-gray-700 transition hover:bg-gray-50"
      >
        Lihat Jadwal Penuh
      </Link>
    </div>
  );
}
