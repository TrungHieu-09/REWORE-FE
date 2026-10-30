"use client";

import Link from "next/link";
import { useEffect } from "react";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionSource?: string;
}

export default function LoginModal({ isOpen, onClose, actionSource }: LoginModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#392e25]/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-md bg-[#fff8f5] rounded-[24px] p-8 shadow-2xl border border-[#dbc1b9]/40">
        <button
          className="absolute top-5 right-5 text-[#55433d] hover:text-[#231a11] p-1.5 rounded-full hover:bg-[#f8e5d6]/50 transition-colors"
          onClick={onClose}
          aria-label="Close"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>

        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#ffdbd0] flex items-center justify-center text-[#974226] mx-auto shadow-sm">
            <span className="material-symbols-outlined text-2xl">lock</span>
          </div>
          <h3 className="font-headline-lg text-2xl text-[#231a11] font-semibold tracking-tight">
            Log in to continue
          </h3>
          <p className="font-body-md text-sm text-[#55433d] leading-relaxed">
            {actionSource === "hold"
              ? "Verified members receive 15-minute escrow hold privileges to reserve one-of-a-kind vintage items."
              : actionSource === "sell"
              ? "Log in or register to set up your boutique and sell verified archival clothing."
              : actionSource === "wishlist"
              ? "Save one-of-one pieces to your curated wishlist and track price drops."
              : "Access verified 15-minute escrow hold protection, sync your curated wishlist, and place bids on live archival drops."}
          </p>
        </div>

        <div className="mt-6 space-y-3">
          <Link
            href="/login"
            onClick={onClose}
            className="w-full py-3 bg-[#974226] text-white rounded-full font-label-md text-sm hover:bg-[#b65a3c] transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-2 font-medium"
          >
            <span>Continue with Email</span>
          </Link>
          <Link
            href="/register"
            onClick={onClose}
            className="w-full py-3 border border-[#dbc1b9] bg-white text-[#231a11] rounded-full font-label-md text-sm hover:border-[#231a11] transition-colors flex items-center justify-center gap-2 font-medium"
          >
            <span>Create new account</span>
          </Link>
        </div>

        <div className="mt-6 pt-4 border-t border-[#dbc1b9]/30 text-center">
          <p className="font-label-sm text-[12px] text-[#55433d]">
            Protected by REWORE Escrow Guarantee &amp; Authentication Protocol.
          </p>
        </div>
      </div>
    </div>
  );
}

