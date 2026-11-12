"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "../components/admin/AdminShell";
import { EmptyState, LoadingSkeleton } from "../components/admin/AdminStates";
import { GrowthChart, type GrowthPoint } from "../components/admin/GrowthChart";
import { StatCard } from "../components/admin/StatCard";
import { adminApi, type Order, type SellerApplication, type SellerReport, type User } from "../lib/api";
import { formatVnd } from "./_utils";

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [applications, setApplications] = useState<SellerApplication[]>([]);
  const [reports, setReports] = useState<SellerReport[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [chartData, setChartData] = useState<GrowthPoint[]>([]);
  const [overview, setOverview] = useState<{
    total_users: number;
    total_sellers_approved: number;
    total_orders: number;
    gmv_total: number;
    pending_sellers_count: number;
    open_reports_count: number;
    platform_fees_total?: number;
    pending_payout_total?: number;
  } | null>(null);
  const [apiMessage, setApiMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    Promise.allSettled([
      adminApi.users({ limit: 50 }),
      adminApi.sellerApplications({ limit: 50 }),
      adminApi.reports({ limit: 50 }),
      adminApi.orders({ limit: 50 }),
      adminApi.statsOverview(),
      adminApi.statsGrowth("week"),
    ]).then(([userResult, appResult, reportResult, orderResult, statsResult, growthResult]) => {
      if (cancelled) return;

      if (userResult.status === "fulfilled") setUsers(userResult.value.data);
      if (appResult.status === "fulfilled") setApplications(appResult.value.data);
      if (reportResult.status === "fulfilled") setReports(reportResult.value.data);
      if (orderResult.status === "fulfilled") setOrders(orderResult.value.data);
      if (statsResult.status === "fulfilled") setOverview(statsResult.value.data);
      if (growthResult.status === "fulfilled") {
        setChartData(
          growthResult.value.data.map((point) => ({
            date: point.date.slice(5).replace("-", "/"),
            users: point.users_new,
            gmv: point.gmv,
          }))
        );
      }

      if ([userResult, appResult, reportResult, orderResult, statsResult, growthResult].some((result) => result.status === "rejected")) {
        setApiMessage("Một số Admin API chưa sẵn sàng hoặc chưa đăng nhập admin.");
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const pendingSellers =
    overview?.pending_sellers_count ??
    applications.filter((item) => item.status === "PENDING" || item.status === "PENDING_VERIFICATION").length;
  const approvedSellers =
    overview?.total_sellers_approved ??
    applications.filter((item) => item.status === "APPROVED").length;
  const openReports =
    overview?.open_reports_count ?? reports.filter((item) => item.status === "OPEN").length;
  const todaysOrders = orders.filter((item) => {
    const created = new Date(item.createdAt);
    const today = new Date();
    return created.toDateString() === today.toDateString();
  }).length;
  const gmv = overview?.gmv_total ?? orders
    .filter((item) => item.paymentStatus === "PAID" || item.status === "PAID" || item.status === "SHIPPED" || item.status === "DELIVERED")
    .reduce((sum, item) => sum + item.totalPrice, 0);
  const totalUsers = overview?.total_users ?? users.length;
  const platformFees = overview?.platform_fees_total ?? 0;
  const pendingPayouts = overview?.pending_payout_total ?? 0;

  const stats = useMemo(
    () => [
      { icon: "group", label: "Tổng người dùng", value: String(totalUsers), sub: "Active accounts", progress: 64 },
      { icon: "verified_user", label: "Seller đã duyệt", value: String(approvedSellers), sub: "Approved shops", progress: 72 },
      { icon: "payments", label: "GMV", value: formatVnd(gmv), sub: "Paid orders", progress: 58 },
      { icon: "today", label: "Đơn hôm nay", value: String(todaysOrders), sub: "New orders", progress: 46 },
      { icon: "receipt_long", label: "Phí sàn đã thu", value: formatVnd(platformFees), sub: `Chờ chuyển seller: ${formatVnd(pendingPayouts)}`, progress: 52 },
    ],
    [approvedSellers, gmv, pendingPayouts, platformFees, todaysOrders, totalUsers]
  );

  return (
    <AdminShell pendingSellers={pendingSellers} openReports={openReports}>
      <header className="admin-page-head">
        <div>
          <h1 className="admin-page-title">Dashboard tổng quan</h1>
          <p className="admin-page-sub">Theo dõi vận hành marketplace, seller verification và đơn hàng.</p>
          {apiMessage && <p className="sp-foryou-sub" style={{ color: "#ba1a1a" }}>{apiMessage}</p>}
        </div>
      </header>

      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : stats.length === 0 ? (
        <EmptyState icon="dashboard" title="Chưa có dữ liệu" desc="Admin metrics sẽ xuất hiện khi backend trả dữ liệu." />
      ) : (
        <section className="admin-stats-grid">
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </section>
      )}

      <section className="admin-urgent-card">
        <span className="admin-urgent-badge"><span className="sp-live-dot" />ACTION</span>
        <h2 className="admin-urgent-title">Cần xử lý ngay</h2>
        <div className="admin-urgent-grid">
          <div className="admin-urgent-metric">
            <span className="admin-urgent-num">{pendingSellers}</span>
            <span className="admin-urgent-label">Hồ sơ seller đang chờ</span>
          </div>
          <div className="admin-urgent-metric">
            <span className="admin-urgent-num">{openReports}</span>
            <span className="admin-urgent-label">Report đang mở</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link className="admin-pill admin-pill-dark" href="/admin/sellers">
            <span className="material-symbols-outlined text-[16px]">verified_user</span>
            Người bán
          </Link>
          <Link className="admin-pill admin-pill-dark" href="/admin/reports">
            <span className="material-symbols-outlined text-[16px]">flag</span>
            Xem báo cáo
          </Link>
        </div>
      </section>

      {chartData.length > 0 ? (
        <GrowthChart data={chartData} />
      ) : (
        <section className="admin-chart-card">
          <EmptyState icon="monitoring" title="Chưa có dữ liệu tăng trưởng" desc="Biểu đồ sẽ xuất hiện khi backend trả dữ liệu thống kê theo ngày." />
        </section>
      )}
    </AdminShell>
  );
}
