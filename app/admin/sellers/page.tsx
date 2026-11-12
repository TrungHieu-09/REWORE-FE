"use client";

import { useCallback, useEffect, useState } from "react";
import { adminApi, ApiError, type SellerApplication } from "@/app/lib/api";
import { AdminShell } from "../../components/admin/AdminShell";
import AddUserPanel from "../../components/admin/AddUserPanel";

export default function AdminSellersPage() {
  const [sellers, setSellers] = useState<SellerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const load = useCallback(
    () =>
      adminApi
        .sellerApplications({ limit: 100 })
        .then((res) => setSellers(res.data ?? []))
        .catch((err) =>
          setMessage({ type: "error", text: err instanceof ApiError ? err.message : "Không tải được danh sách seller." })
        )
        .finally(() => setLoading(false)),
    []
  );

  useEffect(() => {
    load();
  }, [load]);

  return (
    <AdminShell pendingSellers={0} openReports={0}>
      <div className="flex w-full flex-col gap-6 px-10 py-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#231a11]">Người bán</h1>
            <p className="mt-1 text-sm text-[#55433d]">
              Người bán liên hệ với admin, admin tạo tài khoản mới hoặc cấp role seller cho tài khoản có sẵn
              (ở mục Người dùng).
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="rounded-full bg-[#974226] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#b65a3c]"
          >
            {showForm ? "Đóng" : "Thêm seller"}
          </button>
        </header>

        {message && (
          <p className={`rounded-xl px-4 py-3 text-sm ${message.type === "ok" ? "bg-[#e6efd2] text-[#3d4a22]" : "bg-[#ffdad6] text-[#93000a]"}`}>
            {message.text}
          </p>
        )}

        {showForm && (
          <AddUserPanel
            defaultRole="SELLER"
            onCancel={() => setShowForm(false)}
            onCreated={(_user, text) => {
              setShowForm(false);
              setMessage({ type: "ok", text });
              load();
            }}
          />
        )}

        <div className="overflow-hidden rounded-2xl border border-[#dbc1b9]/40 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#f8e5d6] text-xs uppercase tracking-wide text-[#55433d]">
              <tr>
                <th className="px-4 py-3">Shop</th>
                <th className="px-4 py-3">Chủ shop</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-6 text-center text-[#88726c]" colSpan={4}>Đang tải...</td>
                </tr>
              ) : sellers.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-center text-[#88726c]" colSpan={4}>Chưa có seller nào.</td>
                </tr>
              ) : (
                sellers.map((seller) => (
                  <tr key={seller.id} className="border-t border-[#f2dfd1]">
                    <td className="px-4 py-3 font-semibold text-[#231a11]">{seller.shopName}</td>
                    <td className="px-4 py-3">{seller.user?.name ?? "-"}</td>
                    <td className="px-4 py-3">{seller.user?.email ?? "-"}</td>
                    <td className="px-4 py-3">
                      {seller.user?.isBanned
                        ? "Đã khoá"
                        : seller.status === "APPROVED"
                        ? "Hoạt động"
                        : seller.status === "SUSPENDED"
                        ? "Đã thu hồi"
                        : seller.status}
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
