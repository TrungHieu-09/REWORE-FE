export default function CtaBanner() {
  return (
    <section className="cta-section" id="cta">
      <div className="container">
        <div className="cta-inner">
          <div className="cta-content">
            <h2 className="cta-title">Sẵn sàng cho quần áo một câu chuyện mới?</h2>
            <p className="cta-sub">Bán đồ bạn không dùng nữa hoặc săn đồ 2hand giá tốt. Sàn giữ tiền hộ cả người mua và người bán.</p>
            <div className="cta-actions">
              <a href="/seller/products/new" className="btn-cta-light" id="cta-start-btn">
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>storefront</span>
                Bắt đầu bán đồ
              </a>
              <a href="/shop" className="btn-outline-light" id="cta-browse-btn">Xem đồ mới</a>
            </div>
          </div>
          <div className="cta-decoration" aria-hidden="true">
            <div className="cta-circle c1" />
            <div className="cta-circle c2" />
            <div className="cta-circle c3" />
          </div>
        </div>
      </div>
    </section>
  );
}
