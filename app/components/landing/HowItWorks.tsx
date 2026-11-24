export default function HowItWorks() {
  const steps = [
    { id: "step-discover", num: "01", icon: "search", title: "Khám phá", desc: "Xem đồ 2hand mới đăng và các phiên đấu giá. Lọc theo loại, hãng và tình trạng.", link: "/shop", linkText: "Xem đồ mới" },
    { id: "step-secure", num: "02", icon: "lock", title: "Giữ chỗ", desc: "Giữ hàng 15 phút để nhắn tin chốt đơn, hoặc đặt giá ở các phiên đấu giá. Tiền được sàn giữ đến khi bạn nhận hàng.", link: "/auctions", linkText: "Xem đấu giá" },
    { id: "step-trade", num: "03", icon: "handshake", title: "Giao dịch", desc: "Mua bán an tâm với điểm uy tín. Mỗi đơn hoàn tất thành công đều được cộng điểm.", link: "#trust", linkText: "Xem điểm uy tín" },
  ];

  return (
    <section className="section" id="how-it-works">
      <div className="container">
        <div className="section-header">
          <p className="section-eyebrow">Cách hoạt động</p>
          <h2 className="section-title">Mua bán đồ 2hand trong 3 bước</h2>
          <p className="section-sub">Ba bước đơn giản để tìm món đồ tiếp theo của bạn.</p>
        </div>
        <div className="steps-grid">
          {steps.map((step) => (
            <div className="step-card animate-in" id={step.id} key={step.id}>
              <div className="step-icon-wrap">
                <span className="material-symbols-outlined step-icon">{step.icon}</span>
              </div>
              <div className="step-number">{step.num}</div>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-desc">{step.desc}</p>
              <a href={step.link} className="step-link">
                {step.linkText}{" "}
                <span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: "middle" }}>arrow_forward</span>
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
