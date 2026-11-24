"use client";

import Image from "next/image";

export default function Hero() {
  return (
    <section className="hero" id="hero">
      <div className="hero-content">
        <div className="hero-badge">
          <span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: "'FILL' 1" }}>eco</span>
          Thời trang bền vững
        </div>
        <h1 className="hero-title">
          Cho quần áo<br />
          <em>một câu chuyện mới.</em>
        </h1>
        <p className="hero-subtitle">
          Đồ 2hand tuyển chọn, mỗi món chỉ có một chiếc. Mua bán an tâm trong cộng đồng uy tín.
        </p>
        <div className="hero-actions">
          <a href="/shop" className="btn-cta" id="hero-explore-btn">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>explore</span>
            Xem đồ mới
          </a>
          <a href="#how-it-works" className="btn-outline" id="hero-works-btn">
            REWORE hoạt động thế nào
          </a>
        </div>
        <div className="hero-stats">
          <div className="stat">
            <span className="stat-num">100K–500K</span>
            <span className="stat-label">Giá mỗi món</span>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <span className="stat-num">15 phút</span>
            <span className="stat-label">Giữ hàng để chốt đơn</span>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <span className="stat-num">5%</span>
            <span className="stat-label">Phí bán hàng</span>
          </div>
        </div>
      </div>

      <div className="hero-visual">
        <div className="hero-img-wrap">
          <Image
            src="/hero.png"
            alt="Cửa hàng đồ 2hand"
            fill
            className="hero-img"
            style={{ objectFit: "cover" }}
            priority
            sizes="(max-width:1024px) 100vw, 50vw"
          />
          <div className="hero-tag">
            <span className="tag-label">MỚI ĐĂNG</span>
            <span className="tag-title">Đồ 2hand tuần này</span>
            <span className="tag-items">Đồ vừa lên kệ</span>
          </div>
          <div className="hero-badge-floating">
            <span className="material-symbols-outlined" style={{ fontSize: 20, fontVariationSettings: "'FILL' 1", color: "#974226" }}>verified</span>
            <div>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#231a11", display: "block" }}>Giữ tiền an toàn</span>
              <span style={{ fontSize: 11, color: "#55433d" }}>Sàn giữ tiền đến khi bạn nhận hàng</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
