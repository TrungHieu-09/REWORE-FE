"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiError, sellerApi, type UpdateSellerShopPayload } from "../../lib/api";
import { useSellerShop } from "../../components/seller/SellerShopProvider";

type FormState = {
  shopName: string;
  bio: string;
  pickupAddress: string;
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
};

const inputClass =
  "w-full px-4 py-2.5 rounded-xl border border-[#dbc1b9] bg-[#fff8f5] text-sm focus:outline-none focus:border-[#974226] disabled:opacity-60";
const labelClass = "block text-xs font-bold text-[#55433d] uppercase tracking-wider mb-2";

export default function SellerSettingsPage() {
  const { profile, loading, setProfile } = useSellerShop();
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const fromProfile = (): FormState | null =>
    profile
      ? {
          shopName: profile.shopName,
          bio: profile.user.bio ?? "",
          pickupAddress: profile.pickupAddress,
          bankName: profile.bankName,
          bankAccountName: profile.bankAccountName,
          bankAccountNumber: profile.bankAccountNumber,
        }
      : null;

  useEffect(() => {
    setForm(fromProfile());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const update = (key: keyof FormState, value: string) =>
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));

  const canEdit = profile?.canEdit ?? false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || !canEdit) return;
    setSaving(true);
    setMessage(null);
    setFieldErrors({});

    const payload: UpdateSellerShopPayload = {
      shopName: form.shopName,
      bio: form.bio,
      pickupAddress: form.pickupAddress,
      bankName: form.bankName,
      bankAccountName: form.bankAccountName,
      bankAccountNumber: form.bankAccountNumber,
    };

    try {
      const res = await sellerApi.updateShopProfile(payload);
      setProfile(res.data);
      setMessage({ type: "ok", text: res.message || "Đã lưu cài đặt cửa hàng." });
    } catch (err) {
      if (err instanceof ApiError) {
        setFieldErrors(err.errors ?? {});
        setMessage({ type: "error", text: err.message });
      } else {
        setMessage({ type: "error", text: "Không thể lưu cài đặt. Vui lòng thử lại." });
      }
    } finally {
      setSaving(false);
    }
  };

  const fieldError = (key: keyof FormState) =>
    fieldErrors[key]?.[0] ? <p className="mt-1 text-xs text-[#ba1a1a]">{fieldErrors[key][0]}</p> : null;

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="flex items-center gap-2 text-[13px] text-[#88726c] mb-6">
        <Link href="/seller/dashboard" className="hover:text-[#974226] font-medium">
          Dashboard
        </Link>
        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        <span className="text-[#231a11] font-semibold">Store Settings</span>
      </div>

      <div className="bg-white rounded-2xl border border-[#dbc1b9]/30 p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-[#231a11] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
          Store Settings
        </h1>
        <p className="text-xs text-[#655d52] mb-6">Cấu hình hồ sơ cửa hàng, địa chỉ lấy hàng và tài khoản nhận tiền</p>

        {loading || !form ? (
          <p className="text-sm text-[#88726c]">{loading ? "Đang tải..." : "Không tải được thông tin cửa hàng."}</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {!canEdit && (
              <p className="rounded-xl bg-[#feeadc] px-4 py-3 text-xs text-[#7b2e14]">
                Chỉ chủ shop mới được chỉnh sửa thông tin cửa hàng.
              </p>
            )}

            {message && (
              <p
                className={`rounded-xl px-4 py-3 text-sm ${
                  message.type === "ok" ? "bg-[#e6efd2] text-[#3d4a22]" : "bg-[#ffdad6] text-[#93000a]"
                }`}
              >
                {message.text}
              </p>
            )}

            <div>
              <label className={labelClass} htmlFor="shop-name">Store Name</label>
              <input
                id="shop-name"
                type="text"
                required
                minLength={2}
                maxLength={80}
                disabled={!canEdit}
                value={form.shopName}
                onChange={(e) => update("shopName", e.target.value)}
                className={inputClass}
              />
              {fieldError("shopName")}
            </div>

            <div>
              <label className={labelClass} htmlFor="shop-bio">Store Bio / Tagline</label>
              <textarea
                id="shop-bio"
                rows={3}
                maxLength={300}
                disabled={!canEdit}
                value={form.bio}
                onChange={(e) => update("bio", e.target.value)}
                className={inputClass}
              />
              {fieldError("bio")}
            </div>

            <div>
              <label className={labelClass} htmlFor="pickup-address">Pickup Address</label>
              <input
                id="pickup-address"
                type="text"
                disabled={!canEdit}
                value={form.pickupAddress}
                onChange={(e) => update("pickupAddress", e.target.value)}
                placeholder="Địa chỉ shipper đến lấy hàng"
                className={inputClass}
              />
              {fieldError("pickupAddress")}
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor="bank-name">Bank</label>
                <input
                  id="bank-name"
                  type="text"
                  disabled={!canEdit}
                  value={form.bankName}
                  onChange={(e) => update("bankName", e.target.value)}
                  placeholder="Vietcombank"
                  className={inputClass}
                />
                {fieldError("bankName")}
              </div>
              <div>
                <label className={labelClass} htmlFor="bank-number">Account Number</label>
                <input
                  id="bank-number"
                  type="text"
                  inputMode="numeric"
                  disabled={!canEdit}
                  value={form.bankAccountNumber}
                  onChange={(e) => update("bankAccountNumber", e.target.value)}
                  className={inputClass}
                />
                {fieldError("bankAccountNumber")}
              </div>
            </div>

            <div>
              <label className={labelClass} htmlFor="bank-holder">Account Holder</label>
              <input
                id="bank-holder"
                type="text"
                disabled={!canEdit}
                value={form.bankAccountName}
                onChange={(e) => update("bankAccountName", e.target.value)}
                className={inputClass}
              />
              {fieldError("bankAccountName")}
            </div>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#f2dfd1]">
              <button
                type="button"
                onClick={() => {
                  setForm(fromProfile());
                  setMessage(null);
                  setFieldErrors({});
                }}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-[#dbc1b9] text-[#55433d] hover:bg-[#feeadc]"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={saving || !canEdit}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-[#974226] text-white hover:bg-[#b65a3c] transition-all shadow-sm disabled:opacity-60"
              >
                {saving ? "Đang lưu..." : "Save Store Settings"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
