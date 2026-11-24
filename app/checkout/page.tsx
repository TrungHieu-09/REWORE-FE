"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { bankQrUrl } from "@/app/components/BankQr";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import {
  ApiError,
  apiAssetUrl,
  ordersApi,
  productsApi,
  sellerDisplayName,
  type Order,
  type PaymentInfo,
  type Product,
} from "../lib/api";

const formatVnd = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(amount);

const formatCountdown = (seconds: number) =>
  `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

const formatHms = (seconds: number) =>
  [Math.floor(seconds / 3600), Math.floor((seconds % 3600) / 60), seconds % 60]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");

const inputClass =
  "w-full px-4 py-2.5 bg-white border border-[#dbc1b9]/60 rounded-xl text-sm text-[#231a11] focus:outline-none focus:border-[#231a11]";

function CheckoutContent() {
  const router = useRouter();
  const productId = useSearchParams().get("productId") ?? "";
  const { user, isLoggedIn, isLoading: authLoading } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  // Chỉ lưu những gì người dùng đã gõ; ô chưa gõ lấy mặc định từ hồ sơ.
  const [edits, setEdits] = useState<Partial<Record<"receiverName" | "receiverPhone" | "shippingAddress" | "note", string>>>({});
  const form = {
    receiverName: edits.receiverName ?? user?.name ?? "",
    receiverPhone: edits.receiverPhone ?? user?.phone ?? "",
    shippingAddress: edits.shippingAddress ?? user?.address ?? "",
    note: edits.note ?? "",
  };
  const [submitting, setSubmitting] = useState(false);
  const [placed, setPlaced] = useState<Order | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [copied, setCopied] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn) {
      router.replace("/login");
      return;
    }
    if (!productId) return;

    let cancelled = false;
    Promise.allSettled([productsApi.get(productId), ordersApi.paymentInfo()]).then(([productResult, paymentResult]) => {
      if (cancelled) return;
      if (productResult.status === "fulfilled") setProduct(productResult.value.data);
      else setError(productResult.reason instanceof ApiError ? productResult.reason.message : "Không tải được sản phẩm.");
      if (paymentResult.status === "fulfilled") setPaymentInfo(paymentResult.value.data);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [authLoading, isLoggedIn, productId, router]);

  useEffect(() => {
    if (!placed || placed.paymentStatus === "PAID") return;
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [placed]);

  useEffect(() => {
    if (!product?.hold?.heldByMe) return;
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [product?.hold?.heldByMe]);

  // Sau khi đặt đơn, hỏi server mỗi 4 giây xem tiền đã về chưa.
  const placedId = placed?.id;
  const placedPaid = placed?.paymentStatus === "PAID";
  useEffect(() => {
    if (!placedId || placedPaid) return;
    const timer = window.setInterval(() => {
      ordersApi.get(placedId).then((res) => setPlaced(res.data)).catch(() => undefined);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [placedId, placedPaid]);

  const update = (key: keyof typeof form, value: string) => setEdits((current) => ({ ...current, [key]: value }));

  const isOwn = Boolean(product && user?.id === product.sellerId);
  const heldByMe = Boolean(product?.hold?.heldByMe);
  const heldByOther = Boolean(product?.hold && !product.hold.heldByMe);
  const holdSeconds = product?.hold ? Math.max(0, Math.floor((new Date(product.hold.expiresAt).getTime() - nowMs) / 1000)) : 0;
  const buyable =
    !isOwn &&
    product?.status === "ACTIVE" &&
    (product.availabilityStatus === "available" || (heldByMe && holdSeconds > 0));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!product || !buyable) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await ordersApi.create({
        productId: product.id,
        receiverName: form.receiverName.trim(),
        receiverPhone: form.receiverPhone.trim(),
        shippingAddress: form.shippingAddress.trim(),
        note: form.note.trim() || undefined,
      });
      setPlaced(res.data);
    } catch (err) {
      if (err instanceof ApiError) {
        const first = err.errors ? Object.values(err.errors)[0]?.[0] : undefined;
        setError(first ?? err.message);
      } else {
        setError("Không thể tạo đơn hàng.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const total = placed ? placed.totalPrice + placed.shippingFee : 0;
  const unpaidHours = 24;
  const unpaidSeconds = placed
    ? Math.max(0, Math.floor((new Date(placed.createdAt).getTime() + unpaidHours * 3600000 - nowMs) / 1000))
    : 0;
  const qrSrc = placed && paymentInfo?.configured ? bankQrUrl(paymentInfo, total, `${paymentInfo.memoPrefix}${placed.id.slice(-8).toUpperCase()}`) : "";

  const copy = (key: string, value: string) => {
    navigator.clipboard
      ?.writeText(value)
      .then(() => {
        setCopied(key);
        window.setTimeout(() => setCopied(""), 1800);
      })
      .catch(() => undefined);
  };

  const missingProduct = !productId;
  const shownError = missingProduct ? "Chưa chọn sản phẩm để thanh toán." : error;

  const image = product?.images?.[0] ? apiAssetUrl(product.images[0]) : "";
  const memo = placed ? `${paymentInfo?.memoPrefix ?? "RW-"}${placed.id.slice(-8).toUpperCase()}` : "";

  return (
    <div className="bg-[#fff8f5] text-[#231a11] min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow w-full max-w-[1100px] mx-auto px-5 sm:px-6 pt-28 pb-12">
        {(loading && !missingProduct) || authLoading ? (
          <p className="text-sm text-[#88726c]">Đang tải...</p>
        ) : placed && placedPaid ? (
          <section className="bg-white rounded-3xl border border-[#dbc1b9]/40 shadow-sm p-6 sm:p-10 max-w-[640px] mx-auto text-center">
            <div className="w-20 h-20 rounded-full bg-[#dae9b5] text-[#556138] mx-auto flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-[44px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>
            <span className="inline-block px-3 py-1 rounded-full bg-[#556138]/10 text-[#556138] text-xs font-semibold mb-2">
              Đơn {memo} đã được xác nhận
            </span>
            <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold mb-2">Đã nhận thanh toán, tiền được sàn giữ an toàn</h1>
            <p className="text-sm text-[#55433d] max-w-md mx-auto">
              REWORE đã nhận <strong className="text-[#231a11]">{formatVnd(total)}</strong>. Người bán đã được báo để chuẩn bị và giao hàng cho bạn.
            </p>

            <div className="mt-8 p-5 bg-[#fff1e8] rounded-2xl border border-[#feeadc] text-left">
              <h4 className="text-xs font-bold uppercase tracking-wider mb-4">Hành trình đơn hàng</h4>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Đã thanh toán", hint: "Vừa xong", done: true },
                  { label: "Người bán giao hàng", hint: "Chờ người bán", done: false },
                  { label: "Bạn nhận hàng", hint: "Bấm xác nhận để hoàn tất", done: false },
                ].map((step, index) => (
                  <div key={step.label} className="flex flex-col items-center text-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        step.done ? "bg-[#556138] text-white" : "bg-[#feeadc] text-[#55433d] border border-[#dbc1b9]"
                      }`}
                    >
                      {step.done ? <span className="material-symbols-outlined text-[16px]">check</span> : index + 1}
                    </div>
                    <span className="text-xs font-bold mt-2">{step.label}</span>
                    <span className={`text-[11px] ${step.done ? "text-[#556138] font-medium" : "text-[#88726c]"}`}>{step.hint}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 text-left border-y border-[#f2dfd1] py-4 space-y-2.5 text-xs">
              <div className="flex justify-between gap-4"><span className="text-[#55433d]">Sản phẩm</span><span className="font-bold text-right">{product?.title}</span></div>
              <div className="flex justify-between gap-4"><span className="text-[#55433d]">Giao tới</span><span className="text-right">{form.receiverName} · {form.receiverPhone} · {form.shippingAddress}</span></div>
              <div className="flex justify-between pt-2 border-t border-[#f2dfd1]"><span className="font-bold">Đã thanh toán</span><span className="text-lg font-bold text-[#974226]">{formatVnd(total)}</span></div>
            </div>

            <div className="mt-6 p-4 rounded-2xl bg-[#dae9b5]/30 border border-[#556138]/20 flex items-start gap-3 text-left">
              <span className="material-symbols-outlined text-[#556138] text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
              <p className="text-xs text-[#55433d]">
                <span className="font-bold text-[#231a11] block">Tiền của bạn được bảo vệ:</span>
                Sàn chỉ chuyển tiền cho người bán sau khi bạn bấm xác nhận đã nhận hàng.
              </p>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link href={`/orders/${placed.id}`} className="flex-1 py-3.5 rounded-2xl bg-[#974226] text-white text-sm font-semibold hover:bg-[#b65a3c] text-center">
                Xem chi tiết đơn hàng
              </Link>
              <Link href="/shop" className="flex-1 py-3.5 rounded-2xl border border-[#974226] text-[#974226] text-sm font-semibold hover:bg-[#feeadc] text-center">
                Tiếp tục mua sắm
              </Link>
            </div>
          </section>
        ) : placed ? (
          <section className="max-w-[540px] mx-auto">
            <div className="bg-white rounded-3xl border border-[#dbc1b9]/40 shadow-sm p-6 sm:p-8 text-center">
              <span className="inline-block px-3 py-1 rounded-full bg-[#ffdbd0]/60 text-[#7b2e14] text-xs font-semibold mb-3">
                Chuyển khoản qua VietQR
              </span>
              <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold">Quét mã để thanh toán</h1>
              <p className="text-sm text-[#55433d] mt-1">Mở app ngân hàng bất kỳ và quét mã. Số tiền và nội dung đã điền sẵn.</p>

              <div className="my-5 py-3 px-6 rounded-2xl bg-[#fff1e8] border border-[#feeadc] inline-block">
                <span className="text-[11px] text-[#55433d] block uppercase tracking-wider">Số tiền cần thanh toán</span>
                <span className="font-[family-name:var(--font-playfair)] text-3xl font-bold text-[#974226]">{formatVnd(total)}</span>
              </div>

              {paymentInfo?.configured ? (
                <>
                  <div className="w-64 mx-auto p-3 bg-white rounded-3xl border-2 border-[#974226]/30 shadow-md flex items-center justify-center min-h-[16rem]">
                    {qrSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={qrSrc} alt="Mã QR VietQR" className="w-full h-auto rounded-2xl" />
                    ) : (
                      <p className="text-xs text-[#88726c] px-4">Chưa có mã ngân hàng cho QR. Hãy chuyển khoản theo thông tin bên dưới.</p>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[#8b4c09]">
                    <span className="material-symbols-outlined text-[18px]">schedule</span>
                    <span>
                      Đơn được giữ trong: <strong className="font-mono text-[#974226] text-sm">{formatHms(unpaidSeconds)}</strong>
                    </span>
                  </div>

                  <div className="mt-6 text-left space-y-3 bg-[#fff1e8] p-4 sm:p-5 rounded-2xl border border-[#feeadc] text-xs">
                    <div className="flex justify-between items-center gap-3">
                      <span className="text-[#55433d]">Ngân hàng</span>
                      <span className="font-bold text-right">{paymentInfo.bankName}</span>
                    </div>
                    <div className="flex justify-between items-center gap-3 pt-2 border-t border-[#feeadc]">
                      <div>
                        <span className="text-[#55433d] block">Số tài khoản</span>
                        <span className="font-mono font-bold text-base">{paymentInfo.accountNumber}</span>
                      </div>
                      <button type="button" onClick={() => copy("account", paymentInfo.accountNumber)} className="px-3 py-1.5 rounded-lg bg-white border border-[#dbc1b9] text-[#974226] hover:bg-[#ffdbd0]/40 font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">{copied === "account" ? "check" : "content_copy"}</span>
                        {copied === "account" ? "Đã chép" : "Chép"}
                      </button>
                    </div>
                    <div className="flex justify-between items-center gap-3 pt-2 border-t border-[#feeadc]">
                      <span className="text-[#55433d]">Chủ tài khoản</span>
                      <span className="font-bold text-right">{paymentInfo.accountName}</span>
                    </div>
                    <div className="flex justify-between items-center gap-3 pt-2 border-t border-[#feeadc]">
                      <div>
                        <span className="text-[#55433d] block">Nội dung chuyển khoản</span>
                        <span className="font-mono font-bold text-base text-[#974226]">{memo}</span>
                      </div>
                      <button type="button" onClick={() => copy("memo", memo)} className="px-3 py-1.5 rounded-lg bg-white border border-[#dbc1b9] text-[#974226] hover:bg-[#ffdbd0]/40 font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">{copied === "memo" ? "check" : "content_copy"}</span>
                        {copied === "memo" ? "Đã chép" : "Chép"}
                      </button>
                    </div>
                    <p className="text-[11px] text-[#88726c] pt-1">Vui lòng giữ nguyên nội dung chuyển khoản để hệ thống tự nhận tiền.</p>
                  </div>
                </>
              ) : (
                <p className="rounded-2xl bg-[#fff2de] border border-[#f3cca0] p-4 text-sm text-[#8b4c09]">
                  Sàn chưa cấu hình tài khoản nhận tiền. Vui lòng liên hệ admin.
                </p>
              )}

              <div className="mt-6 flex items-center justify-center gap-3 p-3 rounded-xl bg-[#feeadc]/60 text-xs text-[#55433d]">
                <svg className="animate-spin h-4 w-4 text-[#974226]" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Đang chờ nhận tiền, trang tự cập nhật khi bạn chuyển khoản xong.</span>
              </div>

              <div className="mt-4 flex items-center justify-center gap-4 text-xs">
                <Link href={`/orders/${placed.id}`} className="text-[#974226] hover:underline">Xem chi tiết đơn</Link>
                <span className="text-[#dbc1b9]">·</span>
                <Link href="/shop" className="text-[#974226] hover:underline">Tiếp tục mua sắm</Link>
              </div>
            </div>
          </section>
        ) : !product ? (
          <div className="text-center py-16">
            <p className="text-sm text-[#ba1a1a] mb-4">{shownError || "Không tìm thấy sản phẩm."}</p>
            <Link href="/shop" className="px-6 py-2.5 rounded-full bg-[#974226] text-white text-sm font-semibold">Về cửa hàng</Link>
          </div>
        ) : (
          <>
            <div className="mb-8 flex items-center gap-3 text-sm text-[#55433d]">
              <Link href="/cart" className="hover:text-[#974226]">Giỏ hàng</Link>
              <span className="text-[#dbc1b9]">/</span>
              <span className="text-[#974226] font-semibold">Thanh toán</span>
              <span className="text-[#dbc1b9]">/</span>
              <span className="text-[#88726c]">Xác nhận thanh toán</span>
            </div>

            <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-7 space-y-6">
                <section className="bg-white rounded-3xl border border-[#dbc1b9]/40 shadow-sm p-6 md:p-8 space-y-4">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="w-7 h-7 rounded-full bg-[#f8e5d6] text-[#974226] text-sm flex items-center justify-center font-bold">1</span>
                    <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold">Địa chỉ nhận hàng</h2>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <label className="block text-sm">
                      <span className="block text-xs font-bold text-[#55433d] mb-1">Người nhận</span>
                      <input className={inputClass} required minLength={2} value={form.receiverName} onChange={(e) => update("receiverName", e.target.value)} />
                    </label>
                    <label className="block text-sm">
                      <span className="block text-xs font-bold text-[#55433d] mb-1">Số điện thoại</span>
                      <input className={inputClass} required minLength={8} inputMode="tel" value={form.receiverPhone} onChange={(e) => update("receiverPhone", e.target.value)} />
                    </label>
                  </div>
                  <label className="block text-sm">
                    <span className="block text-xs font-bold text-[#55433d] mb-1">Địa chỉ nhận hàng</span>
                    <input className={inputClass} required minLength={5} value={form.shippingAddress} onChange={(e) => update("shippingAddress", e.target.value)} placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành" />
                  </label>
                  <label className="block text-sm">
                    <span className="block text-xs font-bold text-[#55433d] mb-1">Ghi chú cho người bán (nếu có)</span>
                    <input className={inputClass} value={form.note} onChange={(e) => update("note", e.target.value)} />
                  </label>
                </section>

                <section className="bg-white rounded-3xl border border-[#dbc1b9]/40 shadow-sm p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-5">
                    <span className="w-7 h-7 rounded-full bg-[#f8e5d6] text-[#974226] text-sm flex items-center justify-center font-bold">2</span>
                    <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold">Phương thức thanh toán</h2>
                  </div>
                  <div className="p-4 md:p-5 rounded-2xl border-2 border-[#974226] bg-[#ffdbd0]/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white border border-[#dbc1b9]/40 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[#974226] text-[22px]">qr_code_2</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold">Chuyển khoản VietQR</span>
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#dae9b5] text-[#151f01]">Tự xác nhận, miễn phí</span>
                        </div>
                        <p className="text-xs text-[#55433d]">Tiền về tài khoản sàn là đơn được cập nhật ngay</p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-[#974226]">check_circle</span>
                  </div>

                  <div className="mt-6 p-4 rounded-2xl bg-[#fff1e8] border border-[#feeadc] flex items-start gap-3">
                    <span className="material-symbols-outlined text-[#556138] text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                    <p className="text-xs text-[#55433d]">
                      <span className="font-bold text-[#231a11]">REWORE giữ tiền hộ bạn:</span> sàn chỉ chuyển tiền cho người bán sau khi bạn xác nhận đã nhận hàng.
                    </p>
                  </div>
                </section>
              </div>

              <aside className="lg:col-span-5 lg:sticky lg:top-28 space-y-6">
                <div className="bg-white rounded-3xl border border-[#dbc1b9]/40 shadow-sm p-6 md:p-8">
                  {heldByMe && holdSeconds > 0 && (
                    <div className="mb-6 p-3 rounded-2xl bg-[#fff2de] border border-[#f3cca0] flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-semibold text-[#8b4c09]">
                        <span className="material-symbols-outlined text-[18px]">timer</span>
                        <span>Món này đang được giữ riêng cho bạn</span>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-white text-[#974226] font-mono font-bold text-xs">{formatCountdown(holdSeconds)}</span>
                    </div>
                  )}

                  <h3 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold mb-5">Tóm tắt đơn hàng</h3>

                  <div className="flex gap-4 pb-6 border-b border-[#f2dfd1]">
                    <div className="relative w-24 h-28 rounded-2xl overflow-hidden bg-[#feeadc] shrink-0">
                      {image && <Image src={image} alt={product.title} fill className="object-cover" sizes="96px" />}
                    </div>
                    <div className="min-w-0 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold line-clamp-2">{product.title}</h4>
                        <p className="text-xs text-[#55433d] mt-0.5">{sellerDisplayName(product.seller)}</p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {product.brand && <span className="px-2 py-0.5 rounded-full text-[11px] bg-[#fff1e8] text-[#55433d]">{product.brand}</span>}
                          {product.size && <span className="px-2 py-0.5 rounded-full text-[11px] bg-[#fff1e8] text-[#55433d]">Size {product.size}</span>}
                        </div>
                      </div>
                      <span className="font-[family-name:var(--font-playfair)] text-xl font-bold text-[#974226] text-right">{formatVnd(product.price)}</span>
                    </div>
                  </div>

                  <div className="py-5 space-y-3 text-sm text-[#55433d]">
                    <div className="flex justify-between"><span>Tạm tính</span><span className="text-[#231a11] font-medium">{formatVnd(product.price)}</span></div>
                    <div className="flex justify-between"><span>Phí vận chuyển</span><span className="text-[#231a11] font-medium">Miễn phí</span></div>
                    <div className="flex justify-between"><span>Phí bảo vệ người mua</span><span className="text-[#556138] font-bold">0đ (Miễn phí)</span></div>
                    <div className="pt-3 border-t border-[#f2dfd1] flex justify-between items-baseline">
                      <span className="font-[family-name:var(--font-playfair)] text-xl font-bold text-[#231a11]">Tổng cộng</span>
                      <span className="font-[family-name:var(--font-playfair)] text-3xl font-bold text-[#974226]">{formatVnd(product.price)}</span>
                    </div>
                  </div>

                  {error && <p className="mb-4 rounded-xl bg-[#ffdad6] px-4 py-3 text-sm text-[#93000a]">{error}</p>}

                  <button
                    type="submit"
                    disabled={submitting || !buyable}
                    className="w-full py-4 px-6 rounded-2xl bg-[#974226] hover:bg-[#b65a3c] text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    <span>
                      {submitting
                        ? "Đang tạo đơn..."
                        : isOwn
                        ? "Đây là sản phẩm của bạn"
                        : buyable
                        ? `Thanh toán ${formatVnd(product.price)}`
                        : heldByOther
                        ? "Đang được người khác giữ"
                        : "Sản phẩm không còn khả dụng"}
                    </span>
                    {buyable && !submitting && <span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
                  </button>

                  <div className="mt-4 pt-4 border-t border-[#feeadc] flex items-center justify-center gap-2 text-center text-[11px] text-[#55433d]">
                    <span className="material-symbols-outlined text-[16px] text-[#556138]">lock</span>
                    <span>REWORE Escrow: tiền chỉ chuyển cho người bán sau khi bạn nhận hàng</span>
                  </div>
                </div>
              </aside>
            </form>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fff8f5]" />}>
      <CheckoutContent />
    </Suspense>
  );
}
