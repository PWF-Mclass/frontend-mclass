import { api, getAuthToken } from "../lib/api";

export async function getDashboardSummary(date) {
  const query = date ? `?date=${encodeURIComponent(date)}` : "";
  const response = await api(`/dashboard/summary${query}`);
  return response.data;
}

export async function getRecapOverview(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).trim() !== "") {
      search.set(k, String(v));
    }
  });
  const q = search.toString();
  const response = await api(`/recap/overview${q ? `?${q}` : ""}`);
  return response.data;
}

export async function getRecapClasses(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).trim() !== "") {
      search.set(k, String(v));
    }
  });
  const q = search.toString();
  const response = await api(`/recap/classes${q ? `?${q}` : ""}`);
  return response.data;
}

export async function getRecapClassDetail(classId, params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).trim() !== "") {
      search.set(k, String(v));
    }
  });
  const q = search.toString();
  const response = await api(
    `/recap/classes/${encodeURIComponent(classId)}${q ? `?${q}` : ""}`
  );
  return response.data;
}

export async function getRecapLocation(date) {
  const query = date ? `?date=${encodeURIComponent(date)}` : "";
  const response = await api(`/recap/location${query}`);
  return response.data;
}

export async function listLeaveRequests(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).trim() !== "") {
      search.set(k, String(v));
    }
  });
  const q = search.toString();
  const response = await api(`/leave-requests${q ? `?${q}` : ""}`);
  return {
    items: response.data || [],
    meta: response.meta || null,
  };
}

export async function reviewLeaveRequest(id, payload) {
  const response = await api(`/leave-requests/${encodeURIComponent(id)}/review`, {
    method: "PATCH",
    body: payload,
  });
  return response.data;
}

export async function listFaceScans(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).trim() !== "") {
      search.set(k, String(v));
    }
  });
  const q = search.toString();
  const response = await api(`/face-scans${q ? `?${q}` : ""}`);
  return {
    items: response.data || [],
    meta: response.meta || null,
  };
}

export async function getFaceScanDetail(scanIdOrNisn) {
  const response = await api(`/face-scans/${encodeURIComponent(scanIdOrNisn)}`);
  return response.data;
}

export async function resetStudentFaceEnrollment(nisn) {
  const response = await api(`/face/reset/${encodeURIComponent(nisn)}`, {
    method: "POST",
  });
  return response.data;
}

export async function listNotifications(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).trim() !== "") {
      search.set(k, String(v));
    }
  });
  const q = search.toString();
  const response = await api(`/notifications${q ? `?${q}` : ""}`);
  return {
    items: response.data || [],
    unreadCount: response.unread_count ?? response.meta?.unread_count ?? 0,
    meta: response.meta || null,
  };
}

export async function markNotificationRead(id) {
  const response = await api(`/notifications/${encodeURIComponent(id)}/read`, {
    method: "PATCH",
  });
  return response.data;
}

export async function markAllNotificationsRead() {
  const response = await api(`/notifications/read-all`, {
    method: "POST",
  });
  return response.data;
}

export async function downloadAttendanceReportXlsx(params = {}) {
  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
  const search = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).trim() !== "") {
      search.set(k, String(v));
    }
  });
  const q = search.toString();
  const token = getAuthToken();
  const response = await fetch(
    `${API_BASE_URL.replace(/\/+$/, "")}/reports/attendance/export${q ? `?${q}` : ""}`,
    {
      method: "GET",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }
  );

  if (!response.ok) {
    const errJson = await response.json().catch(() => null);
    throw new Error(
      errJson?.message || "Gagal mengunduh laporan presensi dari server."
    );
  }

  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition") || "";
  const match = /filename="?([^"]+)"?/i.exec(disposition);
  const filename = match?.[1] || "Rekap-Presensi-Kelas.xlsx";

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
