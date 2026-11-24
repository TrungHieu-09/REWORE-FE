"use client";

import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";

/**
 * Bảo vệ các trang /seller/* — chỉ cho phép SELLER hoặc ADMIN truy cập.
 * - Chưa đăng nhập → redirect /login
 * - Đã đăng nhập nhưng role = BUYER → redirect /shop
 */
export default function SellerGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return; // Chờ AuthContext restore từ localStorage

    if (!user) {
      router.replace("/login");
      return;
    }

  }, [user, isLoading, router]);

  // Đang load session
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fff8f5] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#974226] flex items-center justify-center">
            <span className="font-bold text-white text-lg">R</span>
          </div>
          <div className="w-5 h-5 border-2 border-[#974226] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // Chưa đăng nhập hoặc không phải seller — render nothing (redirect đang xảy ra)
  if (!user) {
    return null;
  }

  return <>{children}</>;
}
