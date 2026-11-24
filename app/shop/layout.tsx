import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "REWORE — Chợ đồ 2hand",
  description:
    "Đồ 2hand giá từ 100K: áo khoác, quần jean, đầm, giày, túi. Sàn giữ tiền đến khi bạn nhận hàng.",
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
