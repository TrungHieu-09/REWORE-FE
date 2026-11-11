"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";

function maskEmail(email?: string) {
  if (!email) return "Not provided";
  const [name, domain] = email.split("@");
  return `${name.charAt(0)}***@${domain ?? "email.com"}`;
}

function maskPhone(phone?: string | null) {
  if (!phone) return "Not provided";
  return phone.length > 4 ? `${phone.slice(0, 3)}***${phone.slice(-4)}` : phone;
}

export default function ProfileRightSidebar() {
  const [scoreVisible, setScoreVisible] = useState(false);
  const { user } = useAuth();
  const sellerStatus = user?.sellerStatus ?? (user?.role === "SELLER" ? "APPROVED" : "NONE");
  const verificationStatus =
    sellerStatus === "PENDING" || sellerStatus === "PENDING_VERIFICATION"
      ? "pending"
      : sellerStatus === "REJECTED"
      ? "rejected"
      : sellerStatus === "SUSPENDED"
      ? "suspended"
      : "none";
  const isSeller = user?.role === "SELLER" && sellerStatus === "APPROVED";

  const buyerScore = Math.max(0, Math.min(100, user?.reputation ?? 0));

  useEffect(() => {
    const t = setTimeout(() => setScoreVisible(true), 600);
    return () => clearTimeout(t);
  }, []);

  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = scoreVisible
    ? circumference - (buyerScore / 100) * circumference
    : circumference;


  return (
    <aside className="w-full md:w-[320px] flex-shrink-0 flex flex-col gap-5">
      <div className="bg-white rounded-[20px] shadow-[0_10px_40px_-10px_rgba(43,33,24,0.08)] border border-[#dbc1b9]/30 p-6 flex flex-col items-center text-center">
        <div className="relative w-[120px] h-[120px] flex items-center justify-center mb-4">
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r={radius} fill="none" stroke="#f2dfd1" strokeWidth="6" />
            <circle
              cx="50" cy="50" r={radius} fill="none"
              stroke="#6d7a4f" strokeWidth="6" strokeLinecap="round"
              strokeDasharray={circumference} strokeDashoffset={dashOffset}
              style={{ transition: "stroke-dashoffset 1.2s ease-out" }}
            />
          </svg>
          <span className="font-[family-name:var(--font-playfair)] text-[40px] font-bold text-[#231a11] relative z-10 leading-none">
            {buyerScore}
          </span>
        </div>

        <h3 className="text-[11px] font-semibold text-[#231a11] uppercase tracking-[0.08em] mb-2 flex items-center gap-1.5">
          Buyer Score
          <span className="material-symbols-outlined text-[15px] text-[#6d7a4f]" style={{ fontVariationSettings: "'FILL' 0" }}>
            verified_user
          </span>
        </h3>
        <p className="text-[13px] text-[#55443d] leading-relaxed">
          Score is loaded from your backend reputation field.
        </p>
      </div>

      {isSeller ? (
        <div className="relative rounded-[20px] p-6 border border-[#becc9b]/50 bg-[#dae9b5]/20 overflow-hidden group">
          <div className="absolute top-0 right-0 -mt-3 -mr-3 opacity-[0.10] group-hover:scale-110 transition-transform duration-700 text-[#556138]">
            <span className="material-symbols-outlined text-[96px]">verified</span>
          </div>
          <div className="relative z-10">
            <div className="w-10 h-10 rounded-full bg-[#556138] text-white flex items-center justify-center mb-4 shadow-sm">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>storefront</span>
            </div>
            <h3 className="font-[family-name:var(--font-playfair)] text-[20px] font-semibold text-[#3a0b00] mb-2 leading-snug">
              You&apos;re a REWORE Seller
            </h3>
            <p className="text-[13px] text-[#55443d] mb-5 leading-relaxed">
              Tài khoản người bán do admin cấp.
            </p>
            <Link
              href="/seller/dashboard"
              className="block w-full text-center font-semibold text-[13px] tracking-wide bg-[#556138] text-white py-3 px-4 rounded-full hover:bg-[#6d7a4f] transition-colors shadow-sm"
            >
              Go to Seller Dashboard
            </Link>
          </div>
        </div>
      ) : (
        <div className="relative rounded-[20px] p-6 border border-[#ffb59e]/40 bg-[#ffdbd0]/20 overflow-hidden group">
          <div className="absolute top-0 right-0 -mt-3 -mr-3 opacity-[0.12] group-hover:scale-110 transition-transform duration-700 text-[#974226]">
            <span className="material-symbols-outlined text-[96px]">storefront</span>
          </div>

          <div className="relative z-10">
            <div className="w-10 h-10 rounded-full bg-[#974226] text-white flex items-center justify-center mb-4 shadow-sm">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                storefront
              </span>
            </div>
            <h3 className="font-[family-name:var(--font-playfair)] text-[22px] font-semibold text-[#3a0b00] mb-2 leading-snug">
              Muốn bán hàng cùng REWORE?
            </h3>
            <p className="text-[13px] text-[#7b2e14] mb-5 leading-relaxed">
              Hãy liên hệ với chúng tôi — admin sẽ tạo tài khoản người bán cho bạn.
            </p>
            <Link
              href="/sell-with-us"
              className="block w-full text-center font-semibold text-[13px] tracking-wide bg-[#974226] text-white py-3 px-4 rounded-full hover:bg-[#b65a3c] transition-colors shadow-sm"
            >
              Liên hệ ngay
            </Link>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[20px] shadow-[0_10px_40px_-10px_rgba(43,33,24,0.08)] border border-[#dbc1b9]/30 p-6">
        <h3 className="text-[11px] font-semibold text-[#231a11] uppercase tracking-[0.08em] mb-4 border-b border-[#f2dfd1] pb-3">
          Account Details
        </h3>
        <div className="flex flex-col gap-4">
          {[
            { label: "Email", value: maskEmail(user?.email), action: "View" },
            { label: "Phone", value: maskPhone(user?.phone), action: "Edit" },
            { label: "Payout Method", value: isSeller ? "Linked" : "Not Linked", action: isSeller ? "View" : "Link", italic: !isSeller },
          ].map(({ label, value, action, italic }) => (
            <div key={label} className="flex justify-between items-center gap-4">
              <div className="min-w-0">
                <span className="block text-[11px] font-semibold text-[#88726c] mb-0.5 tracking-wide uppercase">
                  {label}
                </span>
                <span className={`block text-[14px] text-[#231a11] truncate ${italic ? "italic text-[#88726c]" : ""}`}>
                  {value}
                </span>
              </div>
              <a href="/profile#settings" className="text-[12px] font-semibold text-[#974226] hover:underline underline-offset-4">
                {action}
              </a>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
