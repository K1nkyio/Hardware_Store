import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import { getAdminAccessToken, isAdminMfaPendingToken, restoreAdminSession } from "@/lib/api";

const AdminLayout = () => {
  const location = useLocation();
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const hasToken = getAdminAccessToken() || (await restoreAdminSession());
      if (!active) return;
      setIsAuthenticated(Boolean(hasToken));
      setIsReady(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  if (!isReady) {
    return <div className="min-h-screen bg-background" />;
  }

  const mfaPending = isAdminMfaPendingToken();

  if (!isAuthenticated || mfaPending) {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{ from: `${location.pathname}${location.search}${location.hash}` }}
      />
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
