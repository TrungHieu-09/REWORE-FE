import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full bg-[#ede1d2] border-t border-[#dbc1b9]/40 mt-auto">
      <div className="w-full px-6 md:px-12 max-w-[1280px] mx-auto py-16 flex flex-col md:flex-row justify-between items-start gap-8">
        <div className="space-y-4 max-w-sm">
          <Link
            href="/"
            className="font-headline-lg text-2xl md:text-3xl tracking-tight uppercase font-bold text-[#6b6357] hover:text-[#974226] transition-colors flex items-center gap-1"
          >
            <span>REWORE</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#974226] mb-1"></span>
          </Link>
          <p className="font-body-md text-sm md:text-base text-[#6b6357]/80 leading-relaxed">
            © 2026 REWORE. Chợ đồ 2hand cho người Việt.
          </p>
          <p className="font-label-sm text-xs text-[#6b6357]/60">
            Mọi đơn hàng được sàn giữ tiền đến khi bạn nhận hàng.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-8">
          <Link
            href="/shop"
            className="font-label-sm text-xs md:text-sm text-[#6b6357]/70 hover:text-[#974226] underline underline-offset-4 transition-colors"
          >
            Đồ mới đăng
          </Link>
          <Link
            href="/#trust"
            className="font-label-sm text-xs md:text-sm text-[#6b6357]/70 hover:text-[#974226] underline underline-offset-4 transition-colors"
          >
            Sàn giữ tiền an toàn
          </Link>
          <Link
            href="/shop"
            className="font-label-sm text-xs md:text-sm text-[#6b6357]/70 hover:text-[#974226] underline underline-offset-4 transition-colors"
          >
            Đồ si tuyển chọn
          </Link>
          <Link
            href="/seller/products/new"
            className="font-label-sm text-xs md:text-sm text-[#6b6357]/70 hover:text-[#974226] underline underline-offset-4 transition-colors"
          >
            Đăng bán cùng REWORE
          </Link>
          <Link
            href="/#how-it-works"
            className="font-label-sm text-xs md:text-sm text-[#6b6357]/70 hover:text-[#974226] underline underline-offset-4 transition-colors"
          >
            Thời trang tuần hoàn
          </Link>
          <Link
            href="/#trust"
            className="font-label-sm text-xs md:text-sm text-[#6b6357]/70 hover:text-[#974226] underline underline-offset-4 transition-colors"
          >
            Điều khoản sử dụng
          </Link>
          <Link
            href="/#trust"
            className="font-label-sm text-xs md:text-sm text-[#6b6357]/70 hover:text-[#974226] underline underline-offset-4 transition-colors"
          >
            Chính sách bảo mật
          </Link>
        </div>
      </div>
    </footer>
  );
}

