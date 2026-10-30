"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useSeller } from "../context/SellerContext";
import LoginModal from "./LoginModal";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [modalSource, setModalSource] = useState<string>("general");
  const [searchQuery, setSearchQuery] = useState("");
  const pathname = usePathname();
  const router = useRouter();

  const { isLoggedIn, isLoading, logout, user } = useAuth();
  const { sellerState } = useSeller();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 15);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const authReady = !isLoading;
  const authed = authReady && isLoggedIn;
  const isAdmin = authReady && user?.role === "ADMIN";
  const hasSellerApplication = ["pending", "rejected", "suspended"].includes(
    sellerState.verificationStatus
  );

  const sellHref = sellerState.isSeller
    ? "/seller/dashboard"
    : hasSellerApplication
    ? "/profile/become-seller/status"
    : "/profile/become-seller";

  const sellLabel = sellerState.isSeller
    ? "My Shop"
    : hasSellerApplication
    ? "Seller Status"
    : "Sell";

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname?.startsWith(path)) return true;
    return false;
  };

  // Only show search bar on navbar if user is logged in AND currently on the discover/shop page
  const showSearchOnNav = authed && pathname === "/shop";

  return (
    <>
      <header
        className={`top-0 sticky z-50 transition-all duration-200 border-b ${
          scrolled
            ? "bg-[#fff8f5]/95 backdrop-blur-md border-[#dbc1b9]/40 shadow-sm"
            : "bg-[#fff8f5]/90 backdrop-blur-sm border-[#dbc1b9]/25"
        }`}
      >
        <div className="w-full px-5 md:px-12 max-w-[1280px] mx-auto flex items-center justify-between h-20 gap-4 md:gap-6">
          {/* Brand & Search cluster */}
          <div className="flex items-center gap-6 lg:gap-8 flex-1 max-w-xl">
            <Link
              href={isAdmin ? "/admin" : authed ? "/shop" : "/"}
              className="font-headline-lg text-2xl lg:text-3xl tracking-tight font-bold text-[#974226] uppercase tracking-wider flex items-center gap-1 flex-shrink-0"
            >
              <span>REWORE</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#974226] mb-1"></span>
            </Link>

            {/* Search Bar: Only shown when logged in and browsing /shop */}
            {showSearchOnNav && (
              <form onSubmit={handleSearchSubmit} className="relative w-full max-w-sm hidden sm:block animate-in fade-in duration-200">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#88726c] text-lg pointer-events-none">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search curated fashion..."
                  className="w-full pl-10 pr-4 py-2 bg-white/90 border border-[#dbc1b9]/60 rounded-full text-sm font-medium text-[#231a11] placeholder:text-[#88726c]/70 focus:outline-none focus:border-[#231a11] focus:ring-0 transition-colors shadow-xs"
                />
              </form>
            )}
          </div>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            {authed ? (
              // Logged in links
              <>
                <Link
                  href="/shop"
                  className={`transition-colors font-label-md text-sm font-semibold pb-1 ${
                    isActive("/shop")
                      ? "text-[#974226] border-b-2 border-[#974226]"
                      : "text-[#55433d] hover:text-[#231a11]"
                  }`}
                >
                  Discover
                </Link>
                <Link
                  href="/auctions"
                  className={`transition-colors font-label-md text-sm font-semibold pb-1 ${
                    isActive("/auctions")
                      ? "text-[#974226] border-b-2 border-[#974226]"
                      : "text-[#55433d] hover:text-[#231a11]"
                  }`}
                >
                  Live Auctions
                </Link>
                <Link
                  href={sellHref}
                  className={`transition-colors font-label-md text-sm font-semibold pb-1 ${
                    isActive("/profile/become-seller") || isActive("/seller")
                      ? "text-[#974226] border-b-2 border-[#974226]"
                      : "text-[#55433d] hover:text-[#231a11]"
                  }`}
                >
                  {sellLabel}
                </Link>
                <Link
                  href="/wishlist"
                  className={`transition-colors font-label-md text-sm font-semibold pb-1 ${
                    isActive("/wishlist")
                      ? "text-[#974226] border-b-2 border-[#974226]"
                      : "text-[#55433d] hover:text-[#231a11]"
                  }`}
                >
                  Archive
                </Link>
              </>
            ) : (
              // Guest links: How it Works & Trust first, followed by highlighted Discover feature
              <>
                <Link
                  href="/#how-it-works"
                  className="transition-colors font-label-md text-sm font-semibold pb-1 text-[#55433d] hover:text-[#231a11]"
                >
                  How it Works
                </Link>
                <Link
                  href="/#trust"
                  className="transition-colors font-label-md text-sm font-semibold pb-1 text-[#55433d] hover:text-[#231a11]"
                >
                  Trust &amp; Escrow
                </Link>
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#feeadc] text-[#974226] hover:bg-[#f8e5d6] border border-[#dbc1b9]/50 font-label-md text-sm font-bold transition-all shadow-xs hover:scale-102"
                >
                  <span className="material-symbols-outlined text-[17px]">explore</span>
                  <span>Discover</span>
                </Link>
              </>
            )}
          </nav>

          {/* Trailing Primary Action & Icon Actions */}
          <div className="flex items-center gap-3">
            {authed ? (
              // Logged in: Sell button, icons, account menu
              <>
                <Link
                  href={sellHref}
                  className="hidden lg:inline-flex items-center gap-1.5 px-4 py-2 bg-[#974226] text-white rounded-full font-label-md text-xs font-semibold hover:bg-[#b65a3c] transition-all active:scale-[0.98] shadow-sm"
                >
                  <span>{sellerState.isSeller ? "Seller Studio" : "Sell Item"}</span>
                </Link>

                <div className="flex items-center gap-1 text-[#55433d]">
                  <Link
                    href="/wishlist"
                    className="p-2 hover:text-[#974226] hover:bg-[#f8e5d6]/50 rounded-lg transition-colors relative"
                    title="Saved items"
                  >
                    <span className="material-symbols-outlined text-[22px]">favorite</span>
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#974226] rounded-full ring-2 ring-[#fff8f5]"></span>
                  </Link>

                  <Link
                    href="/cart"
                    className="p-2 hover:text-[#974226] hover:bg-[#f8e5d6]/50 rounded-lg transition-colors relative"
                    title="Bag"
                  >
                    <span className="material-symbols-outlined text-[22px]">shopping_bag</span>
                  </Link>

                  <Link
                    href="/messages"
                    className="p-2 hover:text-[#974226] hover:bg-[#f8e5d6]/50 rounded-lg transition-colors relative"
                    title="Messages & Notifications"
                  >
                    <span className="material-symbols-outlined text-[22px]">notifications</span>
                  </Link>

                  {/* User Account Dropdown */}
                  <div className="relative group ml-1">
                    <button
                      className="w-9 h-9 rounded-full bg-[#feeadc] text-[#974226] flex items-center justify-center font-bold text-xs hover:bg-[#f8e5d6] transition-colors border border-[#dbc1b9]/40"
                      title={user?.name || "Account"}
                    >
                      {user?.name ? user.name[0].toUpperCase() : <span className="material-symbols-outlined text-xl">person</span>}
                    </button>

                    <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-[#dbc1b9]/30 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      <div className="px-4 py-2 border-b border-[#dbc1b9]/20">
                        <p className="text-xs font-semibold text-[#231a11] truncate">{user?.name || "Member"}</p>
                        <p className="text-[11px] text-[#88726c] truncate">{user?.email}</p>
                      </div>

                      {isAdmin && (
                        <Link
                          href="/admin"
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-[#974226] hover:bg-[#fff8f5]"
                        >
                          <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
                          Admin Dashboard
                        </Link>
                      )}

                      <Link
                        href="/profile"
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#231a11] hover:bg-[#fff8f5]"
                      >
                        <span className="material-symbols-outlined text-[18px]">person</span>
                        My Profile
                      </Link>

                      {sellerState.isSeller && (
                        <Link
                          href="/seller/dashboard"
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-[#556138] hover:bg-[#fff8f5]"
                        >
                          <span className="material-symbols-outlined text-[18px]">storefront</span>
                          Seller Dashboard
                        </Link>
                      )}

                      <Link
                        href="/cart"
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#231a11] hover:bg-[#fff8f5]"
                      >
                        <span className="material-symbols-outlined text-[18px]">shopping_bag</span>
                        My Bag
                      </Link>

                      <Link
                        href="/wishlist"
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#231a11] hover:bg-[#fff8f5]"
                      >
                        <span className="material-symbols-outlined text-[18px]">favorite</span>
                        Wishlist
                      </Link>

                      <button
                        onClick={() => logout()}
                        className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-xs text-[#ba1a1a] hover:bg-[#fff8f5] border-t border-[#dbc1b9]/20 mt-1"
                      >
                        <span className="material-symbols-outlined text-[18px]">logout</span>
                        Log out
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              // Guest: Sign Up (secondary) and Log In (prominent CTA button)
              <div className="flex items-center gap-2 sm:gap-3">
                <Link
                  href="/register"
                  className="px-3 sm:px-4 py-2 text-xs font-semibold text-[#55433d] hover:text-[#974226] transition-colors"
                >
                  Sign Up
                </Link>
                <Link
                  href="/login"
                  className="px-5 py-2.5 bg-[#974226] text-white rounded-full text-xs font-semibold hover:bg-[#b65a3c] transition-all shadow-xs active:scale-95"
                >
                  Log In
                </Link>
              </div>
            )}

            {/* Mobile menu hamburger toggle */}
            <button
              className="p-2 md:hidden hover:text-[#974226] transition-colors ml-1"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              <span className="material-symbols-outlined text-2xl">
                {mobileOpen ? "close" : "menu"}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <div className="md:hidden bg-[#fff8f5] border-b border-[#dbc1b9]/40 px-6 py-4 space-y-3 animate-in slide-in-from-top-2 duration-150">
            {authed ? (
              <>
                {showSearchOnNav && (
                  <form onSubmit={handleSearchSubmit} className="relative w-full mb-3">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#88726c] text-lg">
                      search
                    </span>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search curated fashion..."
                      className="w-full pl-10 pr-4 py-2 bg-white border border-[#dbc1b9]/60 rounded-full text-sm font-medium text-[#231a11]"
                    />
                  </form>
                )}

                <Link
                  href="/shop"
                  onClick={() => setMobileOpen(false)}
                  className="block text-sm font-semibold py-1.5 text-[#231a11]"
                >
                  Discover
                </Link>
                <Link
                  href="/auctions"
                  onClick={() => setMobileOpen(false)}
                  className="block text-sm font-semibold py-1.5 text-[#231a11]"
                >
                  Live Auctions
                </Link>
                <Link
                  href={sellHref}
                  onClick={() => setMobileOpen(false)}
                  className="block text-sm font-semibold py-1.5 text-[#974226]"
                >
                  {sellLabel}
                </Link>
                <Link
                  href="/wishlist"
                  onClick={() => setMobileOpen(false)}
                  className="block text-sm font-semibold py-1.5 text-[#231a11]"
                >
                  Archive / Wishlist
                </Link>
                <Link
                  href="/cart"
                  onClick={() => setMobileOpen(false)}
                  className="block text-sm font-semibold py-1.5 text-[#231a11]"
                >
                  Shopping Bag
                </Link>
                <Link
                  href="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="block text-sm font-semibold py-1.5 text-[#231a11]"
                >
                  My Profile
                </Link>

                <button
                  onClick={() => {
                    logout();
                    setMobileOpen(false);
                  }}
                  className="block w-full text-left text-xs font-semibold text-[#ba1a1a] pt-3 border-t border-[#dbc1b9]/30"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/#how-it-works"
                  onClick={() => setMobileOpen(false)}
                  className="block text-sm font-semibold py-1.5 text-[#55433d] hover:text-[#231a11]"
                >
                  How it Works
                </Link>
                <Link
                  href="/#trust"
                  onClick={() => setMobileOpen(false)}
                  className="block text-sm font-semibold py-1.5 text-[#55433d] hover:text-[#231a11]"
                >
                  Trust &amp; Escrow
                </Link>
                <Link
                  href="/shop"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 my-1 rounded-full bg-[#feeadc] text-[#974226] text-sm font-bold border border-[#dbc1b9]/50"
                >
                  <span className="material-symbols-outlined text-[17px]">explore</span>
                  <span>Discover</span>
                </Link>

                <div className="pt-3 border-t border-[#dbc1b9]/30 flex gap-2">
                  <Link
                    href="/register"
                    onClick={() => setMobileOpen(false)}
                    className="flex-1 py-2.5 text-center text-xs font-semibold border border-[#dbc1b9] text-[#231a11] rounded-full hover:bg-white"
                  >
                    Sign Up
                  </Link>
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="flex-1 py-2.5 text-center text-xs font-semibold bg-[#974226] text-white rounded-full hover:bg-[#b65a3c]"
                  >
                    Log In
                  </Link>
                </div>
              </>
            )}
          </div>
        )}
      </header>

      {/* Login modal instance for guest interactive actions */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        actionSource={modalSource}
      />
    </>
  );
}
