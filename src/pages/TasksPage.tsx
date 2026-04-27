import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { apiJson } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import type { TaskDto } from "../types";


type UserRow = { id: number; email: string; fullName: string; role: string };

export function TasksPage() {
  const { isElevated } = useAuth();
  const [tasks, setTasks] = useState<TaskDto[]>([]);
  const [coords, setCoords] = useState<UserRow[]>([]);
  const [show, setShow] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [assigneeId, setAssigneeId] = useState<number | "">("");
  const [priority, setPriority] = useState("medium");
  const [deadline, setDeadline] = useState("");

  const load = async () => setTasks(await apiJson<TaskDto[]>("/api/tasks"));

  useEffect(() => {
    void load().catch(() => {});
  }, []);

  useEffect(() => {
    if (!isElevated) return;
    void (async () => {
      try {
        const all = await apiJson<UserRow[]>("/api/users/all");
        setCoords(all.filter((u) => u.role === "Coordinator"));
      } catch {
        /* ignore */
      }
    })();
  }, [isElevated]);

  const cols = useMemo(() => ["todo", "in-progress", "done"] as const, []);
  const label: Record<string, string> = { todo: "To do", "in-progress": "In progress", done: "Done" };

  const create = async () => {
    if (!title || !assigneeId) return;
    await apiJson("/api/tasks", {
      method: "POST",
      body: JSON.stringify({ title, description: desc, assigneeId, priority, deadline }),
    });
    setShow(false);
    setTitle("");
    setDesc("");
    setAssigneeId("");
    setDeadline("");
    await load();
  };

  const patchStatus = async (id: number, status: string) => {
    await apiJson(`/api/tasks/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
    await load();
  };

  const del = async (id: number) => {
    if (!window.confirm("Delete task?")) return;
    await apiJson(`/api/tasks/${id}`, { method: "DELETE" });
    await load();
  };

  const pc: Record<string, string> = { high: "#ef4444", medium: "#f59e0b", low: "#10b981" };

  return (
    <div className="space-y-4">
      {isElevated && (
        <div className="flex justify-end">
          <button type="button" className="btn-primary" onClick={() => setShow(true)}>
            <Plus className="h-4 w-4" />
            Assign task
          </button>
        </div>
      )}

      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={(e) => e.target === e.currentTarget && setShow(false)}>
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">Assign task</h3>
              <button type="button" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" onClick={() => setShow(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="label">Title *</label>
                <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Assignee *</label>
                  <select className="input" value={assigneeId === "" ? "" : String(assigneeId)} onChange={(e) => setAssigneeId(e.target.value ? Number(e.target.value) : "")}>
                    <option value="">Select…</option>
                    {coords.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.fullName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Priority</label>
                  <select className="input" value={priority} onChange={(e) => setPriority(e.target.value)}>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Deadline</label>
                <input className="input" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input min-h-[90px]" value={desc} onChange={(e) => setDesc(e.target.value)} />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setShow(false)}>
                Cancel
              </button>
              <button type="button" className="btn-primary" onClick={() => void create()}>
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {cols.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col);
          return (
            <div key={col}>
              <div className="mb-2 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full" style={{ background: col === "todo" ? "#6366f1" : col === "in-progress" ? "#f59e0b" : "#10b981" }} />
                <div className="text-sm font-semibold text-slate-800">{label[col]}</div>
                <div className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{colTasks.length}</div>
              </div>
              <div className="space-y-2">
                {colTasks.length === 0 && <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-sm text-slate-500">No tasks</div>}
                {colTasks.map((t) => (
                  <div key={t.id} className="card space-y-2 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ background: `${pc[t.priority]}22`, color: pc[t.priority] }}>
                        {t.priority}
                      </span>
                      {isElevated && (
                        <button type="button" className="text-slate-300 hover:text-red-500" onClick={() => void del(t.id)}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <div className="font-medium text-slate-900">{t.title}</div>
                    {t.description && <div className="text-xs text-slate-600">{t.description}</div>}
                    <div className="text-xs text-slate-500">
                      {t.assigneeName}
                      {t.deadline ? ` · ${t.deadline}` : ""}
                    </div>
                    <select className="input py-1 text-xs" value={t.status} onChange={(e) => void patchStatus(t.id, e.target.value)}>
                      <option value="todo">To do</option>
                      <option value="in-progress">In progress</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
