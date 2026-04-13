import type { SessionDto, TaskDto, AttendanceDto } from "../types";

export const PALETTE = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export function initialsFromName(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].length >= 2 ? parts[0].slice(0, 2).toUpperCase() : parts[0].toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function ucForId(id: number): string {
  return PALETTE[(id - 1) % PALETTE.length];
}

export function fmtTime(iso: string | undefined | null): string {
  return iso ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";
}

export function fmtDate(iso: string | undefined | null): string {
  return iso ? new Date(iso).toLocaleDateString() : "—";
}

export type RemixUser = { id: number; name: string; initials: string; role: "manager" | "coordinator" };

export function RemixBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "dr-bpn",
    approved: "dr-bpa",
    rejected: "dr-bpr",
    todo: "dr-bado",
    "in-progress": "dr-bain",
    done: "dr-badn",
  };
  return <span className={`dr-badge ${map[status] ?? "dr-bpn"}`}>{status}</span>;
}

export function RemixAvatar({ user, size = 32 }: { user: RemixUser; size?: number }) {
  const bg = ucForId(user.id);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.37,
        fontWeight: 700,
        color: "#fff",
        flexShrink: 0,
      }}
    >
      {user.initials}
    </div>
  );
}

export type CoordinatorOption = { id: number; fullName: string; email: string };

export type SessionRow = SessionDto & { fileCount: number };
export function sessionToRow(s: SessionDto): SessionRow {
  return { ...s, fileCount: s.files?.length ?? 0 };
}

export function todayAttendanceRecord(attendance: AttendanceDto[], userId: number): AttendanceDto | undefined {
  const today = new Date().toDateString();
  return attendance.find((a) => a.userId === userId && new Date(a.clockIn).toDateString() === today);
}

export type LeaveRow = {
  id: number;
  userId: number;
  userName: string;
  type: string;
  start: string;
  end: string;
  reason: string;
  status: string;
  createdAt: string;
};
