"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type CountKey = "pendingSellers" | "openReports";
type AdminNavItem = {
  href: string;
  icon: string;
  label: string;
  countKey?: CountKey;
};

const ITEMS: AdminNavItem[] = [
  { href: "/admin", icon: "space_dashboard", label: "Dashboard" },
  { href: "/admin/sellers", icon: "verified_user", label: "Người bán", countKey: "pendingSellers" },
  { href: "/admin/users", icon: "group", label: "Người dùng" },
  { href: "/admin/products", icon: "styler", label: "Sản phẩm" },
  { href: "/admin/reports", icon: "flag", label: "Báo cáo", countKey: "openReports" },
  { href: "/admin/orders", icon: "receipt_long", label: "Đơn hàng" },
  { href: "/admin/settings", icon: "settings", label: "Cài đặt" },
];

export function SidebarNav({
  pendingSellers,
  openReports,
}: {
  pendingSellers: number;
  openReports: number;
}) {
  const pathname = usePathname();
  const counts = { pendingSellers, openReports };

  return (
    <aside className="admin-sidebar sp-sidebar">
      <div className="sp-sidebar-inner">
        <div className="sp-filter-top">
          <h2 className="sp-filter-title">Admin</h2>
          <span className="sp-clear-all">Ops</span>
        </div>

        <div className="sp-quick-tabs">
          {ITEMS.map((item) => {
            const active = pathname === item.href;
            const count = item.countKey ? counts[item.countKey] : 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sp-quick-tab admin-nav-link${active ? " active" : ""}`}
              >
                <span className="material-symbols-outlined admin-nav-icon">
                  {item.icon}
                </span>
                <span className="admin-nav-text">{item.label}</span>
                {count > 0 && <span className="admin-nav-badge">{count}</span>}
              </Link>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
