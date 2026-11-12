"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiError, sellerApi, type SellerSalesReport } from "../../lib/api";

const vnd = (value: number) => `₫${new Intl.NumberFormat("vi-VN").format(Math.round(value))}`;
const monthLabel = (month: string) => {
  const [year, m] = month.split("-");
  return `${m}/${year}`;
};
const dateLabel = (value: string) => new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value));

const RANGES = [3, 6, 12];

export default function SellerReportsPage() {
  const [months, setMonths] = useState(6);
  const [report, setReport] = useState<SellerSalesReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    sellerApi
      .reports(months)
      .then((res) => {
        if (cancelled) return;
        setReport(res.data);
        setError("");
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Không tải được báo cáo.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [months]);

  const maxGross = Math.max(1, ...(report?.monthly.map((item) => item.gross) ?? [1]));

  const cards = report
    ? [
        { label: "Doanh thu (giá hàng)", value: vnd(report.totals.gross), sub: `${report.totals.orders} đơn hoàn tất` },
        { label: `Phí sàn (${report.feeRate}%)`, value: vnd(report.totals.fee), sub: "Đã trừ vào tiền thanh toán" },
        { label: "Tiền bạn nhận", value: vnd(report.totals.net), sub: "Sau khi trừ phí sàn" },
        { label: "Chờ sàn chuyển khoản", value: vnd(report.totals.pendingPayout), sub: `Đã chuyển: ${vnd(report.totals.paidOut)}` },
      ]
    : [];

  return (
    <div className="max-w-5xl mx-auto py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#231a11]" style={{ fontFamily: "'Playfair Display', serif" }}>
            Báo cáo doanh thu
          </h1>
          <p className="text-sm text-[#655d52] mt-1">
            Tính trên các đơn đã hoàn tất. Phí sàn được trừ vào tiền sàn chuyển cho shop, bạn không phải trả trước.
          </p>
        </div>
        <div className="flex gap-2">
          {RANGES.map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => {
                setLoading(true);
                setMonths(range);
              }}
              className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
                months === range
                  ? "bg-[#974226] text-white border-[#974226]"
                  : "border-[#dbc1b9] text-[#55433d] hover:bg-[#feeadc]"
              }`}
            >
              {range} tháng
            </button>
          ))}
        </div>
      </div>

      {error && <p className="mb-4 rounded-xl bg-[#ffdad6] px-4 py-3 text-sm text-[#93000a]">{error}</p>}

      {loading && !report ? (
        <p className="text-sm text-[#88726c]">Đang tải...</p>
      ) : report ? (
        <div className="space-y-6">
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((card) => (
              <div key={card.label} className="bg-white rounded-2xl border border-[#dbc1b9]/30 p-5 shadow-sm">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#974226] mb-2">{card.label}</p>
                <p className="text-[22px] font-bold text-[#231a11]">{card.value}</p>
                <p className="text-xs text-[#88726c] mt-1">{card.sub}</p>
              </div>
            ))}
          </section>

          <section className="bg-white rounded-2xl border border-[#dbc1b9]/30 p-6 shadow-sm">
            <h2 className="text-base font-semibold text-[#231a11] mb-4">Theo tháng</h2>
            <div className="space-y-3">
              {report.monthly.map((item) => (
                <div key={item.month} className="grid grid-cols-[64px_1fr_auto] items-center gap-3 text-sm">
                  <span className="text-[#55433d] font-medium">{monthLabel(item.month)}</span>
                  <div className="h-3 rounded-full bg-[#f2dfd1] overflow-hidden">
                    <div className="h-full rounded-full bg-[#974226]" style={{ width: `${(item.gross / maxGross) * 100}%` }} />
                  </div>
                  <span className="text-[#231a11] text-right">
                    {vnd(item.gross)} <span className="text-[#88726c]">· nhận {vnd(item.net)} · {item.orders} đơn</span>
                  </span>
                </div>
              ))}
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="bg-white rounded-2xl border border-[#dbc1b9]/30 p-6 shadow-sm">
              <h2 className="text-base font-semibold text-[#231a11] mb-4">Sản phẩm bán chạy</h2>
              {report.topProducts.length === 0 ? (
                <p className="text-sm text-[#88726c]">Chưa có đơn hoàn tất trong khoảng này.</p>
              ) : (
                <ol className="space-y-3">
                  {report.topProducts.map((product, index) => (
                    <li key={product.productId} className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-[#231a11] truncate">
                        {index + 1}. {product.title}
                      </span>
                      <span className="text-[#55433d] shrink-0">
                        {vnd(product.gross)} · {product.orders} đơn
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            <section className="bg-white rounded-2xl border border-[#dbc1b9]/30 p-6 shadow-sm">
              <h2 className="text-base font-semibold text-[#231a11] mb-4">Đối soát tiền thanh toán</h2>
              {report.recentSettled.length === 0 ? (
                <p className="text-sm text-[#88726c]">Chưa có đơn hoàn tất.</p>
              ) : (
                <ul className="space-y-3">
                  {report.recentSettled.map((order) => (
                    <li key={order.id} className="text-sm border-b border-[#f2dfd1] pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[#231a11] truncate">{order.title}</span>
                        <span className="font-semibold text-[#231a11] shrink-0">{vnd(order.sellerPayoutAmount)}</span>
                      </div>
                      <p className="text-xs text-[#88726c] mt-0.5">
                        {dateLabel(order.createdAt)} · giá {vnd(order.totalPrice)} − phí {vnd(order.platformFeeAmount)} ·{" "}
                        {order.payoutPaidAt ? (
                          <span className="text-[#556138] font-semibold">Đã chuyển {dateLabel(order.payoutPaidAt)}</span>
                        ) : (
                          <span className="text-[#974226] font-semibold">Chờ sàn chuyển khoản</span>
                        )}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <p className="text-xs text-[#88726c]">
            Muốn đối chiếu chi tiết từng đơn? Xem <Link href="/seller/orders" className="text-[#974226] font-semibold hover:underline">Orders</Link>.
          </p>
        </div>
      ) : null}
    </div>
  );
}
