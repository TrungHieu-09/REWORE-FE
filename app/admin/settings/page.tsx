"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "../../components/admin/AdminShell";
import { EmptyState, LoadingSkeleton } from "../../components/admin/AdminStates";
import { StatusBadge } from "../../components/admin/StatusBadge";
import { useAdminBadges } from "../../components/admin/useAdminBadges";
import { ApiError, adminApi } from "../../lib/api";
import { formatShortDate } from "../_utils";

type AdminSettingsData = Awaited<ReturnType<typeof adminApi.settings>>["data"];

const RULE_LABELS: Record<string, string> = {
  UNPAID_ORDER: "Người mua không thanh toán (đơn tự huỷ)",
  AUCTION_UNPAID: "Người thắng đấu giá không thanh toán",
  SELLER_CANCEL_PAID: "Người bán huỷ đơn đã được thanh toán",
  SHIP_OVERDUE: "Người bán giao hàng quá hạn",
  HOLD_EXPIRED: "Giữ hàng hết giờ nhưng không mua",
  ORDER_COMPLETED: "Đơn hàng hoàn tất thành công",
};

export default function AdminSettingsPage() {
  const { pendingSellers, openReports } = useAdminBadges();
  const [data, setData] = useState<AdminSettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    adminApi
      .settings()
      .then((res) => {
        if (!cancelled) setData(res.data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Không tải được cấu hình hệ thống.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AdminShell pendingSellers={pendingSellers} openReports={openReports}>
      <header className="admin-page-head">
        <div>
          <h1 className="admin-page-title">Cài đặt & Vận hành</h1>
          <p className="admin-page-sub">
            Thông số phí sàn, tài khoản nhận tiền Escrow, quy tắc điểm uy tín và lịch sử thao tác quản trị.
          </p>
          {error && <p className="sp-foryou-sub" style={{ color: "#ba1a1a" }}>{error}</p>}
        </div>
      </header>

      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : !data ? (
        <EmptyState icon="settings" title="Chưa tải được cấu hình" desc="Hãy kiểm tra lại kết nối tới backend server." />
      ) : (
        <div className="space-y-6">
          {/* Tích hợp dịch vụ */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                label: "Tài khoản nhận tiền (VietQR)",
                ok: data.bank.configured,
                desc: data.bank.configured
                  ? `${data.bank.bankName} · ${data.bank.accountNumber}`
                  : "Chưa cấu hình PLATFORM_BANK_* trong .env",
              },
              {
                label: "SePay Webhook (Tự động đối soát)",
                ok: data.integrations.sepayWebhook,
                desc: data.integrations.sepayWebhook ? "Đã kết nối SEPAY_API_KEY" : "Chưa đặt SEPAY_API_KEY",
              },
              {
                label: "Supabase Storage (Lưu ảnh)",
                ok: data.integrations.supabaseStorage,
                desc: data.integrations.supabaseStorage ? "Đã kết nối SUPABASE_URL" : "Chưa đặt SUPABASE_URL / KEY",
              },
            ].map((item) => (
              <div key={item.label} className="bg-white rounded-2xl border border-[#dbc1b9]/40 p-5 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-[#231a11]">{item.label}</p>
                  <p className="text-xs text-[#88726c] mt-1">{item.desc}</p>
                </div>
                <StatusBadge label={item.ok ? "Sẵn sàng" : "Thiếu cấu hình"} tone={item.ok ? "green" : "orange"} />
              </div>
            ))}
          </div>

          {/* Tài khoản ngân hàng & Phí sàn + Giữ hàng */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="bg-white rounded-2xl border border-[#dbc1b9]/40 p-6">
              <h2 className="text-lg font-bold text-[#231a11] mb-4">Tài khoản Escrow & Phí sàn</h2>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between py-1.5 border-b border-[#f2dfd1]">
                  <dt className="text-[#55433d]">Tỷ lệ phí sàn</dt>
                  <dd className="font-bold text-[#974226]">{data.platformFeePercent}% / đơn hoàn tất</dd>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#f2dfd1]">
                  <dt className="text-[#55433d]">Ngân hàng</dt>
                  <dd className="font-semibold text-[#231a11]">{data.bank.bankName || "—"} {data.bank.bankCode ? `(${data.bank.bankCode})` : ""}</dd>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#f2dfd1]">
                  <dt className="text-[#55433d]">Số tài khoản</dt>
                  <dd className="font-mono font-bold text-[#231a11]">{data.bank.accountNumber || "—"}</dd>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#f2dfd1]">
                  <dt className="text-[#55433d]">Chủ tài khoản</dt>
                  <dd className="font-semibold text-[#231a11]">{data.bank.accountName || "—"}</dd>
                </div>
                <div className="flex justify-between py-1.5">
                  <dt className="text-[#55433d]">Tiền tố nội dung CK</dt>
                  <dd className="font-mono font-semibold text-[#231a11]">{data.bank.memoPrefix}&lt;8 ký tự cuối mã đơn&gt;</dd>
                </div>
              </dl>
            </section>

            <section className="bg-white rounded-2xl border border-[#dbc1b9]/40 p-6">
              <h2 className="text-lg font-bold text-[#231a11] mb-4">Ngưỡng vận hành & Giữ hàng</h2>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between py-1.5 border-b border-[#f2dfd1]">
                  <dt className="text-[#55433d]">Điểm uy tín khởi tạo / tối đa</dt>
                  <dd className="font-semibold text-[#231a11]">{data.reputation.config.initial} / {data.reputation.config.max}</dd>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#f2dfd1]">
                  <dt className="text-[#55433d]">Điểm tối thiểu để mua bình thường / bán hàng</dt>
                  <dd className="font-semibold text-[#231a11]">{data.reputation.config.minToBuy} / {data.reputation.config.minToSell}</dd>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#f2dfd1]">
                  <dt className="text-[#55433d]">Thời hạn thanh toán đơn hàng</dt>
                  <dd className="font-semibold text-[#231a11]">{data.reputation.config.unpaidOrderHours} giờ</dd>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#f2dfd1]">
                  <dt className="text-[#55433d]">Thời hạn người bán giao hàng</dt>
                  <dd className="font-semibold text-[#231a11]">{data.reputation.config.shipDeadlineDays} ngày</dd>
                </div>
                <div className="flex justify-between py-1.5">
                  <dt className="text-[#55433d]">Giữ hàng (Hold)</dt>
                  <dd className="font-semibold text-[#231a11]">
                    {data.holds.durationMinutes} phút · tối đa {data.holds.maxActive} món · cần uy tín ≥ {data.holds.minReputation}
                  </dd>
                </div>
              </dl>
            </section>
          </div>

          {/* Bảng quy tắc cộng trừ điểm uy tín */}
          <section className="bg-white rounded-2xl border border-[#dbc1b9]/40 p-6">
            <h2 className="text-lg font-bold text-[#231a11] mb-4">Quy tắc cộng / trừ điểm uy tín tự động</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(data.reputation.rules).map(([key, delta]) => (
                <div key={key} className="rounded-xl bg-[#fff8f5] border border-[#dbc1b9]/40 p-3.5 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-[#231a11]">{RULE_LABELS[key] ?? key}</p>
                    <p className="text-[11px] font-mono text-[#88726c]">{key}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${delta > 0 ? "bg-[#e7efd9] text-[#3d4a22]" : "bg-[#ffdad6] text-[#93000a]"}`}>
                    {delta > 0 ? `+${delta}` : delta}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Lịch sử thao tác Admin */}
          <section className="bg-white rounded-2xl border border-[#dbc1b9]/40 overflow-hidden">
            <div className="p-6 border-b border-[#f2dfd1] flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#231a11]">Nhật ký thao tác Admin gần đây</h2>
                <p className="text-xs text-[#88726c] mt-0.5">30 thao tác quản trị mới nhất được ghi nhận trong hệ thống.</p>
              </div>
              <span className="sp-count-badge">{data.recentLogs.length} bản ghi</span>
            </div>
            {data.recentLogs.length === 0 ? (
              <div className="p-8 text-center text-sm text-[#88726c]">Chưa có nhật ký thao tác nào.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#f8e5d6] text-xs uppercase tracking-wide text-[#55433d]">
                    <tr>
                      <th className="px-4 py-3">Thời gian</th>
                      <th className="px-4 py-3">Admin</th>
                      <th className="px-4 py-3">Hành động</th>
                      <th className="px-4 py-3">Đối tượng</th>
                      <th className="px-4 py-3">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentLogs.map((log) => (
                      <tr key={log.id} className="border-t border-[#f2dfd1]">
                        <td className="px-4 py-3 text-xs text-[#88726c] whitespace-nowrap">{formatShortDate(log.createdAt)}</td>
                        <td className="px-4 py-3 text-xs font-semibold text-[#231a11]">{log.admin?.name ?? log.admin?.email ?? log.adminId}</td>
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-[#974226]">{log.actionType}</td>
                        <td className="px-4 py-3 text-xs text-[#55433d]">{log.targetType} · {log.targetId.slice(-8)}</td>
                        <td className="px-4 py-3 text-xs text-[#55433d]">{log.note || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </AdminShell>
  );
}
