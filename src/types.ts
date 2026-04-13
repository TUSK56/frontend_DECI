export type PageId =
  | "dashboard"
  | "tasks"
  | "sessions"
  | "chat"
  | "users"
  | "settings"
  | "profile"
  | "attendance"
  | "leaves"
  | "reports";

export interface SessionDto {
  id: number;
  coordinatorUserId: number;
  coordinatorName: string;
  groupCode: string;
  trainerName: string;
  sessionDate: string;
  sessionLink?: string | null;
  recordingLink?: string | null;
  notes?: string | null;
  status: string;
  createdAt: string;
  files: { kind: string; url: string; originalName: string }[];
}

export interface TaskDto {
  id: number;
  title: string;
  description?: string | null;
  assigneeId: number;
  assigneeName: string;
  createdById: number;
  priority: string;
  deadline?: string | null;
  status: string;
  createdAt: string;
}

export interface ChatDto {
  id: number;
  userId: number;
  userName: string;
  initials: string;
  text: string;
  sentAt: string;
}

export interface NotifDto {
  id: number;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
}

export interface AttendanceDto {
  id: number;
  userId: number;
  userName: string;
  clockIn: string;
  clockOut?: string | null;
  ip?: string | null;
  dateLabel: string;
}

export interface SystemSettingsDto {
  shiftStart: string;
  shiftEnd: string;
  ipTrackingEnabled: boolean;
  sessionApprovalRequired: boolean;
}
