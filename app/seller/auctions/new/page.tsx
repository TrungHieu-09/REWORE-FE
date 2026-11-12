"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { LoadingSkeleton } from "../../../components/admin/AdminStates";
import { PillButton } from "../../../components/admin/PillButton";
import { useAuth } from "../../../context/AuthContext";
import {
  ApiError,
  auctionsApi,
  productsApi,

  type Product,
} from "../../../lib/api";

type AuctionForm = {
  productId: string;
  startPrice: string;
  minIncrement: string;
  startTime: string;
  endTime: string;
};

type FieldErrors = Partial<Record<keyof AuctionForm, string>>;

const emptyForm: AuctionForm = {
  productId: "",
  startPrice: "",
  minIncrement: "",
  startTime: "",
  endTime: "",
};

const digitsOnly = (value: string) => value.replace(/[^\d]/g, "");
const formatVndInput = (value: string) => {
  const digits = digitsOnly(value);
  return digits ? new Intl.NumberFormat("vi-VN").format(Number(digits)) : "";
};
const parseMoney = (value: string) => Number(digitsOnly(value));
const toIso = (value: string) => new Date(value).toISOString();

export default function NewSellerAuctionPage() {
  const { user, isLoading } = useAuth();
  const [form, setForm] = useState<AuctionForm>(emptyForm);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [toast, setToast] = useState("");

  const sellerStatus = user?.sellerStatus ?? (user?.role === "SELLER" ? "APPROVED" : "NONE");
  const isSeller = user?.role === "SELLER" && sellerStatus === "APPROVED";
  const selectableProducts = useMemo(
    () => products.filter((product) => product.status === "ACTIVE" && product.availabilityStatus !== "sold"),
    [products]
  );

  useEffect(() => {
    if (isLoading || !user?.id || !isSeller) return;

    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setMessage("");

      Promise.allSettled([productsApi.list({ sellerId: user.id, limit: 80, sortBy: "newest" })])
        .then(([productResult]) => {
          if (cancelled) return;

          if (productResult.status === "fulfilled") {
            setProducts(productResult.value.data);
          } else {
            setProducts([]);
            setMessage(productResult.reason instanceof ApiError ? productResult.reason.message : "Không tải được sản phẩm của shop.");
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [isLoading, isSeller, user?.id]);

  const updateForm = (field: keyof AuctionForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const validate = () => {
    const nextErrors: FieldErrors = {};
    const startPrice = parseMoney(form.startPrice);
    const minIncrement = parseMoney(form.minIncrement);
    const startTime = form.startTime ? new Date(form.startTime).getTime() : 0;
    const endTime = form.endTime ? new Date(form.endTime).getTime() : 0;

    if (!form.productId) nextErrors.productId = "Chọn sản phẩm để tạo đấu giá.";
    if (startPrice <= 0) nextErrors.startPrice = "Giá khởi điểm phải lớn hơn 0.";
    if (minIncrement <= 0) nextErrors.minIncrement = "Bước giá phải lớn hơn 0.";
    if (!form.startTime) nextErrors.startTime = "Chọn thời gian bắt đầu.";
    if (!form.endTime) nextErrors.endTime = "Chọn thời gian kết thúc.";
    if (startTime && endTime && endTime <= startTime) nextErrors.endTime = "Thời gian kết thúc phải sau thời gian bắt đầu.";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");
    setToast("");

    if (!validate()) return;

    setSubmitting(true);
    try {
      await auctionsApi.create({
        productId: form.productId,
        startPrice: parseMoney(form.startPrice),
        minIncrement: parseMoney(form.minIncrement),
        startTime: toIso(form.startTime),
        endTime: toIso(form.endTime),
      });
      setToast("Đã tạo phiên đấu giá.");
      window.setTimeout(() => {
        window.location.href = "/seller/auctions";
      }, 700);
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : "Không thể tạo đấu giá.";
      setToast(errorMessage);
      setMessage(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="seller-create-root">
        {toast && <div className="admin-toast">{toast}</div>}
        <main className="seller-create-layout">
          {!isLoading && !isSeller ? (
            <section className="seller-create-locked">
              <span className="material-symbols-outlined">lock</span>
              <h1>Seller tools are locked</h1>
              <p>Bạn cần được duyệt seller trước khi tạo đấu giá.</p>
              <Link href="/shop">Về cửa hàng</Link>
            </section>
          ) : loading ? (
            <LoadingSkeleton rows={4} />
          ) : (
            <form className="seller-create-form" onSubmit={handleSubmit}>
              <header className="seller-create-head">
                <div>
                  <div className="seller-create-kicker">
                    <span className="material-symbols-outlined">gavel</span>
                    Seller Auctions
                  </div>
                  <h1>Tạo đấu giá</h1>
                  <p>Chọn sản phẩm đã đăng, đặt giá khởi điểm, bước giá và thời gian chạy phiên đấu giá.</p>
                  {message && <p className="seller-listing-error">{message}</p>}
                </div>
              </header>

              <section className="seller-create-panel">
                <div className="seller-create-section-head">
                  <span className="material-symbols-outlined">inventory_2</span>
                  <div>
                    <h2>Thông tin phiên đấu giá</h2>
                    <p>Form này gọi trực tiếp POST /api/auctions khi submit.</p>
                  </div>
                </div>

                <div className="seller-create-grid">
                  <label className="seller-field seller-field-wide">
                    <span>Sản phẩm</span>
                    <select value={form.productId} onChange={(event) => updateForm("productId", event.target.value)}>
                      <option value="">Chọn sản phẩm đang bán</option>
                      {selectableProducts.map((product) => (
                        <option value={product.id} key={product.id}>
                          {product.title}
                        </option>
                      ))}
                    </select>
                    {errors.productId && <small>{errors.productId}</small>}
                  </label>

                  <label className="seller-field">
                    <span>Giá khởi điểm</span>
                    <input
                      value={form.startPrice}
                      inputMode="numeric"
                      onChange={(event) => updateForm("startPrice", formatVndInput(event.target.value))}
                      placeholder="250.000"
                    />
                    {errors.startPrice && <small>{errors.startPrice}</small>}
                  </label>

                  <label className="seller-field">
                    <span>Bước giá tối thiểu</span>
                    <input
                      value={form.minIncrement}
                      inputMode="numeric"
                      onChange={(event) => updateForm("minIncrement", formatVndInput(event.target.value))}
                      placeholder="10.000"
                    />
                    {errors.minIncrement && <small>{errors.minIncrement}</small>}
                  </label>

                  <label className="seller-field">
                    <span>Thời gian bắt đầu</span>
                    <input type="datetime-local" value={form.startTime} onChange={(event) => updateForm("startTime", event.target.value)} />
                    {errors.startTime && <small>{errors.startTime}</small>}
                  </label>

                  <label className="seller-field">
                    <span>Thời gian kết thúc</span>
                    <input type="datetime-local" value={form.endTime} onChange={(event) => updateForm("endTime", event.target.value)} />
                    {errors.endTime && <small>{errors.endTime}</small>}
                  </label>
                </div>
              </section>

              <footer className="seller-create-actions">
                <Link href="/seller/auctions">Huỷ</Link>
                <PillButton type="submit" tone="accent" className="seller-submit-button" disabled={submitting || selectableProducts.length === 0}>
                  {submitting && <span className="seller-create-spinner" />}
                  {submitting ? "Đang tạo..." : "Tạo đấu giá"}
                </PillButton>
              </footer>
            </form>
          )}
        </main>
      </div>
  );
}
