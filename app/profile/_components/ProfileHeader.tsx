"use client";

import { useEffect, useState } from "react";
import UserAvatar from "@/app/components/UserAvatar";
import { useAuth } from "@/app/context/AuthContext";

function memberSince(createdAt?: string) {
  if (!createdAt) return "Member";
  return `Member since ${new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(new Date(createdAt))}`;
}

export default function ProfileHeader() {
  const [scoreVisible, setScoreVisible] = useState(false);
  const { user } = useAuth();
  const buyerScore = Math.max(0, Math.min(100, user?.reputation ?? 0));
  const displayName = user?.name ?? "REWORE User";
  const handle = user?.email ? `@${user.email.split("@")[0]}` : "@rewore";

  useEffect(() => {
    const t = setTimeout(() => setScoreVisible(true), 400);
    return () => clearTimeout(t);
  }, []);

  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (scoreVisible ? (buyerScore / 100) * circumference : circumference);

  return (
    <section className="bg-white rounded-[20px] shadow-[0_10px_40px_-10px_rgba(43,33,24,0.08)] border border-[#dbc1b9]/30 p-7 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-56 h-56 bg-[#fff1e8] rounded-full blur-3xl opacity-40 -translate-y-1/3 translate-x-1/4 pointer-events-none" />

      <div className="relative shrink-0 z-10">
        <UserAvatar name={displayName} avatar={user?.avatar} size={112} className="border border-[#dbc1b9]/30 shadow-sm" />
      </div>

      <div className="flex-1 text-center sm:text-left z-10 pt-1">
        <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
          <h1 className="font-[family-name:var(--font-playfair)] text-[32px] font-semibold leading-[1.3] text-[#231a11]">
            {displayName}
          </h1>
          {user?.isVerified && (
            <span
              className="material-symbols-outlined text-[22px] text-[#974226]"
              style={{ fontVariationSettings: "'FILL' 1" }}
              title="Verified"
            >
              check_circle
            </span>
          )}
        </div>
        <p className="text-[#55443d] text-[15px] mb-4">
          {handle} · {memberSince(user?.createdAt)} · {user?.role ?? "BUYER"}
        </p>
        {user?.bio && <p className="text-[#231a11] text-sm mb-4 max-w-xl whitespace-pre-line">{user.bio}</p>}
        <a href="/profile#settings" className="inline-block font-semibold text-[13px] tracking-wide px-6 py-2 rounded-full border border-[#974226] text-[#974226] hover:bg-[#974226] hover:text-white transition-colors duration-300">
          Edit Profile
        </a>
      </div>

      <div className="hidden lg:flex relative z-10 w-[88px] h-[88px] items-center justify-center">
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#f2dfd1" strokeWidth="6" />
          <circle
            cx="50" cy="50" r={radius} fill="none"
            stroke="#6d7a4f" strokeWidth="6" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 1.2s ease-out" }}
          />
        </svg>
        <span className="font-[family-name:var(--font-playfair)] text-[28px] font-bold text-[#231a11] relative z-10 leading-none">
          {buyerScore}
        </span>
      </div>
    </section>
  );
}
