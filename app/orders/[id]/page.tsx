"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import BankQr from "../../components/BankQr";
import Footer from "../../components/Footer";
import Navbar from "../../components/Navbar";
import UserAvatar from "../../components/UserAvatar";
import { useAuth } from "../../context/AuthContext";
import {
  ApiError,
  apiAssetUrl,
  conversationsApi,
  ordersApi,
  sellerDisplayName,
  type Order,
  type OrderStatus,
  type PaymentInfo,
} from "../../lib/api";

const formatVnd = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(amount);

const formatDateTime = (iso?: string | null) =>
  iso
    ? new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" }).format(
        new Date(iso)
      )
    : "";

const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Chờ thanh toán",
  CONFIRMED: "Đã thanh toán",
  PAID: "Đã thanh toán",
  SHIPPED: "Đang giao hàng",
  DELIVERED: "Đã giao tới bạn",
  COMPLETED: "Hoàn tất",
  CANCELLED: "Đã huỷ",
  REFUNDED: "Đã hoàn tiền",
};

const STATUS_TONE: Record<OrderStatus, string> = {
  PENDING: "bg-[#fff2de] text-[#8b4c09]",
  CONFIRMED: "bg-[#dae9b5]/70 text-[#3f4b25]",
  PAID: "bg-[#dae9b5]/70 text-[#3f4b25]",
  SHIPPED: "bg-[#ffdbd0]/70 text-[#7b2e14]",
  DELIVERED: "bg-[#ffdbd0]/70 text-[#7b2e14]",
  COMPLETED: "bg-[#dae9b5] text-[#3f4b25]",
  CANCELLED: "bg-[#ffdad6] text-[#93000a]",
  REFUNDED: "bg-[#ffdad6] text-[#93000a]",
};

// Dòng giải thích bước hiện tại: ai đang cần làm gì.
const nextHint = (order: Order, isBuyer: boolean) => {
  switch (order.status) {
    case "PENDING":
      return isBuyer ? "Chuyển khoản theo mã QR bên dưới. Đơn tự cập nhật khi sàn nhận được tiền." : "Đang chờ người mua thanh toán.";
    case "CONFIRMED":
    case "PAID":
      return isBuyer ? "Sàn đã nhận tiền. Đang chờ người bán gửi hàng cho bạn." : "Người mua đã thanh toán. Hãy chuẩn bị và gửi hàng.";
    case "SHIPPED":
      return isBuyer ? "Hàng đang trên đường tới bạn. Nhận được thì bấm \"Đã nhận hàng\" để hoàn tất." : "Đã gửi hàng. Chờ người mua xác nhận đã nhận.";
    case "DELIVERED":
      return isBuyer ? "Hàng đã giao. Kiểm tra rồi bấm \"Đã nhận hàng\" để sàn chuyển tiền cho người bán." : "Hàng đã giao. Chờ người mua xác nhận.";
    case "COMPLETED":
      return "Đơn đã hoàn tất. Cảm ơn bạn đã mua sắm tại REWORE.";
    case "CANCELLED":
      return "Đơn này đã bị huỷ.";
    case "REFUNDED":
      return "Đơn này đã được hoàn tiền.";
    default:
      return "";
  }
};

const parseShipping = (value?: string | null) => {
  const lines = (value ?? "").split("\n");
  const pick = (prefix: string) => lines.find((line) => line.startsWith(prefix))?.slice(prefix.length).trim() ?? "";
  const name = pick("Người nhận:");
  const phone = pick("SĐT:");
  const address = pick("Địa chỉ:");
  return name || phone || address ? { name, phone, address } : { name: "", phone: "", address: value ?? "" };
};

type Step = { key: string; label: string; at?: string | null; done: boolean };

const buildSteps = (order: Order): Step[] => {
  const paid = order.paymentStatus === "PAID" || ["CONFIRMED", "PAID", "SHIPPED", "DELIVERED", "COMPLETED"].includes(order.status);
  const shipped = Boolean(order.shippedAt) || ["SHIPPED", "DELIVERED", "COMPLETED"].includes(order.status);
  const delivered = Boolean(order.deliveredAt) || ["DELIVERED", "COMPLETED"].includes(order.status);
  const completed = order.status === "COMPLETED";
  return [
    { key: "placed", label: "Đã đặt hàng", at: order.createdAt, done: true },
    { key: "paid", label: "Đã thanh toán", at: order.paidAt, done: paid },
    { key: "shipped", label: "Người bán đã gửi hàng", at: order.shippedAt, done: shipped },
    { key: "delivered", label: "Đã giao tới bạn", at: order.deliveredAt, done: delivered },
    { key: "completed", label: "Hoàn tất", at: completed ? order.updatedAt : null, done: completed },
  ];
};

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const orderId = String(params?.id ?? "");
  const router = useRouter();
  const { user, isLoggedIn, isLoading: authLoading } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [proofMessage, setProofMessage] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await ordersApi.get(orderId);
      setOrder(res.data);
      setError("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không tải được đơn hàng.");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn) {
      router.replace("/login");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    ordersApi
      .paymentInfo()
      .then((res) => setPaymentInfo(res.data))
      .catch(() => undefined);
  }, [authLoading, isLoggedIn, load, router]);

  const status = order?.status;
  const finished = status === "COMPLETED" || status === "CANCELLED" || status === "REFUNDED";

  // Đơn chưa kết thúc thì tự tải lại mỗi 6 giây để thấy tiến độ mới.
  useEffect(() => {
    if (!order || finished) return;
    const timer = window.setInterval(() => void load(), 6000);
    return () => window.clearInterval(timer);
  }, [order, finished, load]);

  const isBuyer = Boolean(order && user && order.buyerId === user.id);

  const changeStatus = async (next: OrderStatus, confirmText?: string) => {
    if (!order) return;
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(true);
    setMessage("");
    try {
      const res = await ordersApi.updateStatus(order.id, next);
      setOrder(res.data);
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Không thể cập nhật đơn hàng.");
    } finally {
      setBusy(false);
    }
  };

  const chatWithSeller = async () => {
    if (!order) return;
    try {
      const res = await conversationsApi.start({ sellerId: order.sellerId, productId: order.productId ?? undefined });
      router.push(`/messages?c=${res.data.id}`);
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Không thể mở cuộc trò chuyện.");
    }
  };

  const handleUploadProof = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !order) return;
    setUploadingProof(true);
    setProofMessage("");
    setMessage("");
    try {
      const res = await ordersApi.uploadPaymentProof(order.id, file);
      setOrder(res.data);
      setProofMessage(res.message || "Đã tải lên ảnh minh chứng thanh toán.");
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Không thể tải lên ảnh minh chứng.");
    } finally {
      setUploadingProof(false);
      e.target.value = "";
    }
  };

  const total = order ? order.totalPrice + order.shippingFee : 0;
  const memo = order ? `${paymentInfo?.memoPrefix ?? "RW-"}${order.id.slice(-8).toUpperCase()}` : "";
  const shipping = parseShipping(order?.shippingAddress);
  const image = order?.product?.images?.[0] ? apiAssetUrl(order.product.images[0]) : "";
  const steps = order ? buildSteps(order) : [];
  const lastDone = steps.reduce((acc, step, index) => (step.done ? index : acc), 0);
  const stopped = status === "CANCELLED" || status === "REFUNDED";
  const unpaid = order?.status === "PENDING" && (order.paymentStatus ?? "UNPAID") === "UNPAID";

  return (
    <div className="bg-[#fff8f5] text-[#231a11] min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow w-full max-w-[1100px] mx-auto px-5 sm:px-6 pt-28 pb-12">
        <div className="mb-6 flex items-center gap-3 text-sm text-[#55433d]">
          <Link href="/profile#orders" className="hover:text-[#974226]">Đơn hàng của tôi</Link>
          <span className="text-[#dbc1b9]">/</span>
          <span className="text-[#974226] font-semibold">Chi tiết đơn</span>
        </div>

        {loading || authLoading ? (
          <p className="text-sm text-[#88726c]">Đang tải...</p>
        ) : !order ? (
          <div className="text-center py-16">
            <p className="text-sm text-[#ba1a1a] mb-4">{error || "Không tìm thấy đơn hàng."}</p>
            <Link href="/profile#orders" className="px-6 py-2.5 rounded-full bg-[#974226] text-white text-sm font-semibold">Về danh sách đơn</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 space-y-6">
              <section className="bg-white rounded-3xl border border-[#dbc1b9]/40 shadow-sm p-6 md:p-8">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                  <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold">Đơn {memo}</h1>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_TONE[order.status]}`}>{STATUS_LABEL[order.status]}</span>
                </div>
                <p className="text-xs text-[#88726c] mb-4">Đặt lúc {formatDateTime(order.createdAt)}</p>
                <p className="text-sm text-[#55433d] rounded-2xl bg-[#fff1e8] border border-[#feeadc] px-4 py-3">{nextHint(order, isBuyer)}</p>

                {!stopped && (
                  <ol className="mt-6">
                    {steps.map((step, index) => {
                      const current = index === lastDone + 1 && !finished;
                      return (
                        <li key={step.key} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <span
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                step.done
                                  ? "bg-[#556138] text-white"
                                  : current
                                  ? "bg-white border-2 border-[#974226] text-[#974226]"
                                  : "bg-[#feeadc] text-[#88726c] border border-[#dbc1b9]"
                              }`}
                            >
                              {step.done ? <span className="material-symbols-outlined text-[16px]">check</span> : index + 1}
                            </span>
                            {index < steps.length - 1 && <span className={`w-0.5 flex-1 min-h-8 ${step.done && steps[index + 1].done ? "bg-[#556138]" : "bg-[#dbc1b9]"}`} />}
                          </div>
                          <div className="pb-6">
                            <p className={`text-sm font-semibold ${step.done || current ? "text-[#231a11]" : "text-[#88726c]"}`}>{step.label}</p>
                            <p className="text-xs text-[#88726c]">
                              {step.done ? formatDateTime(step.at) || "Đã xong" : current ? "Đang chờ bước này" : ""}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </section>

              {unpaid && isBuyer && (
                <section className="bg-white rounded-3xl border border-[#dbc1b9]/40 shadow-sm p-6 md:p-8">
                  <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold mb-4">Thanh toán</h2>
                  {paymentInfo?.configured ? (
                    <>
                      <BankQr info={paymentInfo} amount={total} memo={memo} />
                      <p className="mt-3 text-center text-sm">Số tiền: <strong>{formatVnd(total)}</strong></p>
                    </>
                  ) : (
                    <p className="text-sm text-[#8b4c09]">Sàn chưa cấu hình tài khoản nhận tiền. Vui lòng liên hệ admin.</p>
                  )}
                  <div className="mt-5 pt-5 border-t border-[#f2dfd1] flex flex-col items-center gap-2 text-center">
                    <p className="text-xs text-[#55433d]">
                      Nếu đã chuyển khoản nhưng đơn chưa tự cập nhật, bạn có thể gửi ảnh bill để Admin kiểm tra:
                    </p>
                    <label className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#974226] text-[#974226] hover:bg-[#feeadc] text-xs font-semibold cursor-pointer transition-colors">
                      <span className="material-symbols-outlined text-[16px]">upload_file</span>
                      <span>{uploadingProof ? "Đang tải lên..." : order.qrCodeRef ? "Cập nhật ảnh bill" : "Tải lên ảnh bill"}</span>
                      <input type="file" accept="image/*" className="hidden" disabled={uploadingProof} onChange={handleUploadProof} />
                    </label>
                    {proofMessage && <p className="text-xs font-medium text-[#556138]">{proofMessage}</p>}
                    {order.qrCodeRef && (
                      <a href={apiAssetUrl(order.qrCodeRef)} target="_blank" rel="noreferrer" className="text-xs text-[#974226] font-semibold hover:underline">
                        Xem ảnh bill đã gửi
                      </a>
                    )}
                  </div>
                  <p className="mt-4 text-xs text-[#88726c] text-center">Đơn chưa thanh toán sau 24 giờ sẽ tự huỷ và bị trừ điểm uy tín.</p>
                </section>
              )}

              <section className="bg-white rounded-3xl border border-[#dbc1b9]/40 shadow-sm p-6 md:p-8">
                <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold mb-4">Thông tin nhận hàng</h2>
                <dl className="space-y-3 text-sm">
                  {shipping.name && (
                    <div className="flex justify-between gap-4"><dt className="text-[#55433d]">Người nhận</dt><dd className="font-semibold text-right">{shipping.name}</dd></div>
                  )}
                  {shipping.phone && (
                    <div className="flex justify-between gap-4"><dt className="text-[#55433d]">Số điện thoại</dt><dd className="font-semibold text-right">{shipping.phone}</dd></div>
                  )}
                  <div className="flex justify-between gap-4"><dt className="text-[#55433d]">Địa chỉ</dt><dd className="font-semibold text-right whitespace-pre-line">{shipping.address || "Chưa có"}</dd></div>
                  {order.note && (
                    <div className="flex justify-between gap-4"><dt className="text-[#55433d]">Ghi chú</dt><dd className="text-right">{order.note}</dd></div>
                  )}
                </dl>
              </section>
            </div>

            <aside className="lg:col-span-5 lg:sticky lg:top-28 space-y-6">
              <div className="bg-white rounded-3xl border border-[#dbc1b9]/40 shadow-sm p-6 md:p-8">
                <h3 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold mb-5">Sản phẩm</h3>
                <div className="flex gap-4 pb-5 border-b border-[#f2dfd1]">
                  <div className="relative w-24 h-28 rounded-2xl overflow-hidden bg-[#feeadc] shrink-0">
                    {image && <Image src={image} alt={order.product?.title ?? "Sản phẩm"} fill className="object-cover" sizes="96px" />}
                  </div>
                  <div className="min-w-0">
                    {order.product ? (
                      <Link href={`/products/${order.product.id}`} className="font-bold line-clamp-2 hover:text-[#974226]">{order.product.title}</Link>
                    ) : (
                      <p className="font-bold">Sản phẩm</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <UserAvatar name={sellerDisplayName(order.seller)} avatar={order.seller?.avatar} size={24} />
                      <span className="text-xs text-[#55433d] truncate">{sellerDisplayName(order.seller)}</span>
                    </div>
                  </div>
                </div>

                <div className="py-5 space-y-3 text-sm text-[#55433d]">
                  <div className="flex justify-between"><span>Giá sản phẩm</span><span className="text-[#231a11] font-medium">{formatVnd(order.totalPrice)}</span></div>
                  <div className="flex justify-between"><span>Phí vận chuyển</span><span className="text-[#231a11] font-medium">{order.shippingFee > 0 ? formatVnd(order.shippingFee) : "Miễn phí"}</span></div>
                  <div className="pt-3 border-t border-[#f2dfd1] flex justify-between items-baseline">
                    <span className="font-[family-name:var(--font-playfair)] text-xl font-bold">Tổng cộng</span>
                    <span className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[#974226]">{formatVnd(total)}</span>
                  </div>
                  <div className="flex justify-between text-xs"><span>Thanh toán</span><span>{order.paymentStatus === "PAID" ? `Đã thanh toán ${formatDateTime(order.paidAt)}` : order.paymentStatus === "REFUNDED" ? "Đã hoàn tiền" : "Chưa thanh toán"}</span></div>
                  {order.qrCodeRef && (
                    <div className="flex justify-between text-xs">
                      <span>Ảnh minh chứng</span>
                      <a href={apiAssetUrl(order.qrCodeRef)} target="_blank" rel="noreferrer" className="text-[#974226] font-semibold hover:underline">
                        Xem ảnh
                      </a>
                    </div>
                  )}
                </div>

                {message && <p className="mb-4 rounded-xl bg-[#ffdad6] px-4 py-3 text-sm text-[#93000a]">{message}</p>}

                <div className="space-y-3">
                  {isBuyer && (order.status === "SHIPPED" || order.status === "DELIVERED") && (
                    <button
                      disabled={busy}
                      onClick={() => changeStatus("COMPLETED", "Xác nhận bạn đã nhận được hàng? Sàn sẽ chuyển tiền cho người bán.")}
                      className="w-full py-3.5 rounded-2xl bg-[#556138] hover:bg-[#6d7a4f] text-white text-sm font-semibold disabled:opacity-60 transition-colors"
                    >
                      Đã nhận hàng, hoàn tất
                    </button>
                  )}
                  {isBuyer && unpaid && (
                    <button
                      disabled={busy}
                      onClick={() => changeStatus("CANCELLED", "Huỷ đơn hàng này? Sản phẩm sẽ được mở lại cho người khác mua.")}
                      className="w-full py-3.5 rounded-2xl border border-[#dbc1b9] text-[#55433d] hover:bg-[#feeadc] text-sm font-semibold disabled:opacity-60 transition-colors"
                    >
                      Huỷ đơn
                    </button>
                  )}
                  {isBuyer && (
                    <button
                      onClick={chatWithSeller}
                      className="w-full py-3.5 rounded-2xl border border-[#974226] text-[#974226] hover:bg-[#feeadc] text-sm font-semibold transition-colors"
                    >
                      Nhắn tin cho người bán
                    </button>
                  )}
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
