"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { EmptyState, LoadingSkeleton } from "../../components/admin/AdminStates";
import { StatusBadge, orderStatusTone } from "../../components/admin/StatusBadge";
import { useAuth } from "../../context/AuthContext";
import { ApiError, apiAssetUrl, ordersApi, sellerDisplayName, type Order } from "../../lib/api";

function formatVnd(amount: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function SellerOrdersPage() {
  const { user, isLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState("");

  const sellerStatus = user?.sellerStatus ?? (user?.role === "SELLER" ? "APPROVED" : "NONE");
  const isSeller = user?.role === "SELLER" && sellerStatus === "APPROVED";

  useEffect(() => {
    if (!user?.id || !isSeller) return;
    let cancelled = false;

    ordersApi
      .list({ role: "seller", limit: 80 })
      .then((res) => {
        if (!cancelled) setOrders(res.data);
      })
      .catch((err) => {
        if (!cancelled) setMessage(err instanceof ApiError ? err.message : "Không tải được đơn hàng.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isSeller, user?.id]);

  const markShipped = async (order: Order) => {
    setBusyId(order.id);
    setMessage("");
    try {
      const res = await ordersApi.updateStatus(order.id, "SHIPPED");
      setOrders((items) => items.map((item) => (item.id === order.id ? res.data : item)));
      setMessage("Đã cập nhật trạng thái giao hàng.");
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Không thể cập nhật đơn hàng.");
    } finally {
      setBusyId("");
    }
  };

  return (
    <div className="seller-create-root">
        <main className="seller-create-layout">
          {!isLoading && !isSeller ? (
            <section className="seller-create-locked">
              <span className="material-symbols-outlined">lock</span>
              <h1>Seller orders locked</h1>
              <p>Bạn cần được duyệt seller trước khi quản lý đơn hàng.</p>
              <Link href="/profile/become-seller/status">Xem trạng thái seller</Link>
            </section>
          ) : (
            <div className="seller-listings-page">
              <header className="seller-create-head">
                <div>
                  <div className="seller-create-kicker">
                    <span className="material-symbols-outlined">receipt_long</span>
                    Seller Orders
                  </div>
                  <h1>Quản lý đơn hàng</h1>
                  <p>Gửi hàng sau khi admin xác nhận thanh toán.</p>
                  {message && <p className="seller-listing-error">{message}</p>}
                </div>
                <Link href="/seller/dashboard" className="seller-add-listing">
                  <span className="material-symbols-outlined">arrow_back</span>
                  Dashboard
                </Link>
              </header>

              {loading || isLoading ? (
                <LoadingSkeleton rows={4} />
              ) : orders.length === 0 ? (
                <EmptyState icon="receipt_long" title="Chưa có đơn hàng" desc="Đơn mới sẽ xuất hiện sau khi buyer mua sản phẩm." />
              ) : (
                <section className="seller-listing-list">
                  {orders.map((order) => {
                    const image = apiAssetUrl(order.product?.images?.[0]);
                    const canShip = order.paymentStatus === "PAID" && (order.status === "CONFIRMED" || order.status === "PAID");
                    return (
                      <article className="seller-listing-card" key={order.id}>
                        <div className="seller-listing-image">
                          {image ? (
                            <Image src={image} alt={order.product?.title ?? "Order item"} fill style={{ objectFit: "cover" }} sizes="160px" />
                          ) : (
                            <div className="seller-listing-image-fallback">
                              <span className="material-symbols-outlined">image_not_supported</span>
                            </div>
                          )}
                        </div>
                        <div className="seller-listing-body">
                          <div className="seller-listing-main">
                            <div>
                              <h2>{order.product?.title ?? "Order item"}</h2>
                              <p>Buyer: {sellerDisplayName(order.buyer, order.buyerId)}</p>
                            </div>
                            <span className="sp-price">{formatVnd(order.totalPrice + order.shippingFee)}</span>
                          </div>
                          <div className="seller-listing-meta">
                            <StatusBadge label={order.status} tone={orderStatusTone(order.status)} />
                            <StatusBadge label={order.paymentStatus ?? "UNPAID"} tone={orderStatusTone(order.paymentStatus ?? "UNPAID")} />
                          </div>
                          <div className="seller-listing-actions">
                            <button
                              className="admin-pill admin-pill-green"
                              disabled={!canShip || busyId === order.id}
                              onClick={() => markShipped(order)}
                            >
                              <span className="material-symbols-outlined text-[16px]">local_shipping</span>
                              Đã giao hàng
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </section>
              )}
            </div>
          )}
        </main>
      </div>
  );
}
