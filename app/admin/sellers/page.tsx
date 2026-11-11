"use client";

import { useCallback, useEffect, useState } from "react";
import { adminApi, ApiError, type CreateSellerPayload, type SellerApplication } from "@/app/lib/api";
import { AdminShell } from "../../components/admin/AdminShell";

const EMPTY_FORM = {
  email: "",
  name: "",
  password: "",
  phone: "",
  shopName: "",
};

type FormState = typeof EMPTY_FORM;

const inputClass =
  "w-full rounded-xl border border-[#dbc1b9]/60 bg-white px-3 py-2 text-sm text-[#231a11] outline-none focus:border-[#974226]";

export default function AdminSellersPage() {
  const [sellers, setSellers] = useState<SellerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.sellerApplications({ limit: 100 });
      setSellers(res.data ?? []);
    } catch (err) {
      setMessage({ type: "error", text: err instanceof ApiError ? err.message : "Không tải được danh sách seller." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const update = (key: keyof FormState, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const payload: CreateSellerPayload = { email: form.email, name: form.name };
    (["password", "phone", "shopName"] as const).forEach((key) => {
      if (form[key].trim()) payload[key] = form[key].trim();
    });

    try {
      const res = await adminApi.createSeller(payload);
      setMessage({ type: "ok", text: res.message || "Đã cấp tài khoản seller." });
      setForm(EMPTY_FORM);
      setShowForm(false);
      await load();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof ApiError ? err.message : "Không thể tạo tài khoản seller." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminShell pendingSellers={0} openReports={0}>
      <div className="flex w-full flex-col gap-6 px-10 py-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#231a11]">Tài khoản người bán</h1>
            <p className="mt-1 text-sm text-[#55433d]">
              Người bán liên hệ với admin, admin tạo tài khoản (hoặc gán role seller cho tài khoản có sẵn) để họ đăng bán.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="rounded-full bg-[#974226] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#b65a3c]"
          >
            {showForm ? "Đóng" : "Cấp tài khoản seller"}
          </button>
        </header>

        {message && (
          <p className={`rounded-xl px-4 py-3 text-sm ${message.type === "ok" ? "bg-[#e6efd2] text-[#3d4a22]" : "bg-[#ffdad6] text-[#93000a]"}`}>
            {message.text}
          </p>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 rounded-2xl border border-[#dbc1b9]/40 bg-white p-6 md:grid-cols-2">
            <label className="text-sm">
              Email *
              <input className={inputClass} type="email" required value={form.email} onChange={(e) => update("email", e.target.value)} />
            </label>
            <label className="text-sm">
              Họ tên *
              <input className={inputClass} required minLength={2} value={form.name} onChange={(e) => update("name", e.target.value)} />
            </label>
            <label className="text-sm">
              Mật khẩu (bắt buộc nếu email chưa có tài khoản)
              <input className={inputClass} type="password" minLength={8} value={form.password} onChange={(e) => update("password", e.target.value)} />
            </label>
            <label className="text-sm">
              Số điện thoại
              <input className={inputClass} value={form.phone} onChange={(e) => update("phone", e.target.value)} />
            </label>
            <label className="text-sm">
              Tên shop (không bắt buộc, mặc định là họ tên)
              <input className={inputClass} value={form.shopName} onChange={(e) => update("shopName", e.target.value)} />
            </label>
            <div className="flex items-end justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-full bg-[#556138] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#6d7a4f] disabled:opacity-60"
              >
                {submitting ? "Đang tạo..." : "Tạo tài khoản"}
              </button>
            </div>
          </form>
        )}

        <div className="overflow-hidden rounded-2xl border border-[#dbc1b9]/40 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#f8e5d6] text-xs uppercase tracking-wide text-[#55433d]">
              <tr>
                <th className="px-4 py-3">Shop</th>
                <th className="px-4 py-3">Chủ shop</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Gói</th>
                <th className="px-4 py-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-6 text-center text-[#88726c]" colSpan={5}>Đang tải...</td>
                </tr>
              ) : sellers.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-center text-[#88726c]" colSpan={5}>Chưa có seller nào.</td>
                </tr>
              ) : (
                sellers.map((seller) => (
                  <tr key={seller.id} className="border-t border-[#f2dfd1]">
                    <td className="px-4 py-3 font-semibold text-[#231a11]">{seller.shopName}</td>
                    <td className="px-4 py-3">{seller.user?.name ?? "-"}</td>
                    <td className="px-4 py-3">{seller.user?.email ?? "-"}</td>
                    <td className="px-4 py-3">{seller.subscriptionPlan ?? "FREE"}</td>
                    <td className="px-4 py-3">
                      {seller.user?.isBanned ? "Đã khoá" : seller.status === "APPROVED" ? "Hoạt động" : seller.status}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
