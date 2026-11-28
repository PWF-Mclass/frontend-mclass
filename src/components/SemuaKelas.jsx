import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "./dashboard/DashboardLayout";
import { getRecapClasses } from "../services/dashboardService";

const statusStyles = {
  normal: {
    card: "border-gray-200 bg-white",
    badge: "bg-emerald-100 text-emerald-700",
    bar: "bg-emerald-500",
    label: "Normal",
    labelColor: "text-emerald-600",
  },
  warning: {
    card: "border-amber-200 bg-amber-50/30",
    badge: "bg-amber-100 text-amber-700",
    bar: "bg-amber-500",
    label: "Perlu Cek",
    labelColor: "text-amber-600",
  },
  danger: {
    card: "border-red-200 bg-red-50/40",
    badge: "bg-red-100 text-red-700",
    bar: "bg-red-500",
    label: "Tindak Lanjut",
    labelColor: "text-red-600",
  },
};

export default function AllClasses() {
  const [classes, setClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    getRecapClasses()
      .then((data) => {
        if (!isMounted) return;
        if (Array.isArray(data)) {
          setClasses(
            data.map((c) => {
              const pct = Number(c.attendance_percent ?? 0);
              const statusKey =
                c.status === "Normal"
                  ? "normal"
                  : pct < 80
                  ? "danger"
                  : "warning";
              return {
                classId: c.class_id,
                name: c.name,
                grade: Number(c.grade ?? 7),
                totalStudents: Number(c.total_students ?? 0),
                present: Number(c.hadir ?? 0) + Number(c.terlambat ?? 0),
                izin: Number(c.izin ?? 0) + Number(c.sakit ?? 0),
                telat: Number(c.terlambat ?? 0),
                alpa: Number(c.alpa ?? 0),
                percent: pct,
                status: statusKey,
              };
            })
          );
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const grades = Array.from(new Set(classes.map((c) => c.grade))).sort(
    (a, b) => a - b
  );
  const normalCount = classes.filter((c) => c.status === "normal").length;
  const warningCount = classes.filter((c) => c.status === "warning").length;
  const dangerCount = classes.filter((c) => c.status === "danger").length;

  return (
    <DashboardLayout
      footer={
        <footer className="mt-auto flex shrink-0 flex-col items-center justify-between gap-2 border-t border-gray-200 bg-white px-4 py-3.5 text-center text-[11px] text-gray-500 sm:flex-row sm:text-left md:px-6">
          <span>
            © {new Date().getFullYear()} MTs Al-Ma'arif 02 Singosari • Sistem Presensi Digital Terpadu
          </span>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <div className="flex items-center gap-1.5 text-emerald-600">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              <span className="font-medium">Database Terhubung</span>
            </div>
          </div>
        </footer>
      }
    >
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        {/* Breadcrumb */}
        <div className="mb-4 flex items-center gap-2 text-xs text-gray-500">
          <Link to="/dashboard" className="hover:text-emerald-700">Dashboard</Link>
          <span>›</span>
          <Link to="/rekap-kelas" className="hover:text-emerald-700">Rekap Kelas</Link>
          <span>›</span>
          <span className="font-semibold text-gray-700">Semua Kelas</span>
        </div>

        {/* Summary Bar */}
        <div className="mb-5 flex flex-wrap items-center gap-4 rounded-xl border border-gray-200 bg-white px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-xs font-medium text-gray-700">
              {normalCount} Kelas Normal
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span>
            <span className="text-xs font-medium text-gray-700">
              {warningCount} Kelas Perlu Cek
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500"></span>
            <span className="text-xs font-medium text-gray-700">
              {dangerCount} Kelas Tindak Lanjut
            </span>
          </div>
          <div className="ml-auto flex items-center gap-2 text-xs text-gray-500">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500"></span>
            Total Kelas: <strong className="text-gray-700">{classes.length}</strong>
          </div>
        </div>

        {isLoading ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-xs text-gray-400">
            Memuat data seluruh kelas dari database...
          </div>
        ) : grades.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-xs text-gray-400">
            Belum ada kelas terdaftar di database.
          </div>
        ) : (
          grades.map((grade) => {
            const classesInGrade = classes.filter((c) => c.grade === grade);
            const totalPresent = classesInGrade.reduce((sum, c) => sum + c.present, 0);
            const totalStudents = classesInGrade.reduce((sum, c) => sum + c.totalStudents, 0);
            const gradePercent =
              totalStudents > 0
                ? ((totalPresent / totalStudents) * 100).toFixed(1)
                : "0.0";

            return (
              <section key={grade} className="mb-6">
                {/* Grade Header */}
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-gray-900">
                      Kelas {grade}
                    </h3>
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600">
                      {classesInGrade.length} KELAS
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-gray-500">
                      Total: <strong className="text-gray-800">{totalPresent}/{totalStudents}</strong> siswa
                    </span>
                    <span
                      className={`rounded-md px-2 py-0.5 font-bold ${
                        parseFloat(gradePercent) >= 95
                          ? "bg-emerald-100 text-emerald-700"
                          : parseFloat(gradePercent) >= 85
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {gradePercent}%
                    </span>
                  </div>
                </div>

                {/* Class Grid */}
                <div className="grid grid-cols-1 gap-4">
                  {classesInGrade.map((c) => {
                    const style = statusStyles[c.status];
                    return (
                      <div
                        key={c.classId}
                        className={`w-full rounded-xl border p-5 transition hover:shadow-md ${style.card}`}
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="text-lg font-bold text-gray-900">
                            {c.name.toLowerCase().startsWith("kelas")
                              ? c.name
                              : `Kelas ${c.name}`}
                          </h4>
                          <span className={`text-xs font-semibold ${style.labelColor}`}>
                            {style.label}
                          </span>
                        </div>

                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-2xl font-extrabold text-gray-900">
                            {c.present}
                            <span className="text-sm font-medium text-gray-400">
                              {" "}
                              / {c.totalStudents}
                            </span>
                          </span>
                          <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${style.badge}`}>
                            {c.percent}%
                          </span>
                        </div>

                        <div className="mt-3">
                          <div className="flex items-center justify-between text-[10px] text-gray-500">
                            <span>{c.percent}% Hadir</span>
                            <span>{c.alpa} Alpa</span>
                          </div>
                          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                            <div
                              className={`h-full rounded-full ${style.bar}`}
                              style={{ width: `${c.percent}%` }}
                            ></div>
                          </div>
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
                            <p className={`text-sm font-bold ${c.alpa > 0 ? "text-red-600" : "text-gray-800"}`}>
                              {c.alpa}
                            </p>
                          </div>
                        </div>

                        <Link
                          to={`/detail-kelas/${c.classId}`}
                          className="mt-3 block w-full rounded-lg border border-gray-200 bg-white py-2 text-center text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                        >
                          Lihat Detail Presensi
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })
        )}
      </main>
    </DashboardLayout>
  );
}
