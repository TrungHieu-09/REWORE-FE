export default function Ticker() {
  const items = [
    "Thời trang bền vững", "Đồ 2hand tuyển chọn", "Điểm uy tín minh bạch",
    "Đấu giá trực tiếp", "Mua bán tuần hoàn", "Mỗi món một chiếc", "Tủ đồ xanh",
    "Thời trang bền vững", "Đồ 2hand tuyển chọn", "Điểm uy tín minh bạch",
    "Đấu giá trực tiếp", "Mua bán tuần hoàn", "Mỗi món một chiếc", "Tủ đồ xanh",
  ];
  return (
    <div className="ticker-wrap">
      <div className="ticker-track">
        {items.map((item, i) => (
          <span key={i}>✦ {item}</span>
        ))}
      </div>
    </div>
  );
}
