import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import DashboardLayout from "./dashboard/DashboardLayout";
import Toast from "./Toast";
import { resolveBackendUrl } from "../lib/api";
import {
  getFaceScanDetail,
  resetStudentFaceEnrollment,
} from "../services/dashboardService";
import { useAuth } from "../context/AuthContext";

const getAvatarFallbackUrl = (seed, size = 300) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(
    seed || "Siswa"
  )}&size=${size}&background=047857&color=fff&bold=true`;

// ============ ICON MAP ============
const icons = {
  check: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  close: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6M9 9l6 6" />
    </svg>
  ),
  user: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  camera: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  ),
  pin: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
};

function formatAttemptTime(isoStr) {
  if (!isoStr) return "Belum ada scan";
  const parsed = new Date(isoStr);
  if (Number.isNaN(parsed.getTime())) return isoStr;
  return (
    parsed.toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Jakarta",
    }) + " WIB"
  );
}

export default function ValidasiWajah() {
  const { nis } = useParams();
  const { user } = useAuth();
  const [scanData, setScanData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [toast, setToast] = useState({
    open: false,
    title: "",
    message: "",
    type: "success",
  });

  const loadFaceDetail = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getFaceScanDetail(nis);
      setScanData(data);
    } catch {
      setScanData(null);
    } finally {
      setIsLoading(false);
    }
  }, [nis]);

  useEffect(() => {
    loadFaceDetail();
  }, [loadFaceDetail]);

  const handleResetFaceEnrollment = async () => {
    const targetNisn = scanData?.student?.nisn || nis;
    if (!targetNisn) return;

    setIsResetting(true);
    try {
      const res = await resetStudentFaceEnrollment(targetNisn);
      setToast({
        open: true,
        title: "Enrollment Wajah Direset",
        message: `Template wajah ${res.student_name || targetNisn} berhasil direset (${res.revoked_templates} sampel dicabut). Siswa dapat mendaftarkan wajah ulang di aplikasi mobile.`,
        type: "success",
      });
      await loadFaceDetail();
    } catch (error) {
      setToast({
        open: true,
        title: "Gagal Mereset Wajah",
        message: error.message || "Terjadi kesalahan saat mereset template wajah.",
        type: "error",
      });
    } finally {
      setIsResetting(false);
    }
  };

  const student = scanData?.student || {
    nisn: nis || "-",
    name: "Memuat...",
    class: null,
    gender: "L",
    guardian_name: null,
  };

  const radiusGeofence = scanData?.location?.radius_m ?? 15;
  const jarakSiswa =
    scanData?.location?.distance_m !== null &&
    scanData?.location?.distance_m !== undefined
      ? Math.round(Number(scanData.location.distance_m))
      : null;
  const dalamRadius =
    scanData?.location?.within_radius !== null &&
    scanData?.location?.within_radius !== undefined
      ? Boolean(scanData.location.within_radius)
      : jarakSiswa !== null
      ? jarakSiswa <= radiusGeofence
      : true;
  const persenRadius =
    jarakSiswa !== null && radiusGeofence > 0
      ? Math.min((jarakSiswa / radiusGeofence) * 100, 100)
      : 0;

  const isMatched =
    scanData?.result === "match" || scanData?.outcome === "recorded";
  const isRejected =
    scanData?.outcome &&
    scanData.outcome !== "recorded" &&
    scanData.outcome !== "not_attempted";

  const capturedUrl = resolveBackendUrl(scanData?.captured_photo_url);
  const referenceUrl = resolveBackendUrl(scanData?.reference_photo_url);
  const photoToShow =
    capturedUrl || referenceUrl || getAvatarFallbackUrl(student.name, 300);

  const backClassId = student.class?.id || "7";

  return (
    <DashboardLayout>
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        {/* Header - Animasi Masuk */}
        <div className="animate-item delay-100 mt-3 mb-5 flex items-start gap-3">
          <Link
            to={`/detail-kelas/${backClassId}`}
            className="mt-1 flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m12 19-7-7 7-7M19 12H5" />
            </svg>
          </Link>
          <div>
            <h2 className="text-xl font-extrabold text-gray-900">
              Detail Verifikasi Biometrik Wajah
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Data hasil verifikasi wajah & geolokasi presensi siswa dari database
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-xs text-gray-400">
            Memuat data verifikasi wajah siswa dari database...
          </div>
        ) : !scanData ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-xs text-gray-400">
            Data siswa atau hasil scan wajah tidak ditemukan di database.
          </div>
        ) : (
          <>
            {/* Info Siswa - Animasi Masuk */}
            <div className="animate-item delay-200 rounded-xl border border-gray-200 bg-white p-5 transition-all duration-300 hover:shadow-md">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  {icons.user}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-bold text-gray-900">{student.name}</h3>
                  <p className="mt-0.5 text-xs text-gray-500">
                    NISN: <span className="font-mono text-gray-700">{student.nisn}</span> •{" "}
                    Kelas <strong className="text-gray-700">{student.class?.name || "-"}</strong> •{" "}
                    {student.gender === "P" ? "Perempuan" : "Laki-laki"}
                    {student.guardian_name ? ` • Wali: ${student.guardian_name}` : ""}
                  </p>
                </div>
                <span
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${
                    isMatched
                      ? "bg-emerald-50 text-emerald-700"
                      : isRejected
                      ? "bg-red-50 text-red-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isMatched
                        ? "bg-emerald-500"
                        : isRejected
                        ? "bg-red-500"
                        : "bg-amber-500 animate-pulse"
                    }`}
                  ></span>
                  {scanData.result_label ||
                    (isMatched
                      ? "Terverifikasi AI"
                      : isRejected
                      ? "Ditolak Sistem"
                      : "Belum Scan Hari Ini")}
                </span>
              </div>
            </div>

            {/* Foto Validasi - Animasi Masuk */}
            <div className="animate-item delay-300 mt-6 rounded-xl border border-gray-200 bg-white p-5 transition-all duration-300 hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    Foto Wajah & Hasil Pencocokan AI
                  </h3>
                  <p className="mt-0.5 text-[10px] text-gray-500">
                    Waktu pengambilan: {formatAttemptTime(scanData.attempted_at)}
                  </p>
                </div>
                <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                  BIOMETRIK AI
                </span>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
                {/* Foto */}
                <div className="flex justify-center lg:justify-start">
                  <div className="relative group">
                    <img
                      src={photoToShow}
                      alt={`Foto wajah ${student.name}`}
                      className="h-72 w-72 rounded-xl border-4 border-emerald-100 object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                    <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-emerald-700 px-2.5 py-1 text-[10px] font-bold text-white shadow-lg">
                      {icons.camera}
                      {capturedUrl
                        ? "Foto Scan Presensi"
                        : referenceUrl
                        ? "Foto Referensi Wajah"
                        : "Belum Ada Foto"}
                    </span>
                  </div>
                </div>

                {/* Detail Foto */}
                <div className="flex flex-col justify-between gap-4">
                  <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4">
                    <h4 className="text-xs font-bold text-gray-900">
                      Detail Verifikasi Biometrik & Geolokasi
                    </h4>
                    <div className="mt-3 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Waktu Scan</span>
                        <span className="font-semibold text-gray-800">
                          {formatAttemptTime(scanData.attempted_at)}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Skor Kemiripan Wajah</span>
                        <span className="font-semibold text-emerald-700">
                          {scanData.similarity !== null &&
                          scanData.similarity !== undefined
                            ? `${(Number(scanData.similarity) * 100).toFixed(1)}% (Batas: ${(
                                Number(scanData.match_threshold || 0.4) * 100
                              ).toFixed(0)}%)`
                            : "—"}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Status Presensi</span>
                        <span className="font-semibold uppercase text-gray-800">
                          {scanData.record?.status || scanData.outcome || "Belum Presensi"}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Radius Geofence Sekolah</span>
                        <span className="font-semibold text-gray-800">
                          {radiusGeofence} meter
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Jarak Siswa dari Pusat</span>
                        <span
                          className={`font-semibold ${
                            dalamRadius ? "text-emerald-700" : "text-red-600"
                          }`}
                        >
                          {jarakSiswa !== null ? `${jarakSiswa} meter` : "—"}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar Radius */}
                    <div className="mt-3 rounded-lg border border-gray-100 bg-white p-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-gray-700">
                          Radius Terpakai
                        </span>
                        <span
                          className={`text-[10px] font-bold ${
                            dalamRadius ? "text-emerald-700" : "text-red-600"
                          }`}
                        >
                          {jarakSiswa !== null ? jarakSiswa : 0} / {radiusGeofence} m
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                        <div
                          className={`h-full rounded-full ${
                            dalamRadius ? "bg-emerald-500" : "bg-red-500"
                          }`}
                          style={{ width: `${persenRadius}%` }}
                        ></div>
                      </div>
                      <p
                        className={`mt-1.5 flex items-center gap-1 text-[10px] font-semibold ${
                          dalamRadius ? "text-emerald-700" : "text-red-600"
                        }`}
                      >
                        {icons.pin}
                        {jarakSiswa === null
                          ? "Siswa belum melakukan scan lokasi hari ini"
                          : dalamRadius
                          ? "Dalam radius geofence sekolah (aman)"
                          : "Di luar radius geofence sekolah"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons (Reset Enrollment Wajah oleh Admin) */}
            <div className="animate-item delay-400 mt-6 flex flex-col items-start justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 transition-all duration-300 hover:shadow-md sm:flex-row sm:items-center">
              <p className="text-[11px] text-gray-500">
                Verifikasi presensi wajah diproses secara otomatis oleh AI. Jika siswa mengalami kendala pengenalan wajah, Admin dapat mereset pendaftaran wajah siswa.
              </p>
              {user?.role === "admin" && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={isResetting}
                    onClick={handleResetFaceEnrollment}
                    className="flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-4 py-2 text-xs font-bold text-red-600 transition-all hover:bg-red-50 hover:shadow-sm active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {icons.close}
                    {isResetting ? "Mereset..." : "Reset Enrollment Wajah Siswa"}
                  </button>
                </div>
              )}
            </div>
          </>
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
