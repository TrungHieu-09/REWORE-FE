export default function TrustScore() {
  return (
    <section className="section trust-section" id="trust">
      <div className="container">
        <div className="trust-grid">
          <div className="trust-content">
            <p className="section-eyebrow">Cộng đồng là trên hết</p>
            <h2 className="section-title" style={{ textAlign: "left" }}>Mua bán an tâm</h2>
            <p className="trust-desc">
              Điểm uy tín giúp mọi người tin nhau hơn: mỗi đơn hoàn tất thành công đều cộng điểm cho cả người mua và người bán.
            </p>
            <ul className="trust-list">
              {[
                { icon: "shield_person", title: "Điểm uy tín", desc: "Mọi tài khoản bắt đầu từ 80 điểm. Điểm tăng khi hoàn tất đơn và giảm khi không thanh toán hay giao trễ." },
                { icon: "rate_review", title: "Đơn hàng rõ ràng", desc: "Theo dõi từng bước của đơn: đã thanh toán, đã gửi hàng, đã giao, hoàn tất." },
                { icon: "policy", title: "Sàn giữ tiền", desc: "Tiền của bạn được sàn giữ đến khi bạn xác nhận đã nhận hàng." },
              ].map((item) => (
                <li className="trust-item" key={item.title}>
                  <div className="trust-item-icon">
                    <span className="material-symbols-outlined">{item.icon}</span>
                  </div>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
            <a href="/login" className="btn-cta" id="trust-cta-btn" style={{ display: "inline-flex" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>verified_user</span>
              Đăng nhập để xem điểm
            </a>
          </div>

          <div className="trust-visual">
            <div className="trust-card-preview animate-in">
              <div className="trust-profile">
                <div className="trust-avatar">
                  <span className="material-symbols-outlined">person</span>
                </div>
                <div>
                  <p className="trust-name">Hồ sơ của bạn</p>
                  <p className="trust-since">Lấy từ hoạt động tài khoản</p>
                </div>
                <div className="trust-badge-verified">
                  <span className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}>verified</span>
                </div>
              </div>
              <div className="trust-score-display">
                <div className="trust-score-ring">
                  <svg viewBox="0 0 80 80" className="score-svg">
                    <circle cx="40" cy="40" r="34" fill="none" stroke="#f2dfd1" strokeWidth="8" />
                  </svg>
                  <span className="score-num">--</span>
                </div>
                <div className="trust-score-info">
                  <p className="score-label">Điểm uy tín</p>
                  <p className="score-trades">Có sau các giao dịch thật trên sàn.</p>
                </div>
              </div>
              <div className="trust-metrics">
                {[{ val: "--", lbl: "Tỉ lệ phản hồi" }, { val: "--", lbl: "Thời gian giao TB" }, { val: "--", lbl: "Khiếu nại" }].map((m) => (
                  <div className="metric" key={m.lbl}>
                    <span className="metric-val">{m.val}</span>
                    <span className="metric-lbl">{m.lbl}</span>
                  </div>
                ))}
              </div>
              <div className="trust-reviews-preview">
                <p className="review-text">Điểm của bạn thay đổi theo hành vi mua bán.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
