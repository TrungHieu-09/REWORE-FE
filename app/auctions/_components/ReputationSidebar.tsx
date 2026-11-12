"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";

export default function ReputationSidebar() {
  const { user } = useAuth();
  const [barWidth, setBarWidth] = useState(0);
  const trustScore = user?.reputation ?? 0;

  useEffect(() => {
    const t = setTimeout(() => setBarWidth(trustScore), 300);
    return () => clearTimeout(t);
  }, [trustScore]);

  return (
    <aside className="w-full md:w-80 flex-shrink-0 flex flex-col gap-5 md:sticky md:top-24 md:self-start">
      {/* ── Reputation Card ── */}
      <div className="bg-white rounded-[20px] p-6 shadow-[0_4px_24px_-4px_rgba(43,33,24,0.10)] border border-[#f2dfd1] transition-all duration-300 hover:shadow-[0_12px_32px_-8px_rgba(43,33,24,0.15)] hover:-translate-y-1">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-full bg-[#feeadc] flex items-center justify-center text-[#974226] flex-shrink-0">
            <span className="material-symbols-outlined text-[20px]">
              verified_user
            </span>
          </div>
          <div>
            <h3 className="font-[family-name:var(--font-playfair)] text-base font-semibold text-[#231a11]">
              Your Reputation
            </h3>
            <p className="text-[11px] text-[#88726c] font-medium tracking-wide">
              Verified Buyer
            </p>
          </div>
        </div>

        {/* Trust Score */}
        <div className="bg-[#fff8f5] rounded-xl p-4">
          <div className="flex justify-between items-center mb-2.5">
            <span className="text-xs font-semibold text-[#55443d] tracking-wide">
              Trust Score
            </span>
            <span className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[#974226]">
              {trustScore}
            </span>
          </div>

          {/* Animated progress bar */}
          <div className="h-2 rounded-full bg-[#f2dfd1] overflow-hidden mb-3">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#974226] to-[#b65a3c] transition-all duration-1000 ease-out"
              style={{ width: `${barWidth}%` }}
            />
          </div>

          <p className="flex items-center gap-1.5 text-[11px] text-[#556138] font-medium">
            <span className="material-symbols-outlined text-[13px]">
              check_circle
            </span>
            Eligible for bids
          </p>
        </div>
      </div>

      {/* ── Active Bids Card ── */}
      <div className="bg-white rounded-[20px] p-6 shadow-[0_4px_24px_-4px_rgba(43,33,24,0.10)] border border-[#f2dfd1] transition-all duration-300 hover:shadow-[0_12px_32px_-8px_rgba(43,33,24,0.15)] hover:-translate-y-1">
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-[family-name:var(--font-playfair)] text-base font-semibold text-[#231a11]">
            My Active Bids
          </h3>
          <button className="text-[#974226] text-xs font-semibold hover:underline tracking-wide">
            View All
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <div className="rounded-xl bg-[#fff8f5] border border-[#f2dfd1] p-4 text-center text-xs font-medium text-[#88726c]">
            Chưa có bid đang hoạt động.
          </div>
        </div>

        <button
          className="
            w-full mt-5 py-2.5 border border-[#88726c] text-[#231a11]
            rounded-xl text-xs font-semibold tracking-wide
            hover:bg-[#f2dfd1] transition-colors duration-200
          "
        >
          Manage Bids
        </button>
      </div>
    </aside>
  );
}
