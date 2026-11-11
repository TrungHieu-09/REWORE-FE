export default function CtaBanner() {
  return (
    <section className="cta-section" id="cta">
      <div className="container">
        <div className="cta-inner">
          <div className="cta-content">
            <h2 className="cta-title">Ready to give your wardrobe a second story?</h2>
            <p className="cta-sub">Join 8,400+ conscious fashion lovers trading verified vintage pieces every day.</p>
            <div className="cta-actions">
              <a href="/sell-with-us" className="btn-cta-light" id="cta-start-btn">
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>storefront</span>
                Start Selling Today
              </a>
              <a href="/shop" className="btn-outline-light" id="cta-browse-btn">Browse Drops</a>
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
