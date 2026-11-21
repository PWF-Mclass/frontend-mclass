import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "./dashboard/DashboardLayout";
import LeaveRequestsSection from "./LeaveRequestsSection";
import Toast from "./Toast";
import {
  downloadAttendanceReportXlsx,
  getRecapClasses,
  getRecapOverview,
} from "../services/dashboardService";

// ============ ICON MAP ============
const statIcons = {
  shield: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    </svg>
  ),
  book: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    </svg>
  ),
  doc: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
    </svg>
  ),
  warning: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" x2="12" y1="9" y2="13" />
      <line x1="12" x2="12.01" y1="17" y2="17" />
    </svg>
  ),
};

// ============ SUB COMPONENTS ============
function StatCard({ item }) {
  return (
    <div className={`rounded-xl border-l-4 border border-gray-200 bg-white p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${item.borderColor}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold tracking-wide text-gray-600">{item.label}</p>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-gray-900">{item.value}</span>
            {item.sub && <span className="text-xs font-semibold text-gray-500">{item.sub}</span>}
          </div>
          <p className={`mt-1 text-xs font-medium ${item.icon === "warning" ? "text-red-600" : "text-gray-500"}`}>
            {item.desc}
          </p>
        </div>
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${item.bgIcon}`}>
          {statIcons[item.icon]}
        </div>
      </div>
    </div>
  );
}

function ClassCompactCard({ c }) {
  const isWarning = c.status === "warning";
  const isDanger = c.status === "danger";

  return (
    <div className={`rounded-xl border bg-white p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${isDanger ? "border-red-200" : isWarning ? "border-amber-200" : "border-gray-200"}`}>
      <div className="flex items-center justify-between">
        <span className="text-base font-bold text-gray-900">{c.label}</span>
        <div className="flex items-center gap-1.5">
          {c.pendingLeaves > 0 && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold text-amber-700">
              {c.pendingLeaves} Surat Izin Menunggu
            </span>
          )}
          <span className={`h-2.5 w-2.5 rounded-full ${isDanger ? "bg-red-500" : isWarning ? "bg-amber-500" : "bg-emerald-500"}`}></span>
        </div>
      </div>
      <p className="mt-1 text-[11px] text-gray-500">
        Hadir: {c.present}/{c.total} Siswa
      </p>

      <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500">
        <span>{c.percent}% Hadir</span>
        <span>{c.alpa} Alpa</span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full ${isDanger ? "bg-red-500" : isWarning ? "bg-amber-500" : "bg-emerald-500"}`}
          style={{ width: `${c.percent}%` }}
        ></div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-1.5 text-center">
        <div className="rounded-md bg-gray-50 py-1.5">
          <p className="text-[10px] text-gray-500">Izin/Sakit</p>
          <p className="text-sm font-bold text-gray-800">{c.izin}</p>
        </div>
        <div className="rounded-md bg-gray-50 py-1.5">
          <p className="text-[10px] text-gray-500">Telat</p>
          <p className="text-sm font-bold text-gray-800">{c.telat}</p>
        </div>
        <div className="rounded-md bg-gray-50 py-1.5">
          <p className="text-[10px] text-gray-500">Alpa</p>
          <p className={`text-sm font-bold ${c.alpa > 0 ? "text-red-600" : "text-gray-800"}`}>{c.alpa}</p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
        <span className="text-[10px] text-gray-400">{c.percent}% Hadir</span>
        <Link
          to={`/detail-kelas/${c.classId}`}
          className="text-[10px] font-semibold text-emerald-700 hover:underline"
        >
          Lihat Detail →
        </Link>
      </div>
    </div>
  );
}

function getTodayLocalString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// ============ MAIN ============
export default function RekapKelas() {
  const [selectedDate, setSelectedDate] = useState(() => getTodayLocalString());
  const [overview, setOverview] = useState(null);
  const [classes, setClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [toast, setToast] = useState({
    open: false,
    title: "",
    message: "",
    type: "success",
  });

  const loadRecapData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [overviewRes, classesRes] = await Promise.all([
        getRecapOverview({ date: selectedDate }),
        getRecapClasses({ date: selectedDate }),
      ]);
      setOverview(overviewRes);
      if (Array.isArray(classesRes)) {
        setClasses(
          classesRes.map((cls) => ({
            classId: cls.class_id,
            label: cls.name.toLowerCase().startsWith("kelas")
              ? cls.name
              : `Kelas ${cls.name}`,
            total: cls.total_students ?? 0,
            present: (cls.hadir ?? 0) + (cls.terlambat ?? 0),
            izin: (cls.izin ?? 0) + (cls.sakit ?? 0),
            telat: cls.terlambat ?? 0,
            alpa: cls.alpa ?? 0,
            pendingLeaves: cls.pending_leaves ?? 0,
            percent: cls.attendance_percent ?? 0,
            statusLabel: cls.status || "Normal",
            status:
              cls.status === "Normal"
                ? "normal"
                : (cls.attendance_percent ?? 0) < 80
                ? "danger"
                : "warning",
          }))
        );
      } else {
        setClasses([]);
      }
    } catch {
      setOverview(null);
      setClasses([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadRecapData();
  }, [loadRecapData]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await downloadAttendanceReportXlsx({ date: selectedDate });
      setToast({
        open: true,
        title: "Laporan Berhasil Diunduh",
        message: "File Excel rekap presensi telah berhasil diunduh.",
        type: "success",
      });
    } catch (error) {
      setToast({
        open: true,
        title: "Gagal Mengunduh Laporan",
        message: error.message || "Terjadi kesalahan saat mengekspor laporan.",
        type: "error",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const leaveTotal = overview?.leave_total?.total ?? 0;
  const pendingLeaveReqs = overview?.leave_total?.pending_requests ?? 0;
  const alpaTotal = overview?.alpa_total ?? 0;

  const statsData = [
    {
      label: "Monitoring Kelas",
      value: String(overview?.monitored_classes ?? classes.length),
      sub: "Kelas",
      desc: "Pemantauan Real-time Database",
      borderColor: "border-emerald-500",
      bgIcon: "bg-emerald-50 text-emerald-600",
      icon: "shield",
    },
    {
      label: "Kehadiran Rata-rata",
      value: `${overview?.attendance_avg_percent ?? 0}%`,
      sub: "",
      desc: overview?.from
        ? `Tanggal ${overview.from}`
        : "Hari sekolah berjalan",
      borderColor: "border-blue-500",
      bgIcon: "bg-blue-50 text-blue-600",
      icon: "book",
    },
    {
      label: "Total Izin / Sakit",
      value: String(leaveTotal),
      sub: "Siswa",
      desc:
        pendingLeaveReqs > 0
          ? `Perlu Verifikasi: ${pendingLeaveReqs} Surat Izin`
          : "Semua pengajuan izin terverifikasi",
      borderColor: "border-emerald-500",
      bgIcon: "bg-emerald-50 text-emerald-600",
      icon: "doc",
    },
    {
      label: "Alpa & Pelanggaran",
      value: String(alpaTotal),
      sub: "Siswa",
      desc:
        alpaTotal > 0
          ? `Tindak Lanjut: ${alpaTotal} Siswa`
          : "Tidak ada siswa alpa hari ini",
      borderColor: "border-red-500",
      bgIcon: "bg-red-50 text-red-500",
      icon: "warning",
    },
  ];

  return (
    <DashboardLayout>
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        {/* HEADER - Animasi Masuk */}
        <div className="animate-item delay-100 mb-5 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-extrabold text-gray-900">
              Rekapitulasi Presensi & Monitoring Kelas
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Pantau kehadiran real-time, kelola izin & dispensasi, serta hasil rekapitulasi presensi.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <label htmlFor="rekap-date" className="text-xs font-semibold text-gray-600">
                Tanggal:
              </label>
              <input
                id="rekap-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-60"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
              </svg>
              {isExporting ? "Mengunduh..." : "Export Laporan"}
            </button>
          </div>
        </div>

        {/* 4 STAT CARDS - Animasi Masuk */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statsData.map((s, i) => (
            <div key={i} className="animate-item delay-200">
              <StatCard item={s} />
            </div>
          ))}
        </div>

        {/* MONITORING KELAS - Animasi Masuk */}
        <section className="animate-item delay-300 mt-6">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-900">Detail Monitoring per Tingkat Kelas</h3>
              <p className="mt-0.5 text-xs text-gray-500">Pantau kehadiran setiap kelas dalam satu tampilan.</p>
            </div>
            <Link
              to="/semua-kelas"
              className="text-xs font-bold text-emerald-700 hover:underline"
            >
              Lihat Semua Kelas →
            </Link>
          </div>

          {isLoading ? (
            <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-xs text-gray-400">
              Memuat data kelas dari database...
            </div>
          ) : classes.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-xs text-gray-400">
              Belum ada kelas terdaftar di database.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {classes.map((c) => (
                <ClassCompactCard key={c.classId} c={c} />
              ))}
            </div>
          )}
        </section>

        {/* DAFTAR & VERIFIKASI SURAT IZIN SISWA */}
        <div className="animate-item delay-300">
          <LeaveRequestsSection onReviewed={loadRecapData} />
        </div>

        {/* GPS SECTION - Animasi Masuk */}
        <section className="animate-item delay-400 mt-6">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900">Cakupan & Radius GPS Presensi</h3>
                <p className="mt-0.5 text-xs text-gray-500">
                  Pemantauan titik lokasi presensi siswa & petugas (Radius aktif: {overview?.gps?.radius_m ?? 15}m).
                </p>
              </div>
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                GPS Aktif
              </span>
            </div>
            <div className="mt-5 flex items-center justify-center">
              <div className="relative flex h-40 w-40 items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-200"></div>
                <div className="absolute inset-6 rounded-full border-2 border-emerald-300"></div>
                <div className="absolute inset-12 rounded-full border-2 border-emerald-500 bg-emerald-50"></div>
                <div className="z-10 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-700 text-white shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <span className="absolute -right-1 top-6 flex h-3 w-3 rounded-full bg-amber-400"></span>
                <span className="absolute -left-2 bottom-10 flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-center">
                <p className="text-2xl font-extrabold text-gray-900">
                  {overview?.gps?.monitored_students ?? 0}
                </p>
                <p className="text-[10px] text-gray-500">Siswa Terpantau Dalam Radius</p>
              </div>
              <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-center">
                <p className="text-2xl font-extrabold text-red-600">
                  {overview?.gps?.outside_radius_students ?? 0}
                </p>
                <p className="text-[10px] text-red-600">Siswa Di Luar Radius</p>
              </div>
            </div>
            <Link
              to="/detail-lokasi"
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-200 py-2 text-[10px] font-semibold text-gray-700 hover:bg-gray-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m9 18 6-6-6-6" />
              </svg>
              Lihat Detail Titik Lokasi
            </Link>
          </div>
        </section>

        {/* TABEL REKAP - Animasi Masuk */}
        <section className="animate-item delay-400 mt-6 rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-100 p-5">
            <div>
              <h3 className="text-base font-bold text-gray-900">Ringkasan Presensi per Kelas Hari Ini</h3>
              <p className="mt-0.5 text-xs text-gray-500">
                Data diperbarui secara real-time langsung dari database.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  <th className="px-4 py-3 text-left">Kelas</th>
                  <th className="px-4 py-3 text-center">Total</th>
                  <th className="px-4 py-3 text-center">Hadir</th>
                  <th className="px-4 py-3 text-center">Izin/Sakit</th>
                  <th className="px-4 py-3 text-center">Telat</th>
                  <th className="px-4 py-3 text-center">Alpa</th>
                  <th className="px-4 py-3 text-center">% Hadir</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {classes.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-6 text-center text-xs text-gray-400">
                      Belum ada data kelas.
                    </td>
                  </tr>
                ) : (
                  classes.map((c) => {
                    const statusColor =
                      c.statusLabel === "Normal"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700";
                    return (
                      <tr key={c.classId} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3 font-bold text-gray-900">{c.label}</td>
                        <td className="px-4 py-3 text-center text-gray-700">{c.total}</td>
                        <td className="px-4 py-3 text-center font-semibold text-emerald-700">{c.present}</td>
                        <td className="px-4 py-3 text-center text-gray-700">{c.izin}</td>
                        <td className="px-4 py-3 text-center text-gray-700">{c.telat}</td>
                        <td className={`px-4 py-3 text-center font-semibold ${c.alpa > 0 ? "text-red-600" : "text-gray-700"}`}>
                          {c.alpa}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-gray-900">{c.percent}%</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${statusColor}`}>
                            {c.statusLabel}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            to={`/detail-kelas/${c.classId}`}
                            className="text-[10px] font-semibold text-emerald-700 hover:underline"
                          >
                            Lihat Detail →
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

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
