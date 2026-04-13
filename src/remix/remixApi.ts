import { apiJson, apiUrl, getToken } from "../api/client";
import type { SessionDto, TaskDto, ChatDto, AttendanceDto } from "../types";
import type { LeaveRow } from "./remixCommon";

export async function fetchAttendance(): Promise<AttendanceDto[]> {
  return apiJson<AttendanceDto[]>("/api/attendance");
}

export async function clockIn(): Promise<void> {
  await apiJson("/api/attendance/clock-in", { method: "POST" });
}

export async function clockOut(): Promise<void> {
  await apiJson("/api/attendance/clock-out", { method: "POST" });
}

export async function fetchLeaves(): Promise<LeaveRow[]> {
  return apiJson<LeaveRow[]>("/api/leaves");
}

export async function createLeave(body: { type: string; start: string; end: string; reason: string }): Promise<void> {
  await apiJson("/api/leaves", { method: "POST", body: JSON.stringify(body) });
}

export async function decideLeave(id: number, status: string): Promise<void> {
  await apiJson(`/api/leaves/${id}/decide`, { method: "POST", body: JSON.stringify({ status }) });
}

export async function fetchSessions(search?: string, status?: string): Promise<SessionDto[]> {
  const q = new URLSearchParams();
  if (search) q.set("search", search);
  if (status && status !== "all") q.set("status", status);
  const qs = q.toString();
  return apiJson<SessionDto[]>(`/api/sessions${qs ? `?${qs}` : ""}`);
}

export async function createSession(fd: FormData): Promise<void> {
  const headers = new Headers();
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(apiUrl("/api/sessions"), { method: "POST", body: fd, headers });
  if (!res.ok) throw new Error(await res.text());
}

export async function decideSession(id: number, status: string): Promise<void> {
  await apiJson(`/api/sessions/${id}/decide`, { method: "POST", body: JSON.stringify({ status }) });
}

export async function fetchTasks(): Promise<TaskDto[]> {
  return apiJson<TaskDto[]>("/api/tasks");
}

export async function createTask(body: { title: string; description?: string; assigneeId: number; priority: string; deadline?: string }): Promise<void> {
  await apiJson("/api/tasks", { method: "POST", body: JSON.stringify(body) });
}

export async function patchTaskStatus(id: number, status: string): Promise<void> {
  await apiJson(`/api/tasks/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
}

export async function deleteTask(id: number): Promise<void> {
  await apiJson(`/api/tasks/${id}`, { method: "DELETE" });
}

export async function fetchChat(): Promise<ChatDto[]> {
  return apiJson<ChatDto[]>("/api/chat?take=200");
}

export async function postChat(text: string): Promise<void> {
  await apiJson("/api/chat", { method: "POST", body: JSON.stringify({ text }) });
}

export async function fetchTrainers(): Promise<{ id: number; name: string }[]> {
  return apiJson<{ id: number; name: string }[]>("/api/catalog/trainers");
}

export async function fetchAssignableCoordinators(): Promise<{ id: number; fullName: string; email: string }[]> {
  return apiJson<{ id: number; fullName: string; email: string }[]>("/api/users/assignable-coordinators");
}
