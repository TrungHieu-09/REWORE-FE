"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "../components/admin/AdminShell";
import { EmptyState, LoadingSkeleton } from "../components/admin/AdminStates";
import { GrowthChart, type GrowthPoint } from "../components/admin/GrowthChart";
import { StatCard } from "../components/admin/StatCard";
import { adminApi, sellerDisplayName, type Order, type SellerApplication, type SellerReport, type User } from "../lib/api";
import { formatVnd } from "./_utils";

type TopSeller = Awaited<ReturnType<typeof adminApi.topSellers>>["data"][number];

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [topSellers, setTopSellers] = useState<TopSeller[]>([]);
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
      adminApi.topSellers(5),
    ]).then(([userResult, appResult, reportResult, orderResult, statsResult, growthResult, topResult]) => {
      if (cancelled) return;

      if (topResult.status === "fulfilled") setTopSellers(topResult.value.data);
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

      <section className="admin-chart-card" style={{ marginTop: 24 }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="admin-page-sub" style={{ margin: 0 }}>Top seller</p>
            <h2 className="admin-urgent-title" style={{ color: "#231a11", margin: 0 }}>Doanh thu cao nhất</h2>
          </div>
          <span className="sp-count-badge">{topSellers.length} shop</span>
        </div>
        {topSellers.length === 0 ? (
          <EmptyState icon="storefront" title="Chưa có doanh thu" desc="Bảng xếp hạng seller xuất hiện khi có đơn đã thanh toán." />
        ) : (
          <ol className="space-y-3">
            {topSellers.map((item, index) => (
              <li key={item.seller.id} className="flex items-center justify-between gap-4 py-2 border-b border-[#dbc1b9]/30 last:border-0">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-7 h-7 rounded-full bg-[#f8e5d6] text-[#974226] text-xs font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-[#231a11] truncate">
                      {item.seller.sellerProfile?.shopName ?? sellerDisplayName(item.seller as never, item.seller.id)}
                    </p>
                    <p className="text-[12px] text-[#88726c] truncate">
                      {item.seller.email ?? item.seller.id} · Uy tín {item.seller.reputation ?? 0}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="sp-price text-[18px]">{formatVnd(item.gmv_total)}</p>
                  <p className="text-[12px] text-[#88726c]">{item.total_orders} đơn</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </AdminShell>
  );
}
