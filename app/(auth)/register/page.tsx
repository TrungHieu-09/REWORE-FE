"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/app/lib/api";
import { useAuth } from "@/app/context/AuthContext";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) { setError("Please enter your full name."); return; }
    if (!email) { setError("Please enter your email address."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    if (!agree) { setError("Please agree to the Terms of Service and Privacy Policy."); return; }
    setError("");
    setLoading(true);
    try {
      const res = await register({ email, password, name: fullName.trim() });
      const otpEmail = res.email ?? email.trim();
      router.push(`/verify-otp?email=${encodeURIComponent(otpEmail)}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = (() => {
    if (password.length === 0) return null;
    if (password.length < 6) return "weak";
    if (password.length < 10 || !/[^a-zA-Z0-9]/.test(password)) return "medium";
    return "strong";
  })();

  return (
    <div className="auth-layout">
      <div className="auth-hero">
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
        <div className="auth-hero-top">
          <Link href="/" className="auth-brand-serif">EARTHEN ELEGANCE</Link>
          <p className="auth-brand-sub">A Secondhand Dream</p>
        </div>
        <div className="auth-hero-bottom">
          <div className="auth-tagline-card">
            <h2 className="auth-tagline-title">Join a community that cares about fashion & planet.</h2>
            <p className="auth-tagline-desc">
              Tạo tài khoản miễn phí để mua đồ 2hand giá tốt, tham gia đấu giá và bán đồ cũ của bạn.
            </p>
          </div>
          <div className="auth-hero-footer">
            <Link href="/" className="auth-brand-primary">REWORE.</Link>
            <div className="auth-trust-seal">
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#974226", fontVariationSettings: "'FILL' 1" }}>verified</span>
              <span>Sàn giữ tiền an toàn</span>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-panel">
        <div className="auth-card">
          <div className="auth-mobile-logo">
            <Link href="/" className="brand">REWORE</Link>
          </div>
          <div className="auth-card-header">
            <h1 className="auth-card-title">Create your account</h1>
            <p className="auth-card-sub">We&apos;ll email you a verification code.</p>
          </div>
          <form className="auth-form" onSubmit={handleSubmit} id="registerForm" noValidate>
            <div className="auth-field">
              <label className="auth-label" htmlFor="fullName">Full Name</label>
              <div className="auth-input-wrap">
                <span className="material-symbols-outlined auth-input-icon">person</span>
                <input
                  id="fullName"
                  type="text"
                  className="auth-input"
                  placeholder="Jane Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoComplete="name"
                />
              </div>
            </div>
            <div className="auth-field">
              <label className="auth-label" htmlFor="reg-email">Email</label>
              <div className="auth-input-wrap">
                <span className="material-symbols-outlined auth-input-icon">mail</span>
                <input
                  id="reg-email"
                  type="email"
                  className="auth-input"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>
            <div className="auth-field">
              <label className="auth-label" htmlFor="reg-password">Password</label>
              <div className="auth-input-wrap">
                <span className="material-symbols-outlined auth-input-icon">lock</span>
                <input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  className="auth-input auth-input-padded"
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <button type="button" className="auth-input-toggle" onClick={() => setShowPassword((v) => !v)} tabIndex={-1} aria-label="Toggle password">
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
              {passwordStrength && (
                <div className="auth-strength-wrap">
                  <div className={`auth-strength-bar auth-strength-${passwordStrength}`} />
                  <span className={`auth-strength-label auth-strength-label-${passwordStrength}`}>
                    {passwordStrength === "weak" ? "Weak" : passwordStrength === "medium" ? "Medium" : "Strong"}
                  </span>
                </div>
              )}
            </div>
            <div className="auth-field">
              <label className="auth-label" htmlFor="confirmPassword">Confirm Password</label>
              <div className="auth-input-wrap">
                <span className="material-symbols-outlined auth-input-icon">lock_reset</span>
                <input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  className={`auth-input auth-input-padded${confirmPassword && confirmPassword !== password ? " auth-input-error" : confirmPassword && confirmPassword === password ? " auth-input-success" : ""}`}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <button type="button" className="auth-input-toggle" onClick={() => setShowConfirm((v) => !v)} tabIndex={-1} aria-label="Toggle confirm password">
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                    {showConfirm ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
              {confirmPassword && confirmPassword !== password && (
                <p className="auth-field-hint auth-field-hint-error">Passwords do not match</p>
              )}
              {confirmPassword && confirmPassword === password && (
                <p className="auth-field-hint auth-field-hint-success">Passwords match ✓</p>
              )}
            </div>
            <label className="auth-checkbox-label">
              <input
                type="checkbox"
                className="auth-checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                id="agreeTerms"
              />
              <span>
                I agree to the{" "}
                <button
                  type="button"
                  onClick={() => alert("Điều khoản dịch vụ của REWORE: Tất cả giao dịch đồ secondhand được xác thực và bảo vệ quyền lợi người mua & người bán.")}
                  className="auth-link cursor-pointer bg-transparent border-none p-0 underline text-inherit"
                >
                  Terms of Service
                </button>
                {" "}and{" "}
                <button
                  type="button"
                  onClick={() => alert("Chính sách bảo mật của REWORE: Dữ liệu cá nhân của bạn luôn được mã hóa và bảo mật tối đa.")}
                  className="auth-link cursor-pointer bg-transparent border-none p-0 underline text-inherit"
                >
                  Privacy Policy
                </button>
              </span>
            </label>
            {error && (
              <div className="auth-error">
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>error</span>
                {error}
              </div>
            )}
            <button type="submit" className="auth-btn-primary" id="create-account-btn" disabled={loading}>
              {loading ? (
                <><span className="auth-spinner" />Sending OTP...</>
              ) : (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>person_add</span>
                  Create Account
                </>
              )}
            </button>
          </form>
          <p className="auth-signup-link">
            Already have an account?{" "}
            <Link href="/login" className="auth-link">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}



