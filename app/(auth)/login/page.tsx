"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, setPendingOtpEmail } from "@/app/lib/api";
import { useAuth } from "@/app/context/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError("Please enter your email."); return; }
    if (!password) { setError("Please enter your password."); return; }
    setError("");
    setLoading(true);
    try {
      const signedInUser = await login(email, password);
      if (signedInUser.role === "ADMIN") {
        router.push("/admin");
      } else if (signedInUser.role === "SELLER") {
        router.push("/seller/dashboard");
      } else {
        router.push("/shop");
      }
    } catch (err) {
      if (err instanceof ApiError && err.requiresOtp) {
        const otpEmail = err.email ?? email.trim();
        setPendingOtpEmail(otpEmail);
        router.push(`/verify-otp?email=${encodeURIComponent(otpEmail)}`);
        return;
      }
      setError(err instanceof ApiError ? err.message : "Unable to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      {/* ── Left Hero Panel ── */}
      <div className="auth-hero">
        {/* Background Image */}
        <div className="auth-hero-bg">
          <Image
            src="/login-hero.png"
            alt="Vintage fashion editorial"
            fill
            style={{ objectFit: "cover", opacity: 0.82 }}
            priority
            sizes="50vw"
          />
          <div className="auth-hero-gradient" />
        </div>

        {/* Top branding */}
        <div className="auth-hero-top">
          <Link href="/" className="auth-brand-serif">EARTHEN ELEGANCE</Link>
          <p className="auth-brand-sub">A Secondhand Dream</p>
        </div>

        {/* Bottom tagline card */}
        <div className="auth-hero-bottom">
          <div className="auth-tagline-card">
            <h2 className="auth-tagline-title">Secondhand fashion drops, held fairly.</h2>
            <p className="auth-tagline-desc">
              Discover one-of-one vintage pieces, join live auctions, and trade with trust in our curated marketplace.
            </p>
          </div>
          <div className="auth-hero-footer">
            <Link href="/" className="auth-brand-primary">REWORE.</Link>
            <div className="auth-trust-seal">
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#974226", fontVariationSettings: "'FILL' 1" }}>verified</span>
              <span>Trust Verified Platform</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Form Panel ── */}
      <div className="auth-panel">
        <div className="auth-card">
          {/* Mobile logo */}
          <div className="auth-mobile-logo">
            <Link href="/" className="brand">REWORE</Link>
          </div>

          {/* Header */}
          <div className="auth-card-header">
            <h1 className="auth-card-title">Welcome back</h1>
            <p className="auth-card-sub">Sign in to your REWORE account.</p>
          </div>

          {/* Form */}
          <form className="auth-form" onSubmit={handleSubmit} id="loginForm" noValidate>
            {/* Email */}
            <div className="auth-field">
              <label className="auth-label" htmlFor="email">Email</label>
              <div className="auth-input-wrap">
                <span className="material-symbols-outlined auth-input-icon">mail</span>
                <input
                  id="email"
                  type="email"
                  className="auth-input"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="auth-field">
              <label className="auth-label" htmlFor="password">Password</label>
              <div className="auth-input-wrap">
                <span className="material-symbols-outlined auth-input-icon">lock</span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="auth-input auth-input-padded"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button type="button" className="auth-input-toggle" onClick={() => setShowPassword((v) => !v)} tabIndex={-1} aria-label="Toggle password">
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div className="auth-row">
              <label className="auth-checkbox-label">
                <input type="checkbox" className="auth-checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                <span>Remember me</span>
              </label>
              <Link
                href={email.trim() ? `/forgot-password?email=${encodeURIComponent(email.trim())}` : "/forgot-password"}
                className="auth-forgot"
              >
                Forgot password?
              </Link>
            </div>

            {/* Error */}
            {error && (
              <div className="auth-error">
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>error</span>
                {error}
              </div>
            )}

            {/* Sign In */}
            <button type="submit" className="auth-btn-primary" id="sign-in-btn" disabled={loading}>
              {loading ? (
                <><span className="auth-spinner" />Authenticating…</>
              ) : (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>login</span>
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Sign up link */}
          <p className="auth-signup-link">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="auth-link">Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}



