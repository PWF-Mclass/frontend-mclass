import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import DashboardLayout from "./dashboard/DashboardLayout";
import LeaveRequestsSection from "./LeaveRequestsSection";
import { getRecapClassDetail } from "../services/dashboardService";

// ============ STATUS STYLE ============
const statusStyles = {
  hadir: { label: "Hadir", badge: "bg-emerald-100 text-emerald-700" },
  sakit: { label: "Sakit", badge: "bg-amber-100 text-amber-700" },
  izin: { label: "Izin", badge: "bg-blue-100 text-blue-700" },
  alpa: { label: "Alpa", badge: "bg-red-100 text-red-700" },
  terlambat: { label: "Terlambat", badge: "bg-orange-100 text-orange-700" },
  belum_hadir: { label: "Belum Hadir", badge: "bg-gray-100 text-gray-600" },
};

// ============ ICON MAP ============
const statIcons = {
  check: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  thermometer: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z" />
    </svg>
  ),
  doc: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </svg>
  ),
  warning: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" x2="12" y1="9" y2="13" />
      <line x1="12" x2="12.01" y1="17" y2="17" />
    </svg>
  ),
  clock: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  ),
};

// ============ SUB COMPONENTS ============
function StatCard({ item }) {
  return (
    <div className={`rounded-xl border border-gray-200 bg-white p-4 border-l-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${item.borderColor}`}>
      <div className="flex items-start justify-between">
        <p className="text-[10px] font-bold tracking-wider text-gray-500">
          {item.label}
        </p>
        <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${item.bgIcon}`}>
          {statIcons[item.icon]}
        </span>
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className={`text-3xl font-extrabold ${item.valueColor}`}>
          {item.value}
        </span>
        {item.total && (
          <span className="text-sm font-semibold text-gray-400">{item.total}</span>
        )}
      </div>
    </div>
  );
}

function formatCheckInTime(isoStr) {
  if (!isoStr) return "—";
  const parsed = new Date(isoStr);
  if (Number.isNaN(parsed.getTime())) return isoStr;
  return (
    parsed.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Jakarta",
    }) + " WIB"
  );
}

function getTodayLocalString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const ITEMS_PER_PAGE = 8;

// ============ MAIN ============
export default function DetailKelas() {
  const { kelas } = useParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => getTodayLocalString());
  const [currentPage, setCurrentPage] = useState(1);
  const [detail, setDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const currentKelas = kelas || "7";

  const loadDetail = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getRecapClassDetail(currentKelas, {
        date: selectedDate || undefined,
      });
      setDetail(data);
    } catch {
      setDetail(null);
    } finally {
      setIsLoading(false);
    }
  }, [currentKelas, selectedDate]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const classInfo = detail?.class;
  const counts = detail?.counts || {
    total_students: 0,
    hadir: 0,
    sakit: 0,
    izin: 0,
    alpa: 0,
    terlambat: 0,
    belum_hadir: 0,
  };
  const students = Array.isArray(detail?.students) ? detail.students : [];

  const filteredSiswa = students.filter((s) => {
    if (statusFilter && s.status !== statusFilter) return false;
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      return (
        String(s.name || "").toLowerCase().includes(q) ||
        String(s.nisn || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredSiswa.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const paginatedSiswa = filteredSiswa.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, currentKelas, selectedDate]);

  const statsData = [
    {
      label: "HADIR",
      value: String(counts.hadir ?? 0),
      total: `/${counts.total_students ?? 0}`,
      borderColor: "border-l-emerald-500",
      bgIcon: "bg-emerald-50 text-emerald-600",
      valueColor: "text-emerald-700",
      icon: "check",
    },
    {
      label: "SAKIT",
      value: String(counts.sakit ?? 0),
      borderColor: "border-l-amber-500",
      bgIcon: "bg-amber-50 text-amber-600",
      valueColor: "text-amber-600",
      icon: "thermometer",
    },
    {
      label: "IZIN",
      value: String(counts.izin ?? 0),
      borderColor: "border-l-blue-500",
      bgIcon: "bg-blue-50 text-blue-600",
      valueColor: "text-blue-600",
      icon: "doc",
    },
    {
      label: "ALPA",
      value: String(counts.alpa ?? 0),
      borderColor: "border-l-red-500",
      bgIcon: "bg-red-50 text-red-600",
      valueColor: "text-red-600",
      icon: "warning",
    },
    {
      label: "TERLAMBAT",
      value: String(counts.terlambat ?? 0),
      borderColor: "border-l-amber-500",
      bgIcon: "bg-amber-50 text-amber-600",
      valueColor: "text-amber-600",
      icon: "clock",
    },
  ];

  const classLabel = classInfo?.name
    ? classInfo.name.toLowerCase().startsWith("kelas")
      ? classInfo.name
      : `Kelas ${classInfo.name}`
    : `Kelas ${currentKelas}`;

  return (
    <DashboardLayout>
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        {/* Header - Animasi Masuk */}
        <div className="animate-item delay-100 mt-3 mb-5 flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <Link
              to="/rekap-kelas"
              className="mt-1 flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m12 19-7-7 7-7M19 12H5" />
              </svg>
            </Link>
            <div>
              <h2 className="text-xl font-extrabold text-gray-900">
                Laporan Presensi {classLabel}
              </h2>
              <p className="mt-1 text-xs text-gray-500">
                Kelola data presensi harian santri {classLabel} aktif di Madrasah
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="detail-kelas-date" className="text-xs font-semibold text-gray-600">
              Tanggal Presensi:
            </label>
            <input
              id="detail-kelas-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Info Wali Kelas - Animasi Masuk */}
        <div className="animate-item delay-200 rounded-xl border border-gray-200 bg-white p-5 transition-all duration-300 hover:shadow-md">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-lg font-extrabold text-emerald-700">
              {classInfo?.name || currentKelas}
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Wali Kelas: {classInfo?.homeroom_teacher_name || "Belum Ditentukan"}
              </h3>
              <p className="mt-0.5 text-xs text-gray-500">
                Tingkat Kelas {classInfo?.grade || currentKelas} •{" "}
                <strong className="text-gray-700">{counts.total_students}</strong> Siswa Terdaftar
              </p>
            </div>
          </div>
        </div>

        {/* 5 Stat Cards - Animasi Masuk */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5 animate-item delay-300 mt-4">
          {statsData.map((s, i) => (
            <StatCard key={i} item={s} />
          ))}
        </div>

        {/* Tabel Siswa - Animasi Masuk */}
        <div className="animate-item delay-400 mt-4 rounded-xl border border-gray-200 bg-white transition-all duration-300 hover:shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-4">
            <div className="relative w-full max-w-xs">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama santri atau NISN..."
                className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-xs text-gray-800 placeholder-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-xs font-medium text-gray-700 focus:border-emerald-500 focus:outline-none"
            >
              <option value="">Semua Status</option>
              <option value="hadir">Hadir</option>
              <option value="terlambat">Terlambat</option>
              <option value="izin">Izin</option>
              <option value="sakit">Sakit</option>
              <option value="alpa">Alpa</option>
              <option value="belum_hadir">Belum Hadir</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  <th className="px-4 py-3 text-center">No</th>
                  <th className="px-4 py-3 text-left">NISN</th>
                  <th className="px-4 py-3 text-left">Nama Siswa</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Waktu Presensi</th>
                  <th className="px-4 py-3 text-left">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-xs text-gray-400">
                      Memuat daftar siswa dari database...
                    </td>
                  </tr>
                ) : paginatedSiswa.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-xs text-gray-400">
                      Tidak ada data siswa yang cocok.
                    </td>
                  </tr>
                ) : (
                  paginatedSiswa.map((s, idx) => {
                    const stStyle = statusStyles[s.status] || statusStyles.belum_hadir;
                    const faceTarget = s.scan_id ? s.scan_id : s.nisn;
                    return (
                      <tr key={s.nisn || idx} className="text-xs hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3 text-center font-medium text-gray-500">
                          {s.absence_number ?? startIndex + idx + 1}
                        </td>
                        <td className="px-4 py-3 font-mono text-gray-700">{s.nisn}</td>
                        <td className="px-4 py-3 font-semibold text-gray-900">
                          <Link
                            to={`/validasi-wajah/${faceTarget}`}
                            className="hover:text-emerald-700 hover:underline transition-colors"
                          >
                            {s.name}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${stStyle.badge}`}>
                            {stStyle.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-gray-700">
                          {formatCheckInTime(s.check_in_at)}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {s.note || "—"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Tabel & Pagination */}
          <div className="relative flex flex-col items-center justify-center gap-3 border-t border-gray-100 px-4 py-3 text-[10px] text-gray-500 sm:flex-row">
            <span className="sm:absolute sm:left-4">
              Menampilkan{" "}
              <strong className="text-gray-700">
                {filteredSiswa.length === 0
                  ? 0
                  : `${startIndex + 1}–${Math.min(
                      startIndex + ITEMS_PER_PAGE,
                      filteredSiswa.length
                    )}`}
              </strong>{" "}
              dari <strong className="text-gray-700">{filteredSiswa.length}</strong> siswa
            </span>

            {totalPages > 1 && (
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
            )}
          </div>
        </div>

        {/* Pengajuan Surat Izin Kelas Ini */}
        {classInfo?.id && (
          <LeaveRequestsSection classId={classInfo.id} onReviewed={loadDetail} />
        )}
      </main>
    </DashboardLayout>
  );
}
