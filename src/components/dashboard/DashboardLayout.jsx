import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function DashboardLayout({ children, footer }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Topbar onMenuClick={() => setIsSidebarOpen(true)} />
      <div className="flex flex-1">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          {children}
          {footer ?? (
            <footer className="mt-auto flex shrink-0 flex-col items-center justify-between gap-2 border-t border-gray-200 bg-white px-4 py-3.5 text-center text-[11px] text-gray-500 sm:flex-row sm:text-left md:px-6">
              <span>
                © {new Date().getFullYear()} MTs Al-Ma'arif 02 Singosari • Sistem Presensi Digital Terpadu
              </span>
              <span className="text-[10px] text-gray-400">
                M-Class Admin Portal
              </span>
            </footer>
          )}
        </div>
      </div>
    </div>
  );
}
