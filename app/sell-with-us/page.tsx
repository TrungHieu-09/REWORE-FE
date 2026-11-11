import Link from "next/link";

export default function SellWithUsPage() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <span className="material-symbols-outlined text-5xl text-[#974226]">storefront</span>
      <h1 className="text-3xl font-semibold text-[#231a11]">Bán hàng cùng REWORE</h1>
      <p className="text-[#55433d]">
        Tài khoản người bán được quản lý bởi đội ngũ REWORE. Hãy liên hệ với chúng tôi,
        admin sẽ trao đổi và cấp tài khoản để bạn có thể đăng bán sản phẩm.
      </p>
      <Link href="/" className="rounded-full bg-[#974226] px-6 py-3 text-sm font-semibold text-white hover:bg-[#b65a3c]">
        Về trang chủ
      </Link>
    </main>
  );
}
