import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { clearAuthStorage, getAuthToken } from "../lib/api";
import { fetchCurrentUser } from "../services/authService";

export default function ProtectedRoute({ roles }) {
  const token = getAuthToken();
  const [checking, setChecking] = useState(true);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    let active = true;

    if (!token) {
      setIsValid(false);
      setChecking(false);
      return () => {
        active = false;
      };
    }

    setChecking(true);
    fetchCurrentUser()
      .then((user) => {
        const validRole = user && (roles ? roles.includes(user.role) : ["admin", "guru"].includes(user.role));
        if (active) setIsValid(Boolean(validRole));
        if (!validRole) clearAuthStorage();
      })
      .catch(() => {
        clearAuthStorage();
        if (active) setIsValid(false);
      })
      .finally(() => {
        if (active) setChecking(false);
      });

    return () => {
      active = false;
    };
  }, [token, roles]);

  if (checking) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f4f6f8] px-4">
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
          <span className="text-xs font-semibold text-gray-600">
            Memeriksa sesi keamanan madrasah...
          </span>
        </div>
      </div>
    );
  }
  return isValid ? <Outlet /> : <Navigate to="/login" replace />;
}