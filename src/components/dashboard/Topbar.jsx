import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../../services/dashboardService";

export default function Topbar({ onMenuClick }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifs = () => {
    listNotifications({ limit: 15 })
      .then((res) => {
        setNotifications(res.items || []);
        setUnreadCount(res.unreadCount || 0);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchNotifs();
    const timer = setInterval(fetchNotifs, 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      fetchNotifs();
    } catch {
      // ignore
    }
  };

  const handleNotifClick = async (notif) => {
    if (!notif.read_at && !notif.is_read) {
      try {
        await markNotificationRead(notif.id);
        fetchNotifs();
      } catch {
        // ignore
      }
    }
    setIsNotifOpen(false);
    if (notif.type === "leave_submitted" || notif.type === "leave_reviewed") {
      navigate("/rekap-kelas");
    } else if (notif.type === "announcement") {
      navigate("/kalender");
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 md:px-6">
      {/* Kiri: Logo M-Class + Badge */}
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Buka menu navigasi"
          className="rounded-md p-1.5 text-gray-600 hover:bg-gray-100 lg:hidden"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <img src="/mclass-logo.png" alt="Logo M-Class" className="h-9 w-9 shrink-0 object-contain" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-base font-bold leading-tight text-gray-900">M-Class</h1>
            <span className="hidden shrink-0 rounded bg-emerald-600 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-white sm:inline-block">
              MTS AL-MA'ARIF
            </span>
          </div>
          <p className="hidden truncate text-[10px] leading-tight text-gray-500 sm:block">
            Sistem Presensi Digital & Verifikasi Geospasial
          </p>
        </div>
      </div>

      {/* Kanan: Notifikasi Real-time */}
      <div className="relative flex shrink-0 items-center gap-2" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => {
            setIsNotifOpen((v) => !v);
            if (!isNotifOpen) fetchNotifs();
          }}
          className="relative rounded-lg border border-gray-200 bg-white p-2 text-gray-600 transition hover:bg-gray-50"
          aria-label="Notifikasi"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        {isNotifOpen && (
          <div className="absolute top-full right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-gray-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <span className="text-xs font-bold text-gray-900">
                Notifikasi ({unreadCount} baru)
              </span>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-[10px] font-semibold text-emerald-700 hover:underline"
                >
                  Tandai Semua Dibaca
                </button>
              )}
            </div>
            <div className="max-h-80 divide-y divide-gray-100 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="py-6 text-center text-xs text-gray-400">
                  Belum ada notifikasi.
                </p>
              ) : (
                notifications.map((n) => {
                  const isUnread = !n.read_at && !n.is_read;
                  return (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => handleNotifClick(n)}
                      className={`flex w-full flex-col items-start gap-1 px-4 py-3 text-left transition hover:bg-gray-50 ${
                        isUnread ? "bg-emerald-50/40" : ""
                      }`}
                    >
                      <div className="flex w-full items-center justify-between gap-2">
                        <span className="text-xs font-bold text-gray-900">
                          {n.title}
                        </span>
                        {isUnread && (
                          <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-600"></span>
                        )}
                      </div>
                      <p className="text-[11px] leading-relaxed text-gray-600">
                        {n.body || n.message}
                      </p>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
