import { useCallback, useEffect, useState } from "react";
import { resolveBackendUrl } from "../lib/api";
import { listLeaveRequests, reviewLeaveRequest } from "../services/dashboardService";
import Toast from "./Toast";

const STATUS_BADGES = {
  menunggu: "bg-amber-100 text-amber-700 border-amber-200",
  disetujui: "bg-emerald-100 text-emerald-700 border-emerald-200",
  ditolak: "bg-red-100 text-red-700 border-red-200",
  dibatalkan: "bg-gray-100 text-gray-600 border-gray-200",
};

const CATEGORY_BADGES = {
  sakit: "bg-red-50 text-red-600 border-red-200",
  keperluan: "bg-blue-50 text-blue-600 border-blue-200",
  dispensasi: "bg-purple-50 text-purple-600 border-purple-200",
};

export default function LeaveRequestsSection({ classId, onReviewed }) {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [processingId, setProcessingId] = useState(null);
  const [rejectModalItem, setRejectModalItem] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [toast, setToast] = useState({
    open: false,
    title: "",
    message: "",
    type: "success",
  });

  const loadLeaveRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await listLeaveRequests({
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
        class_id: classId || undefined,
        limit: 50,
      });
      setItems(result.items || []);
    } catch {
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, categoryFilter, classId]);

  useEffect(() => {
    loadLeaveRequests();
  }, [loadLeaveRequests]);

  const handleApprove = async (item) => {
    setProcessingId(item.id);
    try {
      await reviewLeaveRequest(item.id, {
        decision: "disetujui",
        note: "Surat izin disetujui oleh petugas/guru.",
      });
      setToast({
        open: true,
        title: "Surat Izin Disetujui",
        message: `Permohonan ${item.category_label} dari ${item.student?.name} telah disetujui dan presensi diperbarui.`,
        type: "success",
      });
      await loadLeaveRequests();
      if (onReviewed) onReviewed();
    } catch (error) {
      setToast({
        open: true,
        title: "Gagal Menyetujui Surat Izin",
        message: error.message || "Terjadi kesalahan saat memproses surat izin.",
        type: "error",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectModalItem) return;
    if (!rejectReason.trim()) {
      setToast({
        open: true,
        title: "Alasan Wajib Diisi",
        message: "Masukkan alasan penolakan surat izin.",
        type: "error",
      });
      return;
    }

    setProcessingId(rejectModalItem.id);
    try {
      await reviewLeaveRequest(rejectModalItem.id, {
        decision: "ditolak",
        note: rejectReason.trim(),
      });
      const studentName = rejectModalItem.student?.name || "Siswa";
      setRejectModalItem(null);
      setRejectReason("");
      setToast({
        open: true,
        title: "Surat Izin Ditolak",
        message: `Permohonan izin dari ${studentName} telah ditolak.`,
        type: "success",
      });
      await loadLeaveRequests();
      if (onReviewed) onReviewed();
    } catch (error) {
      setToast({
        open: true,
        title: "Gagal Menolak Surat Izin",
        message: error.message || "Terjadi kesalahan saat menolak surat izin.",
        type: "error",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const pendingCount = items.filter((i) => i.status === "menunggu").length;

  return (
    <section className="mt-6 rounded-xl border border-gray-200 bg-white">
      <div className="flex flex-col items-start justify-between gap-3 border-b border-gray-100 p-5 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-gray-900">
              Permohonan Surat Izin & Sakit Siswa
            </h3>
            {pendingCount > 0 && (
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-700">
                {pendingCount} Menunggu Verifikasi
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-gray-500">
            Verifikasi pengajuan izin/sakit dari aplikasi mobile siswa beserta bukti lampirannya.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 focus:border-emerald-500 focus:outline-none"
          >
            <option value="">Semua Status</option>
            <option value="menunggu">Menunggu</option>
            <option value="disetujui">Disetujui</option>
            <option value="ditolak">Ditolak</option>
            <option value="dibatalkan">Dibatalkan</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 focus:border-emerald-500 focus:outline-none"
          >
            <option value="">Semua Kategori</option>
            <option value="sakit">Sakit</option>
            <option value="keperluan">Izin / Keperluan</option>
            <option value="dispensasi">Dispensasi</option>
          </select>
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {isLoading ? (
          <p className="py-8 text-center text-xs text-gray-400">
            Memuat daftar pengajuan surat izin dari database...
          </p>
        ) : items.length === 0 ? (
          <p className="py-8 text-center text-xs text-gray-400">
            Belum ada permohonan surat izin siswa pada filter ini.
          </p>
        ) : (
          items.map((item) => {
            const attachmentUrl = resolveBackendUrl(item.attachment_url);
            const isPending = item.status === "menunggu";
            const isBusy = processingId === item.id;

            return (
              <div
                key={item.id}
                className="flex flex-col justify-between gap-4 p-5 transition-colors hover:bg-gray-50/50 lg:flex-row lg:items-center"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${
                        STATUS_BADGES[item.status] || "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {item.status_label || item.status}
                    </span>
                    <span
                      className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${
                        CATEGORY_BADGES[item.category] || "bg-gray-50 text-gray-700"
                      }`}
                    >
                      {item.category_label || item.category} • {item.days} Hari
                    </span>
                    {item.student?.class?.name && (
                      <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        Kelas {item.student.class.name}
                      </span>
                    )}
                    <span className="text-[11px] font-semibold text-gray-500">
                      {item.start_date === item.end_date
                        ? item.start_date
                        : `${item.start_date} s.d. ${item.end_date}`}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap items-baseline gap-2">
                    <h4 className="text-sm font-bold text-gray-900">
                      {item.student?.name || "Siswa"}
                    </h4>
                    <span className="font-mono text-[11px] text-gray-500">
                      (NISN: {item.student?.nisn || "-"})
                    </span>
                  </div>

                  <p className="mt-1 text-xs leading-relaxed text-gray-600">
                    {item.reason}
                  </p>

                  {item.review_note && (
                    <p className="mt-1.5 text-[11px] text-gray-500">
                      <strong>Catatan Review:</strong> {item.review_note}
                      {item.reviewer_name ? ` — oleh ${item.reviewer_name}` : ""}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {attachmentUrl && (
                    <a
                      href={attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3.5 w-3.5 text-emerald-600"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                      Lihat Bukti Surat
                    </a>
                  )}

                  {isPending && (
                    <>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => {
                          setRejectModalItem(item);
                          setRejectReason("");
                        }}
                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                      >
                        Tolak
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleApprove(item)}
                        className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-800 disabled:opacity-50"
                      >
                        {isBusy ? "Memproses..." : "Setujui Izin"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Tolak Surat Izin */}
      {rejectModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            onClick={() => setRejectModalItem(null)}
          ></div>
          <form
            onSubmit={handleConfirmReject}
            className="relative z-10 w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">
                Tolak Permohonan Surat Izin
              </h3>
              <button
                type="button"
                onClick={() => setRejectModalItem(null)}
                className="rounded p-1 text-gray-400 hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <div className="mt-4">
              <p className="text-xs text-gray-600">
                Anda akan menolak pengajuan{" "}
                <strong>{rejectModalItem.category_label}</strong> dari{" "}
                <strong>{rejectModalItem.student?.name}</strong> (
                {rejectModalItem.start_date} s.d. {rejectModalItem.end_date}).
              </p>
              <label className="mt-3 mb-1 block text-[11px] font-bold text-gray-700">
                Alasan Penolakan <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Contoh: Lampiran surat keterangan tidak terbaca dengan jelas..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-red-500 focus:outline-none"
              />
            </div>

            <div className="mt-4 flex justify-end gap-2 border-t border-gray-100 pt-3">
              <button
                type="button"
                onClick={() => setRejectModalItem(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={processingId === rejectModalItem.id}
                className="rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {processingId === rejectModalItem.id ? "Menolak..." : "Konfirmasi Tolak"}
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
    </section>
  );
}
