import { useEffect, useMemo, useState } from "react";
import { apiJson } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import type { PageId } from "../types";
import type { SessionDto, TaskDto } from "../types";
import { Badge } from "../components/Badge";

export function DashboardPage({ setPage }: { setPage: (p: PageId) => void }) {
  const { user, isElevated } = useAuth();
  const [sessions, setSessions] = useState<SessionDto[]>([]);
  const [tasks, setTasks] = useState<TaskDto[]>([]);

  useEffect(() => {
    void (async () => {
      try {
        const [s, t] = await Promise.all([
          apiJson<SessionDto[]>("/api/sessions?status=all"),
          apiJson<TaskDto[]>("/api/tasks"),
        ]);
        setSessions(s);
        setTasks(t);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const stats = useMemo(() => {
    if (isElevated) {
      return [
        { label: "Total sessions", value: sessions.length },
        { label: "Pending sessions", value: sessions.filter((x) => x.status === "pending").length },
        { label: "Open tasks", value: tasks.filter((x) => x.status !== "done").length },
        { label: "Coordinators", value: "—" },
      ];
    }
    const mine = sessions.filter((x) => x.coordinatorUserId === user!.id);
    const myTasks = tasks.filter((x) => x.assigneeId === user!.id);
    return [
      { label: "My sessions", value: mine.length },
      { label: "Pending", value: mine.filter((x) => x.status === "pending").length },
      { label: "My open tasks", value: myTasks.filter((x) => x.status !== "done").length },
      { label: "Tasks done", value: myTasks.filter((x) => x.status === "done").length },
    ];
  }, [sessions, tasks, isElevated, user]);

  const recentSessions = useMemo(() => [...sessions].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 6), [sessions]);
  const recentTasks = useMemo(() => [...tasks].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 6), [tasks]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-600">
          Welcome back, <span className="font-semibold text-slate-900">{user?.fullName}</span>
        </p>
        <p className="text-xs text-slate-500">{new Date().toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card">
            <div className="text-3xl font-bold text-slate-900">{s.value}</div>
            <div className="text-sm text-slate-600">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">Attendance</div>
            <div className="text-xs text-slate-600">Clock in/out and view history</div>
          </div>
          <button type="button" className="btn-primary" onClick={() => setPage("attendance")}>
            Open attendance
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Recent sessions</h3>
            <button type="button" className="text-xs font-medium text-brand-600 hover:underline" onClick={() => setPage("sessions")}>
              View all
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {recentSessions.length === 0 && <div className="py-6 text-center text-sm text-slate-500">No sessions yet</div>}
            {recentSessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between py-2">
                <div>
                  <div className="text-sm font-semibold text-brand-600">{s.groupCode}</div>
                  <div className="text-xs text-slate-500">{s.trainerName || "—"}</div>
                </div>
                <Badge status={s.status} />
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Recent tasks</h3>
            <button type="button" className="text-xs font-medium text-brand-600 hover:underline" onClick={() => setPage("tasks")}>
              View all
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {recentTasks.length === 0 && <div className="py-6 text-center text-sm text-slate-500">No tasks yet</div>}
            {recentTasks.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-2">
                <div>
                  <div className="text-sm font-medium text-slate-900">{t.title}</div>
                  <div className="text-xs text-slate-500">{t.assigneeName}</div>
                </div>
                <Badge status={t.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
