"use client";

import { useState } from "react";
import { adminApi, ApiError, type CreateUserPayload, type User } from "../../lib/api";

const inputClass =
  "w-full rounded-xl border border-[#dbc1b9]/60 bg-white px-3 py-2 text-sm text-[#231a11] outline-none focus:border-[#974226]";

type Props = {
  defaultRole?: "BUYER" | "SELLER";
  onCreated: (user: User, message: string) => void;
  onCancel: () => void;
};

export default function AddUserPanel({ defaultRole = "BUYER", onCreated, onCancel }: Props) {
  const [form, setForm] = useState({
    email: "",
    name: "",
    password: "",
    phone: "",
    role: defaultRole,
    shopName: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const update = (key: keyof typeof form, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setFieldErrors({});

    const payload: CreateUserPayload = {
      email: form.email.trim(),
      name: form.name.trim(),
      password: form.password,
      role: form.role,
    };
    if (form.phone.trim()) payload.phone = form.phone.trim();
    if (form.role === "SELLER" && form.shopName.trim()) payload.shopName = form.shopName.trim();

    try {
      const res = await adminApi.createUser(payload);
      onCreated(res.data, form.role === "SELLER" ? "Đã tạo tài khoản seller." : "Đã tạo người dùng.");
    } catch (err) {
      if (err instanceof ApiError) {
        setFieldErrors(err.errors ?? {});
        setError(err.message);
      } else {
        setError("Không thể tạo tài khoản.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const fe = (key: string) =>
    fieldErrors[key]?.[0] ? <span className="mt-1 block text-xs text-[#ba1a1a]">{fieldErrors[key][0]}</span> : null;

  return (
    <form
      onSubmit={handleSubmit}
      className="admin-panel grid grid-cols-1 gap-4 md:grid-cols-2"
      style={{ padding: 20, marginBottom: 16 }}
    >
      <label className="text-sm">
        Email *
        <input className={inputClass} type="email" required value={form.email} onChange={(e) => update("email", e.target.value)} />
        {fe("email")}
      </label>
      <label className="text-sm">
        Họ tên *
        <input className={inputClass} required minLength={2} value={form.name} onChange={(e) => update("name", e.target.value)} />
        {fe("name")}
      </label>
      <label className="text-sm">
        Mật khẩu * (tối thiểu 8 ký tự)
        <input className={inputClass} type="password" required minLength={8} value={form.password} onChange={(e) => update("password", e.target.value)} />
        {fe("password")}
      </label>
      <label className="text-sm">
        Số điện thoại
        <input className={inputClass} value={form.phone} onChange={(e) => update("phone", e.target.value)} />
        {fe("phone")}
      </label>
      <label className="text-sm">
        Role *
        <select className={inputClass} value={form.role} onChange={(e) => update("role", e.target.value)}>
          <option value="BUYER">Buyer (người mua)</option>
          <option value="SELLER">Seller (người bán)</option>
        </select>
      </label>
      {form.role === "SELLER" && (
        <label className="text-sm">
          Tên shop (mặc định là họ tên)
          <input className={inputClass} value={form.shopName} onChange={(e) => update("shopName", e.target.value)} />
          {fe("shopName")}
        </label>
      )}

      {error && <p className="md:col-span-2 rounded-xl bg-[#ffdad6] px-4 py-3 text-sm text-[#93000a]">{error}</p>}

      <div className="md:col-span-2 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-[#dbc1b9] px-5 py-2.5 text-sm font-semibold text-[#55433d] hover:bg-[#feeadc]"
        >
          Huỷ
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-[#556138] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#6d7a4f] disabled:opacity-60"
        >
          {submitting ? "Đang tạo..." : "Tạo tài khoản"}
        </button>
      </div>
    </form>
  );
}
