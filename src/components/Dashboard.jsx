import { useCallback, useEffect, useState } from "react";
import DashboardLayout from "./dashboard/DashboardLayout";
import StatCard from "./dashboard/StatCard";
import ClassCard from "./dashboard/ClassCard";
import AnnouncementList from "./dashboard/AnnouncementList";
import CalendarWidget from "./dashboard/CalendarWidget";
import LeaveRequestsSection from "./LeaveRequestsSection";
import { getDashboardSummary } from "../services/dashboardService";

function getTodayLocalString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState(() => getTodayLocalString());
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadSummary = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getDashboardSummary(selectedDate);
      setSummary(data);
    } catch {
      setSummary(null);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const totals = summary?.totals;
  const totalStudents = totals?.total_students ?? 0;
  const sudahHadir = totals?.sudah_hadir ?? 0;
  const terlambatIzinTotal = totals?.terlambat_izin?.total ?? 0;
  const terlambatCount = totals?.terlambat_izin?.terlambat ?? 0;
  const izinCount = totals?.terlambat_izin?.izin ?? 0;
  const sakitCount = totals?.terlambat_izin?.sakit ?? 0;
  const pendingLeavesCount =
    totals?.pending_leaves ?? totals?.terlambat_izin?.pending_leaves ?? 0;
  const belumHadirAlpaTotal = totals?.belum_hadir_alpa?.total ?? 0;
  const belumHadirCount = totals?.belum_hadir_alpa?.belum_hadir ?? 0;
  const alpaCount = totals?.belum_hadir_alpa?.alpa ?? 0;

  const hadirPercent =
    totalStudents > 0 ? Math.round((sudahHadir / totalStudents) * 100) : 0;

  const stats = [
    {
      label: "TOTAL SISWA",
      value: String(totalStudents),
      unit: "Siswa",
      subtext:
        totalStudents > 0
          ? "100% Terdaftar di Roster Aktif"
          : "Belum ada siswa terdaftar",
      subColor: "text-emerald-600",
      variant: "default",
    },
    {
      label: "SUDAH HADIR",
      value: String(sudahHadir),
      unit: `${hadirPercent}%`,
      subtext: summary?.date
        ? `Presensi tanggal ${summary.date}`
        : "Hari ini",
      subColor: "text-emerald-600",
      variant: "success",
    },
    {
      label: "TERLAMBAT / IZIN",
      value: String(terlambatIzinTotal),
      unit: "Siswa",
      subtext:
        pendingLeavesCount > 0
          ? `${izinCount} Izin, ${sakitCount} Sakit, ${terlambatCount} Telat • ${pendingLeavesCount} Surat Menunggu`
          : `${izinCount} Izin, ${sakitCount} Sakit, ${terlambatCount} Telat`,
      subColor: pendingLeavesCount > 0 ? "text-amber-600 font-semibold" : "text-gray-500",
      variant: "warning",
    },
    {
      label: "BELUM HADIR / ALPA",
      value: String(belumHadirAlpaTotal),
      unit: "Siswa",
      subtext: `${belumHadirCount} Belum Hadir, ${alpaCount} Alpa`,
      subColor: alpaCount > 0 ? "text-red-600" : "text-gray-500",
      variant: alpaCount > 0 ? "danger" : "default",
    },
  ];

  const classes = Array.isArray(summary?.classes)
    ? summary.classes.map((cls) => ({
        kelasId: String(cls.class_id),
        className: cls.name.toLowerCase().startsWith("kelas")
          ? cls.name
          : `Kelas ${cls.name}`,
        totalStudents: cls.total_students ?? 0,
        present: (cls.hadir ?? 0) + (cls.terlambat ?? 0),
        absent: cls.alpa ?? 0,
        percent: cls.attendance_percent ?? 0,
        note: cls.note,
      }))
    : [];

  return (
    <DashboardLayout>
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        {/* Page Header - Animasi Masuk */}
        <div className="animate-item delay-100 mb-5 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-extrabold text-gray-900">
              Dashboard Pemantauan Presensi Harian
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Monitoring kehadiran siswa real-time MTs Al-Ma'arif 02 Singosari
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="dashboard-date" className="text-xs font-semibold text-gray-600">
              Tanggal:
            </label>
            <input
              id="dashboard-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Stat Cards - Animasi Masuk */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s, i) => (
            <div key={i} className="animate-item delay-200">
              <StatCard {...s} />
            </div>
          ))}
        </div>

        {/* Monitoring Section - Animasi Masuk */}
        <div className="animate-item delay-300 mt-6">
          <div className="mb-3 flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Monitoring per Tingkat Kelas
              </h3>
              <p className="mt-0.5 text-xs text-gray-500">
                Status kehadiran per kelas pada jam pemantauan berjalan saat ini
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-xs text-gray-400">
              Memuat data kelas dari database...
            </div>
          ) : classes.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-xs text-gray-400">
              Belum ada data kelas di database.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {classes.map((c) => (
                <div
                  key={c.kelasId}
                  className="transition-transform duration-300 hover:-translate-y-1"
                >
                  <ClassCard {...c} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Daftar Pengajuan Surat Izin Siswa */}
        <div className="animate-item delay-300">
          <LeaveRequestsSection onReviewed={loadSummary} />
        </div>

        {/* Bottom Grid - Animasi Masuk */}
        <div className="animate-item delay-400 mt-6 grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_1fr]">
          <AnnouncementList />
          <CalendarWidget />
        </div>
      </main>
    </DashboardLayout>
  );
}
