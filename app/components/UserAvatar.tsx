import { apiAssetUrl } from "@/app/lib/api";

// Bảng màu ấm theo phong cách REWORE. Màu chọn theo tên nên cùng một người luôn cùng một màu.
const PALETTE = [
  { bg: "#feeadc", fg: "#974226" },
  { bg: "#dae9b5", fg: "#3f4b25" },
  { bg: "#f2dfd1", fg: "#55433d" },
  { bg: "#ffdbd0", fg: "#7b2e14" },
  { bg: "#ede1d2", fg: "#4d463b" },
];

export function getInitial(name?: string | null) {
  const trimmed = (name ?? "").trim();
  return trimmed ? Array.from(trimmed)[0].toUpperCase() : "?";
}

function paletteFor(name?: string | null) {
  const text = (name ?? "").trim();
  let hash = 0;
  for (const char of text) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

// Ảnh đại diện; chưa có ảnh thì hiện chữ cái đầu của tên như các nền tảng khác.
export default function UserAvatar({
  name,
  avatar,
  size = 40,
  className = "",
}: {
  name?: string | null;
  avatar?: string | null;
  size?: number;
  className?: string;
}) {
  const src = avatar ? apiAssetUrl(avatar) : "";
  const { bg, fg } = paletteFor(name);
  return (
    <span
      className={`relative inline-flex items-center justify-center rounded-full overflow-hidden shrink-0 font-bold select-none ${className}`}
      style={{ width: size, height: size, background: bg, color: fg, fontSize: Math.round(size * 0.42) }}
      aria-label={name ?? "Avatar"}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name ?? "Avatar"} className="w-full h-full object-cover" />
      ) : (
        getInitial(name)
      )}
    </span>
  );
}
