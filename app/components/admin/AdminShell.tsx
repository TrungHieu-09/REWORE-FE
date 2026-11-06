"use client";

import Link from "next/link";
import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { SidebarNav } from "./SidebarNav";

export function AdminShell({
  children,
  pendingSellers = 0,
  openReports = 0,
}: {
  children: ReactNode;
  pendingSellers?: number;
  openReports?: number;
}) {
  const router = useRouter();
  const { isLoggedIn, isLoading, logout, user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    if (isLoading) return;
    if (!isLoggedIn) {
      router.replace("/login");
      return;
    }
    if (!isAdmin) {
      router.replace("/shop");
    }
  }, [isAdmin, isLoading, isLoggedIn, router]);

  if (isLoading || !isLoggedIn || !isAdmin) {
    return (
      <div className="admin-root">
        <nav className="navbar" id="admin-navbar">
          <div className="nav-inner">
            <Link href="/" className="brand">REWORE</Link>
            <div className="admin-top-user">
              <span className="admin-role-pill">Admin</span>
            </div>
          </div>
        </nav>
        <main className="admin-main admin-auth-check">
          <div className="admin-skeleton-card" />
          <div className="admin-skeleton-card" />
        </main>
      </div>
    );
  }

  return (
    <div className="admin-root">
      <nav className="navbar" id="admin-navbar">
        <div className="nav-inner">
          <Link href="/admin" className="brand">REWORE</Link>
          <div className="admin-top-user">
            <span className="admin-role-pill">Admin</span>
            <button type="button" className="admin-logout-btn" onClick={logout}>
              <span className="material-symbols-outlined">logout</span>
              Log out
            </button>
          </div>
        </div>
      </nav>

      <div className="admin-layout">
        <SidebarNav pendingSellers={pendingSellers} openReports={openReports} />
        <main className="admin-main">{children}</main>
      </div>
    </div>
  );
}
