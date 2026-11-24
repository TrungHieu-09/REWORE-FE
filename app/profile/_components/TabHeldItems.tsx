"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ApiError, apiAssetUrl, conversationsApi, holdsApi, type ProductHoldItem } from "@/app/lib/api";
import { useRouter } from "next/navigation";

const formatVnd = (amount: number) => "₫" + new Intl.NumberFormat("vi-VN").format(amount);

const formatCountdown = (seconds: number) =>
  `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

export default function TabHeldItems() {
  const router = useRouter();
  const [holds, setHolds] = useState<ProductHoldItem[]>([]);
  const [meta, setMeta] = useState<{ maxActive: number; durationMinutes: number; minReputation: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState("");
  const [nowMs, setNowMs] = useState(() => Date.now());

  const load = () =>
    holdsApi
      .mine()
      .then((res) => {
        setHolds(res.data);
        setMeta(res.meta);
      })
      .catch((err) => setMessage(err instanceof ApiError ? err.message : "Không tải được danh sách giữ hàng."))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (holds.length === 0) return;
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [holds.length]);

  // Khi một lượt giữ hết giờ thì tải lại để danh sách khớp với server.
  useEffect(() => {
    if (holds.some((hold) => new Date(hold.expiresAt).getTime() <= nowMs)) {
      const timer = window.setTimeout(load, 1500);
      return () => window.clearTimeout(timer);
    }
  }, [holds, nowMs]);

  const release = async (hold: ProductHoldItem) => {
    setBusyId(hold.id);
    setMessage("");
    try {
      const res = await holdsApi.release(hold.id);
      setMessage(res.message);
      setHolds((items) => items.filter((item) => item.id !== hold.id));
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Không thể huỷ giữ hàng.");
    } finally {
      setBusyId("");
    }
  };

  const chat = async (hold: ProductHoldItem) => {
    if (!hold.product) return;
    try {
      const res = await conversationsApi.start({ sellerId: hold.product.sellerId, productId: hold.product.id });
      router.push(`/messages?c=${res.data.id}`);
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Không thể mở cuộc trò chuyện.");
    }
  };

  return (
    <div className="space-y-4 opacity-0 animate-fade-in-up">
      <div>
        <h3 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[#231a11] mb-1">Đang giữ hàng</h3>
        <p className="text-sm text-[#55443d]">
          {meta
            ? `Bạn giữ được tối đa ${meta.maxActive} món, mỗi món ${meta.durationMinutes} phút. Hết giờ mà chưa mua sẽ bị trừ điểm uy tín, huỷ giữ trước thì không bị trừ.`
            : "Các món bạn đang giữ."}
        </p>
        {message && <p className="text-sm text-[#974226] mt-2">{message}</p>}
      </div>

      {loading ? (
        <p className="text-sm text-[#88726c]">Đang tải...</p>
      ) : holds.length === 0 ? (
        <div className="rounded-[20px] border border-dashed border-[#dbc1b9] p-10 text-center text-[#88726c]">
          <span className="material-symbols-outlined text-[48px] text-[#dbc1b9] block mb-2">timer</span>
          <p className="text-sm">Bạn chưa giữ món nào. Mở một sản phẩm và bấm &quot;Giữ hàng&quot; để giữ riêng trong ít phút.</p>
          <Link href="/shop" className="inline-block mt-4 px-6 py-2.5 rounded-full bg-[#974226] text-white text-sm font-semibold hover:bg-[#b65a3c]">
            Xem cửa hàng
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {holds.map((hold) => {
            const secondsLeft = Math.max(0, Math.floor((new Date(hold.expiresAt).getTime() - nowMs) / 1000));
            const image = hold.product?.images?.[0] ? apiAssetUrl(hold.product.images[0]) : "";
            return (
              <div key={hold.id} className="bg-white rounded-[20px] border border-[#f2dfd1] p-4 flex flex-col sm:flex-row gap-4">
                <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-[#feeadc] shrink-0">
                  {image && <Image src={image} alt={hold.product?.title ?? "Sản phẩm"} fill className="object-cover" sizes="96px" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-[#231a11] truncate">{hold.product?.title ?? "Sản phẩm"}</h4>
                  <p className="text-xs text-[#88726c] mt-0.5">{hold.product?.shopName ?? "Shop"}</p>
                  <p className="font-[family-name:var(--font-playfair)] text-xl font-bold text-[#231a11] mt-2">
                    {formatVnd(hold.product?.price ?? 0)}
                  </p>
                  <span className="inline-block mt-2 px-2.5 py-1 rounded-full bg-[#fff2de] text-[#974226] font-mono text-xs font-bold">
                    Còn {formatCountdown(secondsLeft)}
                  </span>
                </div>
                <div className="sm:w-44 flex flex-col gap-2 justify-center">
                  <Link
                    href={`/checkout?productId=${hold.productId}`}
                    className="admin-pill admin-pill-accent justify-center"
                  >
                    Mua ngay
                  </Link>
                  <button className="admin-pill admin-pill-muted justify-center" onClick={() => chat(hold)}>
                    Nhắn tin shop
                  </button>
                  <button className="admin-pill admin-pill-muted justify-center" disabled={busyId === hold.id} onClick={() => release(hold)}>
                    Huỷ giữ
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
