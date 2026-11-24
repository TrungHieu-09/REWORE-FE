"use client";

export default function WishlistIntro() {
  return (
    <section className="wishlist-intro-section" id="wishlist-intro">
      <div className="container wishlist-intro-inner">
        {/* ── Left copy ── */}
        <div className="wishlist-intro-copy">
          <span
            className="material-symbols-outlined wishlist-intro-icon"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            favorite
          </span>
          <p className="section-eyebrow" style={{ textAlign: "left" }}>Tủ đồ của bạn</p>
          <h2
            className="section-title"
            style={{ textAlign: "left", marginBottom: "20px" }}
          >
            Lưu những món<br />bạn thích
          </h2>
          <p className="wishlist-intro-desc">
            Lưu món bạn thích, theo dõi các phiên đấu giá và quay lại mua khi cần. Danh sách yêu thích giúp tủ đồ mơ ước của bạn luôn trong tầm tay.
          </p>

          <ul className="wishlist-intro-perks">
            {[
              { icon: "notifications", text: "Lưu món bạn thích" },
              { icon: "balance",               text: "Theo dõi món đấu giá" },
              { icon: "group",               text: "Xem lại bất cứ lúc nào" },
            ].map((p) => (
              <li key={p.icon} className="wishlist-intro-perk">
                <span className="material-symbols-outlined wishlist-perk-icon">
                  {p.icon}
                </span>
                {p.text}
              </li>
            ))}
          </ul>

          <a href="/login" className="btn-primary wishlist-intro-cta">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              login
            </span>
            Đăng nhập để bắt đầu lưu
          </a>
        </div>

        <div className="wishlist-intro-cards">
          <div className="wishlist-preview-card">
            <div className="wishlist-preview-img-wrap">
              <div className="admin-image-placeholder h-full">
                <span className="material-symbols-outlined">favorite</span>
                <span>Wishlist trống</span>
              </div>
              <span
                className="material-symbols-outlined wishlist-preview-heart"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                favorite
              </span>
            </div>
            <div className="wishlist-preview-body">
              <p className="wishlist-preview-name">Sản phẩm đã lưu sẽ hiện ở đây</p>
              <p className="wishlist-preview-price">Đăng nhập để đồng bộ wishlist từ backend.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
