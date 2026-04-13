import { apiUrl } from "../api/client";

const PALETTE = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

function colorForId(id: number) {
  return PALETTE[(id - 1) % PALETTE.length];
}

function initialsFromName(name: string) {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return "?";
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return `${p[0][0]}${p[p.length - 1][0]}`.toUpperCase();
}

export function Avatar({
  userId,
  name,
  imageUrl,
  size = 36,
}: {
  userId: number;
  name: string;
  imageUrl?: string | null;
  size?: number;
}) {
  if (imageUrl) {
    const src = imageUrl.startsWith("http") ? imageUrl : apiUrl(imageUrl);
    return (
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        className="rounded-full border border-slate-200 object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  const initials = initialsFromName(name);
  return (
    <div
      className="flex items-center justify-center rounded-full font-bold text-white"
      style={{ width: size, height: size, fontSize: size * 0.36, background: colorForId(userId) }}
    >
      {initials}
    </div>
  );
}
