"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiError, authApi } from "@/app/lib/api";

type FrameStep = "frame-1" | "frame-2" | "frame-3" | "frame-4";

const RESEND_COOLDOWN_SECONDS = 60;

function maskEmail(rawEmail: string): string {
  const trimmed = rawEmail.trim();
  if (!trimmed || !trimmed.includes("@")) return "e***@email.com";
  const [local, domain] = trimmed.split("@");
  if (!local) return `***@${domain}`;
  const firstChar = local[0];
  return `${firstChar}***@${domain}`;
}

function ForgotPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeFrame, setActiveFrame] = useState<FrameStep>("frame-1");

  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  // Countdown timer on Frame 2
  useEffect(() => {
    if (activeFrame !== "frame-2" || resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [activeFrame, resendCooldown]);

  const switchFrame = (frame: FrameStep) => {
    setError("");
    setActiveFrame(frame);
  };

  // Password strength calculation for Frame 3
  const passwordStrength = useMemo(() => {
    if (!newPassword) {
      return { widthClass: "w-0", colorClass: "bg-[#556138]", label: "At least 8 characters" };
    }
    let score = 0;
    if (newPassword.length >= 8) score += 1;
    if (newPassword.length >= 12) score += 1;
    if (/[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword)) score += 1;
    if (/[^A-Za-z0-9]/.test(newPassword)) score += 1;

    if (newPassword.length < 8) {
      return {
        widthClass: "w-1/4",
        colorClass: "bg-[#a5502f]",
        label: `At least 8 characters (${newPassword.length}/8)`,
      };
    }
    if (score <= 2) {
      return {
        widthClass: "w-2/3",
        colorClass: "bg-[#556138]",
        label: "At least 8 characters • Good strength",
      };
    }
    return {
      widthClass: "w-full",
      colorClass: "bg-[#556138]",
      label: "Strong password",
    };
  }, [newPassword]);

  // Step 1: request a 6-digit code by email
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Please enter your email address.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await authApi.forgotPassword({ email: trimmed });
      setOtp("");
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      switchFrame("frame-2");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not send the code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: verify the code, then move on to the new password step
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(otp)) {
      setError("Please enter the 6-digit code.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await authApi.verifyResetOtp({ email: email.trim(), otp });
      setResetToken(res.resetToken);
      switchFrame("frame-3");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not verify the code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0 || !email.trim()) return;
    setError("");
    try {
      await authApi.forgotPassword({ email: email.trim() });
      setOtp("");
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      if (err instanceof ApiError && err.retryAfter) setResendCooldown(err.retryAfter);
      setError(err instanceof ApiError ? err.message : "Could not resend the code.");
    }
  };

  // Step 3: set the new password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Confirmation password does not match.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await authApi.resetPassword({ token: resetToken, password: newPassword });
      switchFrame("frame-4");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update the password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formattedCooldown = `00:${String(resendCooldown).padStart(2, "0")}`;

  return (
    <div className="bg-[#f7efe6] text-[#231a11] min-h-screen flex flex-col font-sans selection:bg-[#f2dfd1] selection:text-[#a5502f]">
      {/* Full-bleed Split Screen Layout */}
      <div className="w-full min-h-screen flex flex-col lg:flex-row">
        {/* LEFT HALF (50%): Full-bleed Editorial Vintage Visual */}
        <div className="w-full lg:w-1/2 relative min-h-[420px] lg:min-h-screen flex flex-col justify-between p-8 md:p-12 lg:p-16 overflow-hidden bg-[#2b2118]">
          {/* Background Visual */}
          <Image
            src="/login-hero.png"
            alt="Vintage tweed clothing and silk scarf still life"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover object-center saturate-[0.88] brightness-[0.92]"
          />
          {/* Ambient overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-black/75 pointer-events-none" />

          {/* Top-left Editorial Typography */}
          <div className="relative z-10 pt-2">
            <Link
              href="/"
              className="font-serif text-2xl lg:text-3xl tracking-[0.25em] uppercase text-white font-semibold drop-shadow-sm block"
            >
              EARTHEN ELEGANCE
            </Link>
            <p className="font-sans text-xs lg:text-sm italic tracking-widest text-[#f8e5d6]/90 mt-1">
              A Secondhand Dream
            </p>
          </div>

          {/* Bottom Editorial Area */}
          <div className="relative z-10 space-y-6">
            {/* Frosted Glass Quote Card */}
            <div className="backdrop-blur-md bg-black/40 border border-white/20 px-6 py-5 rounded-2xl shadow-xl max-w-md">
              <span className="material-symbols-outlined text-[#ffdbd0] text-xl mb-2 block">
                auto_awesome
              </span>
              <p className="font-serif italic text-white text-base lg:text-lg leading-snug">
                &ldquo;Secondhand fashion drops, held fairly.&rdquo;
              </p>
              <p className="text-[11px] uppercase tracking-wider text-[#dbc1b9] mt-2 font-medium">
                Curated Archives • Rare Provenance
              </p>
            </div>

            {/* Bottom Row: Wordmark & Verified Pill */}
            <div className="flex items-center justify-between pt-4 border-t border-white/20">
              <div>
                <Link
                  href="/"
                  className="font-serif text-2xl lg:text-3xl font-bold tracking-tight text-white block"
                >
                  REWORE.
                </Link>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/25 text-white text-xs font-medium">
                <span
                  className="material-symbols-outlined text-sm text-[#ffdbd0]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  verified
                </span>
                <span>Trust Verified Platform</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT HALF (50%): Centered White Card on Cream Background */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 lg:p-16 bg-[#f7efe6]">
          <div className="w-full max-w-[440px] bg-white rounded-[24px] shadow-[0_20px_50px_rgba(43,33,24,0.06)] border border-[#e5dacf]/40 p-8 sm:p-10 transition-all duration-300">
            {/* ================= FRAME 1: REQUEST RESET ================= */}
            {activeFrame === "frame-1" && (
              <div className="space-y-6">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#a5502f] hover:text-[#8e3f20] transition-colors group"
                >
                  <span className="material-symbols-outlined text-base transition-transform group-hover:-translate-x-0.5">
                    chevron_left
                  </span>
                  <span>Back to login</span>
                </Link>

                <div>
                  <h1 className="font-serif text-3xl font-bold text-gray-900 leading-tight">
                    Forgot password?
                  </h1>
                  <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                    Enter your email and we&apos;ll send you a 6-digit verification code.
                  </p>
                </div>

                <form className="space-y-5" onSubmit={handleRequestReset} noValidate>
                  <div>
                    <label
                      className="block text-xs uppercase tracking-wider font-bold text-gray-700 mb-1.5"
                      htmlFor="email-input"
                    >
                      Email
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <span className="material-symbols-outlined text-xl">mail</span>
                      </span>
                      <input
                        id="email-input"
                        type="email"
                        required
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-[50px] pl-11 pr-4 rounded-xl bg-[#fff8f5] border border-[#e5dacf] text-gray-900 text-sm focus:border-gray-900 focus:outline-none focus:ring-0 focus:bg-white transition-all placeholder:text-gray-400"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
                      <span className="material-symbols-outlined text-base">error</span>
                      <span>{error}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-[50px] bg-[#a5502f] hover:bg-[#8e3f20] disabled:opacity-60 text-white rounded-xl text-sm font-semibold tracking-wide transition-all shadow-[0_4px_12px_rgba(165,80,47,0.25)] flex items-center justify-center gap-2"
                  >
                    <span>{loading ? "Sending code..." : "Send code"}</span>
                    {!loading && (
                      <span className="material-symbols-outlined text-lg">arrow_forward</span>
                    )}
                  </button>
                </form>

                <div className="pt-2 text-center text-xs text-gray-500">
                  <span>Remember it? </span>
                  <Link href="/login" className="text-[#a5502f] font-semibold hover:underline">
                    Sign in
                  </Link>
                </div>
              </div>
            )}

            {/* ================= FRAME 2: ENTER CODE ================= */}
            {activeFrame === "frame-2" && (
              <form className="space-y-6" onSubmit={handleVerifyOtp} noValidate>
                <div>
                  <h2 className="font-serif text-3xl font-bold text-gray-900 leading-tight">
                    Check your email
                  </h2>
                  <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                    We sent a 6-digit code to{" "}
                    <span className="font-medium text-gray-900">{maskEmail(email)}</span>. It
                    expires in 5 minutes.
                  </p>
                </div>

                <div>
                  <label
                    className="block text-xs uppercase tracking-wider font-bold text-gray-700 mb-1.5"
                    htmlFor="reset-otp"
                  >
                    Verification code
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <span className="material-symbols-outlined text-xl">pin</span>
                    </span>
                    <input
                      id="reset-otp"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      autoComplete="one-time-code"
                      autoFocus
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      className="w-full h-[50px] pl-11 pr-4 rounded-xl bg-[#fff8f5] border border-[#e5dacf] text-gray-900 text-lg tracking-[0.4em] focus:border-gray-900 focus:outline-none focus:ring-0 focus:bg-white transition-all placeholder:text-gray-400 placeholder:tracking-normal placeholder:text-sm"
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
                    <span className="material-symbols-outlined text-base">error</span>
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-4">
                  <button
                    type="submit"
                    disabled={loading || otp.length !== 6}
                    className="w-full h-[50px] bg-[#a5502f] hover:bg-[#8e3f20] disabled:opacity-60 text-white rounded-xl text-sm font-semibold tracking-wide transition-all shadow-[0_4px_12px_rgba(165,80,47,0.25)] flex items-center justify-center gap-2"
                  >
                    <span>{loading ? "Verifying..." : "Verify code"}</span>
                    {!loading && (
                      <span className="material-symbols-outlined text-lg">arrow_forward</span>
                    )}
                  </button>

                  <p className="text-center text-xs text-gray-500">
                    Didn&apos;t get it?{" "}
                    {resendCooldown > 0 ? (
                      <span className="font-medium text-gray-700">
                        Resend in {formattedCooldown}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendCode}
                        className="font-semibold text-[#a5502f] hover:underline"
                      >
                        Resend code
                      </button>
                    )}
                  </p>
                </div>

                <div className="pt-4 border-t border-[#e5dacf]/40 text-center">
                  <button
                    type="button"
                    onClick={() => switchFrame("frame-1")}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#a5502f] hover:text-[#8e3f20] transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">chevron_left</span>
                    <span>Use a different email</span>
                  </button>
                </div>
              </form>
            )}

            {/* ================= FRAME 3: NEW PASSWORD ================= */}
            {activeFrame === "frame-3" && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-serif text-3xl font-bold text-gray-900 leading-tight">
                    Create new password
                  </h2>
                  <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                    Choose a password you haven&apos;t used before.
                  </p>
                </div>

                <form className="space-y-4" onSubmit={handleResetPassword} noValidate>
                  {/* New Password Field */}
                  <div>
                    <label
                      className="block text-xs uppercase tracking-wider font-bold text-gray-700 mb-1.5"
                      htmlFor="new-password"
                    >
                      New password
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <span className="material-symbols-outlined text-xl">lock</span>
                      </span>
                      <input
                        id="new-password"
                        type={showNewPassword ? "text" : "password"}
                        required
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full h-[50px] pl-11 pr-11 rounded-xl bg-[#fff8f5] border border-[#e5dacf] text-gray-900 text-sm focus:border-gray-900 focus:outline-none focus:ring-0 focus:bg-white transition-all placeholder:text-gray-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword((v) => !v)}
                        aria-label="Toggle new password visibility"
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-700"
                      >
                        <span className="material-symbols-outlined text-xl">
                          {showNewPassword ? "visibility_off" : "visibility"}
                        </span>
                      </button>
                    </div>

                    {/* Thin Strength Bar & Helper */}
                    <div className="mt-2 space-y-1">
                      <div className="w-full h-1 bg-[#e5dacf] rounded-full overflow-hidden flex">
                        <div
                          className={`h-full ${passwordStrength.widthClass} ${passwordStrength.colorClass} rounded-full transition-all duration-300`}
                        />
                      </div>
                      <p className="text-[11px] text-gray-500">{passwordStrength.label}</p>
                    </div>
                  </div>

                  {/* Confirm Password Field */}
                  <div>
                    <label
                      className="block text-xs uppercase tracking-wider font-bold text-gray-700 mb-1.5"
                      htmlFor="confirm-password"
                    >
                      Confirm password
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <span className="material-symbols-outlined text-xl">lock</span>
                      </span>
                      <input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        placeholder="Re-type new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full h-[50px] pl-11 pr-11 rounded-xl bg-[#fff8f5] border border-[#e5dacf] text-gray-900 text-sm focus:border-gray-900 focus:outline-none focus:ring-0 focus:bg-white transition-all placeholder:text-gray-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((v) => !v)}
                        aria-label="Toggle confirm password visibility"
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-700"
                      >
                        <span className="material-symbols-outlined text-xl">
                          {showConfirmPassword ? "visibility_off" : "visibility"}
                        </span>
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
                      <span className="material-symbols-outlined text-base">error</span>
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-[50px] bg-[#a5502f] hover:bg-[#8e3f20] disabled:opacity-60 text-white rounded-xl text-sm font-semibold tracking-wide transition-all shadow-[0_4px_12px_rgba(165,80,47,0.25)] flex items-center justify-center gap-2 pt-0.5"
                  >
                    <span>{loading ? "Updating password..." : "Reset password"}</span>
                  </button>
                </form>

                <div className="text-center">
                  <Link
                    href="/login"
                    className="text-xs text-gray-500 hover:text-gray-800 transition-colors"
                  >
                    Cancel and return to sign in
                  </Link>
                </div>
              </div>
            )}

            {/* ================= FRAME 4: SUCCESS ================= */}
            {activeFrame === "frame-4" && (
              <div className="space-y-6 text-center py-2">
                {/* Small Olive Green Circle with Checkmark (<48px) */}
                <div className="w-12 h-12 rounded-full bg-[#556138]/15 text-[#556138] mx-auto flex items-center justify-center">
                  <span
                    className="material-symbols-outlined text-2xl"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    check
                  </span>
                </div>

                <div>
                  <h2 className="font-serif text-3xl font-bold text-gray-900 leading-tight">
                    Password updated
                  </h2>
                  <p className="text-sm text-gray-600 mt-2 leading-relaxed max-w-xs mx-auto">
                    You can now sign in with your new password.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="w-full h-[50px] bg-[#a5502f] hover:bg-[#8e3f20] text-white rounded-xl text-sm font-semibold tracking-wide transition-all shadow-[0_4px_12px_rgba(165,80,47,0.25)] flex items-center justify-center gap-2"
                >
                  <span>Back to login</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f7efe6] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-[#a5502f] border-t-transparent animate-spin" />
        </div>
      }
    >
      <ForgotPasswordContent />
    </Suspense>
  );
}

