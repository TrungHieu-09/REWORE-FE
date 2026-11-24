"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import BankQr from "@/app/components/BankQr";
import { ApiError, ordersApi, reportsApi, sellerDisplayName, type Order, type OrderStatus, type PaymentInfo } from "@/app/lib/api";

function formatVND(amount: number) {
  return "₫" + new Intl.NumberFormat("vi-VN").format(amount);
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Chờ thanh toán",
  CONFIRMED: "Đã thanh toán",
  PAID: "Đã thanh toán",
  SHIPPED: "Đang giao hàng",
  DELIVERED: "Đã giao",
  COMPLETED: "Hoàn tất",
  CANCELLED: "Đã huỷ",
  REFUNDED: "Đã hoàn tiền",
};

export default function TabOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [reportingId, setReportingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);

  useEffect(() => {
    ordersApi
      .paymentInfo()
      .then((res) => setPaymentInfo(res.data))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    let cancelled = false;

    ordersApi
      .list({ role: "buyer", limit: 50 })
      .then((res) => {
        if (!cancelled) setOrders(res.data);
      })
      .catch((err) => {
        if (!cancelled) {
          setMessage(err instanceof ApiError ? err.message : "Could not load orders.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Có đơn đang chờ thanh toán thì tự tải lại mỗi 5 giây để thấy khi tiền về.
  const hasUnpaid = orders.some((o) => o.status === "PENDING" && (o.paymentStatus ?? "UNPAID") === "UNPAID");
  useEffect(() => {
    if (!hasUnpaid) return;
    const timer = window.setInterval(() => {
      ordersApi.list({ role: "buyer", limit: 50 }).then((res) => setOrders(res.data)).catch(() => undefined);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [hasUnpaid]);

  const updateStatus = async (order: Order, status: OrderStatus) => {
    if (status === order.status || status === "PENDING") return;
    setUpdatingId(order.id);

    try {
      const res = await ordersApi.updateStatus(order.id, status);
      setOrders((prev) => prev.map((item) => (item.id === order.id ? res.data : item)));
      setMessage("Order status updated.");
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Could not update order.");
    } finally {
      setUpdatingId(null);
    }
  };

  const reportOrder = async (order: Order) => {
    setReportingId(order.id);
    setMessage("");
    try {
      const res = await reportsApi.create({
        targetType: "ORDER",
        targetId: order.id,
        reason: `Khiếu nại đơn hàng ${order.id}`,
        description: `Sản phẩm: ${order.product?.title ?? "Order item"}`,
      });
      setMessage(res.message);
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Không thể gửi report.");
    } finally {
      setReportingId(null);
    }
  };

  return (
    <div className="opacity-0 animate-fade-in-up bg-white rounded-[20px] shadow-[0_10px_40px_-10px_rgba(43,33,24,0.07)] border border-[#dbc1b9]/30 overflow-hidden">
      <div className="p-6 border-b border-[#f2dfd1]">
        <h3 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[#231a11] mb-1">
          Orders
        </h3>
        <p className="text-sm text-[#88726c]">
          {loading ? "Loading orders..." : `${orders.length} order${orders.length !== 1 ? "s" : ""}`}
        </p>
        {message && <p className="text-sm text-[#974226] mt-2">{message}</p>}
      </div>

      {!loading && orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-24 px-4">
          <span className="material-symbols-outlined text-[64px] text-[#dbc1b9] mb-4">
            inventory_2
          </span>
          <h3 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[#231a11] mb-2">
            No Orders Yet
          </h3>
          <p className="text-[#88726c] max-w-sm text-sm leading-relaxed">
            You haven&apos;t won any auctions or placed any orders recently.
          </p>
          <a href="/auctions" className="mt-6 px-7 py-2.5 bg-[#974226] text-white rounded-full text-sm font-semibold hover:bg-[#b65a3c] transition-colors shadow-sm">
            Explore Auctions
          </a>
        </div>
      ) : (
        <div className="divide-y divide-[#f2dfd1]">
          {orders.map((order) => {
            const product = order.product;
            const image = product?.images?.[0];
            return (
              <div key={order.id} className="p-5 flex flex-col sm:flex-row gap-4 hover:bg-[#fff8f5] transition-colors">
                <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-[#feeadc] shrink-0">
                  {image ? (
                    <Image src={image} alt={product?.title ?? "Order item"} fill className="object-cover" />
                  ) : (
                    <div className="admin-image-placeholder h-full">
                      <span className="material-symbols-outlined">image_not_supported</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-base font-semibold text-[#231a11] truncate">{product?.title ?? "Order item"}</h4>
                  <p className="text-sm text-[#88726c] mt-1">Seller: {sellerDisplayName(order.seller)}</p>
                  <p className="font-[family-name:var(--font-playfair)] text-xl font-bold text-[#231a11] mt-3">
                    {formatVND(order.totalPrice + order.shippingFee)}
                  </p>
                  <p className="text-xs text-[#88726c] mt-2">
                    Thanh toán: {order.paymentStatus ?? "UNPAID"}
                  </p>
                  {(order.paymentStatus ?? "UNPAID") === "UNPAID" && order.status === "PENDING" && (
                    <div className="mt-3 rounded-xl border border-[#f3cca0] bg-[#fff8f0] p-3 text-xs text-[#55443d] space-y-1">
                      <p className="font-semibold text-[#7b4a10]">Chuyển khoản cho REWORE để thanh toán</p>
                      {paymentInfo?.configured ? (
                        <>
                          <BankQr info={paymentInfo} amount={order.totalPrice + order.shippingFee} memo={`${paymentInfo.memoPrefix}${order.id.slice(-8).toUpperCase()}`} />
                          <p className="text-center">Số tiền: <strong>{formatVND(order.totalPrice + order.shippingFee)}</strong></p>
                        </>
                      ) : (
                        <p>Sàn chưa cấu hình tài khoản nhận tiền. Vui lòng liên hệ admin.</p>
                      )}
                      <p className="text-[#88726c]">Đơn chưa thanh toán sau 24 giờ sẽ tự huỷ và bị trừ điểm uy tín. Đơn tự cập nhật khi sàn nhận được tiền, không cần gửi bill.</p>
                    </div>
                  )}
                </div>
                <div className="sm:w-52 flex flex-col gap-2 justify-center">
                  <span className="inline-flex justify-center px-3 py-1 rounded-full bg-[#f2dfd1] text-[#55443d] text-xs font-semibold">
                    {STATUS_LABEL[order.status] ?? order.status}
                  </span>
                  <Link href={`/orders/${order.id}`} className="admin-pill admin-pill-accent justify-center">
                    Xem chi tiết
                  </Link>
                  {order.status === "PENDING" && (order.paymentStatus ?? "UNPAID") === "UNPAID" && (
                    <button
                      className="admin-pill admin-pill-muted justify-center"
                      disabled={updatingId === order.id}
                      onClick={() => {
                        if (window.confirm("Huỷ đơn hàng này? Sản phẩm sẽ được mở lại cho người khác mua.")) updateStatus(order, "CANCELLED");
                      }}
                    >
                      Huỷ đơn
                    </button>
                  )}
                  {(order.status === "SHIPPED" || order.status === "DELIVERED") && (
                    <button
                      className="admin-pill admin-pill-green justify-center"
                      disabled={updatingId === order.id}
                      onClick={() => updateStatus(order, "COMPLETED")}
                    >
                      Đã nhận hàng, hoàn tất
                    </button>
                  )}
                  {order.status !== "COMPLETED" && order.status !== "REFUNDED" && order.status !== "CANCELLED" && (
                    <button
                      className="admin-pill admin-pill-muted justify-center"
                      disabled={reportingId === order.id}
                      onClick={() => reportOrder(order)}
                    >
                      Report
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


