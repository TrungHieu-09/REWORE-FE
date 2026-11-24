"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ApiError, reportsApi, sellerDisplayName, type SellerReport } from "@/app/lib/api";

const STATUS_STYLE: Record<string, { label: string; className: string; icon: string }> = {
  OPEN: { label: "Đang xử lý", className: "bg-[#fff1e0] text-[#7b4a10]", icon: "hourglass_top" },
  RESOLVED: { label: "Đã xử lý", className: "bg-[#e7efd9] text-[#3d4a22]", icon: "check_circle" },
  DISMISSED: { label: "Đã bỏ qua", className: "bg-[#f2dfd1] text-[#55443d]", icon: "block" },
};

const ACTION_LABEL: Record<string, string> = {
  WARN: "Cảnh cáo người bán",
  SUSPEND: "Tạm khoá người bán",
  DISMISS: "Không vi phạm",
};

const TARGET_LABEL: Record<string, string> = {
  USER: "Người dùng",
  PRODUCT: "Sản phẩm",
  ORDER: "Đơn hàng",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("vi-VN", { dateStyle: "medium", timeStyle: "short" });
}

function targetHref(report: SellerReport) {
  if (!report.targetId) return null;
  if (report.targetType === "ORDER") return `/orders/${report.targetId}`;
  if (report.targetType === "PRODUCT") return `/products/${report.targetId}`;
  return null;
}

export default function TabMyReports() {
  const [reports, setReports] = useState<SellerReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState<"ALL" | "OPEN" | "RESOLVED" | "DISMISSED">("ALL");

  useEffect(() => {
    let cancelled = false;
    reportsApi
      .mine({ limit: 50 })
      .then((res) => {
        if (!cancelled) setReports(res.data);
      })
      .catch((err) => {
        if (!cancelled) setMessage(err instanceof ApiError ? err.message : "Không tải được báo cáo.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const visible = filter === "ALL" ? reports : reports.filter((r) => r.status === filter);
  const filters: { id: typeof filter; label: string }[] = [
    { id: "ALL", label: `Tất cả (${reports.length})` },
    { id: "OPEN", label: "Đang xử lý" },
    { id: "RESOLVED", label: "Đã xử lý" },
    { id: "DISMISSED", label: "Đã bỏ qua" },
  ];

  return (
    <div className="opacity-0 animate-fade-in-up bg-white rounded-[20px] shadow-[0_10px_40px_-10px_rgba(43,33,24,0.07)] border border-[#dbc1b9]/30 overflow-hidden">
      <div className="p-6 border-b border-[#f2dfd1]">
        <h3 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[#231a11] mb-1">
          Báo cáo của tôi
        </h3>
        <p className="text-sm text-[#88726c]">
          Theo dõi các khiếu nại bạn đã gửi và kết quả xử lý từ đội ngũ REWORE.
        </p>
        {message && <p className="text-sm text-[#ba1a1a] mt-2">{message}</p>}
        <div className="flex flex-wrap gap-2 mt-4">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                filter === f.id ? "bg-[#974226] text-white" : "bg-[#fff8f5] text-[#55443d] border border-[#dbc1b9]/60 hover:border-[#974226]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center gap-3 text-[#88726c]">
          <span className="material-symbols-outlined text-4xl text-[#974226] animate-spin">progress_activity</span>
          <p className="text-sm">Đang tải báo cáo...</p>
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-20 px-4">
          <span className="material-symbols-outlined text-[64px] text-[#dbc1b9] mb-4">flag</span>
          <h3 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[#231a11] mb-2">
            Chưa có báo cáo nào
          </h3>
          <p className="text-[#88726c] max-w-sm text-sm leading-relaxed">
            Nếu gặp vấn đề với đơn hàng, bạn có thể gửi báo cáo từ tab Orders &amp; Returns.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[#f2dfd1]">
          {visible.map((report) => {
            const status = STATUS_STYLE[report.status] ?? STATUS_STYLE.OPEN;
            const href = targetHref(report);
            return (
              <div key={report.id} className="p-5 hover:bg-[#fff8f5] transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-start gap-3 justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-xs text-[#88726c] mb-1">
                      <span className="material-symbols-outlined text-base">
                        {report.targetType === "ORDER" ? "receipt_long" : report.targetType === "PRODUCT" ? "checkroom" : "person"}
                      </span>
                      <span className="font-semibold uppercase tracking-wider">
                        {TARGET_LABEL[report.targetType ?? "USER"]}
                      </span>
                      <span>·</span>
                      <span>{formatDate(report.createdAt)}</span>
                    </div>
                    <h4 className="text-base font-semibold text-[#231a11] break-words">{report.reason}</h4>
                    {report.description && (
                      <p className="text-sm text-[#55443d] mt-1 break-words">{report.description}</p>
                    )}
                    {report.seller && (
                      <p className="text-xs text-[#88726c] mt-2">Người bán: {sellerDisplayName(report.seller)}</p>
                    )}
                    {href && (
                      <Link href={href} className="inline-flex items-center gap-1 text-xs font-semibold text-[#974226] mt-2 hover:underline">
                        Xem {TARGET_LABEL[report.targetType ?? "USER"]?.toLowerCase()}
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </Link>
                    )}
                  </div>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold shrink-0 ${status.className}`}>
                    <span className="material-symbols-outlined text-sm">{status.icon}</span>
                    {status.label}
                  </span>
                </div>

                {report.status !== "OPEN" && (report.resolutionAction || report.resolutionNote) && (
                  <div className="mt-3 rounded-xl bg-[#fff8f5] border border-[#dbc1b9]/50 p-3 text-sm">
                    {report.resolutionAction && (
                      <p className="font-semibold text-[#556138]">
                        Kết quả: {ACTION_LABEL[report.resolutionAction] ?? report.resolutionAction}
                      </p>
                    )}
                    {report.resolutionNote && <p className="text-[#55443d] mt-1">{report.resolutionNote}</p>}
                    <p className="text-xs text-[#88726c] mt-1">Cập nhật: {formatDate(report.updatedAt)}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
