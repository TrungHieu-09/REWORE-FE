
const stats = [
  {
    label: "Total Sales (₫)",
    icon: "payments",
    value: "₫42,850,000",
    sub: <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full bg-[#dae9b5] text-[#556138]">
      <span className="material-symbols-outlined text-[14px]">arrow_upward</span>+18.4%
    </span>,
    subText: "vs last month",
  },
  {
    label: "Active Listings",
    icon: "checkroom",
    value: "38 items",
    sub: <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#ede1d2] text-[#6b6357]">4 pending review</span>,
    subText: "in moderation",
  },
  {
    label: "Pending Reservations",
    icon: "lock_clock",
    value: "6 active holds",
    sub: <span className="text-[12px] font-semibold text-[#974226]">₫5,200,000</span>,
    subText: "value committed",
  },
  {
    label: "Items in Draft",
    icon: "edit_document",
    value: "5 drafts",
    sub: <span className="text-[12px] font-semibold text-[#556138] flex items-center gap-1">
      <span className="material-symbols-outlined text-[14px]">bolt</span>Ready to publish
    </span>,
    subText: "",
  },
];

export default function SellerStatCards() {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
      {stats.map((s) => (
        <div
          key={s.label}
          className="bg-white rounded-2xl p-5 border border-[#dbc1b9]/30 shadow-[0_4px_24px_-4px_rgba(43,33,24,0.06)] flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-semibold text-[#55433d]">{s.label}</span>
            <span className="p-2 rounded-xl bg-[#fff1e8] text-[#974226]">
              <span className="material-symbols-outlined text-[20px]">{s.icon}</span>
            </span>
          </div>
          <div>
            <div className="text-[22px] font-bold text-[#231a11]" style={{ fontFamily: "'Playfair Display', serif" }}>
              {s.value}
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              {s.sub}
              {s.subText && <span className="text-[12px] text-[#655d52]">{s.subText}</span>}
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
