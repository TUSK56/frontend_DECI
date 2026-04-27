import { useState, useEffect, useRef } from "react";
import {
  Clock,
  Calendar,
  FileText,
  CheckSquare,
  MessageSquare,

  Plus,
  Search,
  Download,
  Upload,
  Eye,
  Send,

  AlertCircle,
  Trash2,
  X,
} from "lucide-react";
import type { SessionDto, TaskDto, ChatDto, AttendanceDto } from "../types";
import {
  RemixBadge,
  RemixAvatar,
  fmtTime,
  todayAttendanceRecord,
  initialsFromName,
  type RemixUser,
  type LeaveRow,
  type CoordinatorOption,
  ucForId,
} from "./remixCommon";
import {
  clockIn,
  clockOut,
  createLeave,
  decideLeave,
  createSession,
  decideSession,
  createTask,
  patchTaskStatus,
  deleteTask,
  postChat,
} from "./remixApi";

export function RemixDashboard({
  user,
  attendance,
  leaves,
  sessions,
  tasks,
  setPage,
  teamCount,
}: {
  user: RemixUser;
  attendance: AttendanceDto[];
  leaves: LeaveRow[];
  sessions: SessionDto[];
  tasks: TaskDto[];
  setPage: (p: string) => void;
  teamCount: number;
}) {

  const todayRec = todayAttendanceRecord(attendance, user.id);
  const isManager = user.role === "manager";
  const stats = isManager
    ? [
        { l: "Total Sessions", v: sessions.length, c: "#6366f1", icon: FileText },
        {
          l: "Pending Approvals",
          v: sessions.filter((s) => s.status === "pending").length + leaves.filter((l) => l.status === "pending").length,
          c: "#f59e0b",
          icon: AlertCircle,
        },
        { l: "Open Tasks", v: tasks.filter((t) => t.status !== "done").length, c: "#0ea5e9", icon: CheckSquare },
        { l: "Team Members", v: teamCount, c: "#10b981", icon: MessageSquare },
      ]
    : [
        { l: "My Sessions", v: sessions.filter((s) => s.coordinatorUserId === user.id).length, c: "#6366f1", icon: FileText },
        {
          l: "Pending Issues",
          v: leaves.filter((l) => l.userId === user.id && l.status === "pending").length,
          c: "#f59e0b",
          icon: Calendar,
        },
        {
          l: "My Open Tasks",
          v: tasks.filter((t) => t.assigneeId === user.id && t.status !== "done").length,
          c: "#0ea5e9",
          icon: CheckSquare,
        },
        {
          l: "Today",
          v: todayRec ? (todayRec.clockOut ? "Done" : "Active") : "Not In",
          c: "#10b981",
          icon: Clock,
        },
      ];
  const recSess = [...sessions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 6);
  const recTasks = [...tasks].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 6);
  return (
    <div>
      <p style={{ color: "#64748b", fontSize: 14, marginBottom: 4 }}>
        Welcome back, <strong style={{ color: "#1e293b" }}>{user.name}</strong> 👋
      </p>
      <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 24 }}>
        {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16, marginBottom: 24 }}>
        {stats.map(({ l, v, c, icon: Icon }) => (
          <div key={l} className="dr-card" style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: `${c}20`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon size={22} color={c} />
            </div>
            <div>
              <div style={{ fontSize: 26, fontWeight: 700, color: "#1e293b" }}>{v}</div>
              <div style={{ fontSize: 13, color: "#64748b" }}>{l}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="dr-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "#1e293b" }}>Recent session activity</h3>
            <button type="button" onClick={() => setPage("sessions")} style={{ fontSize: 12, color: "#6366f1", background: "none", border: "none", cursor: "pointer" }}>
              View all
            </button>
          </div>
          {recSess.length === 0 ? (
            <p style={{ textAlign: "center", color: "#94a3b8", fontSize: 13, padding: 16 }}>No sessions yet</p>
          ) : (
            recSess.map((s) => (
              <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#6366f1" }}>{s.groupCode}</div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>{s.trainerName || "—"}</div>
                </div>
                <RemixBadge status={s.status} />
              </div>
            ))
          )}
        </div>
        <div className="dr-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "#1e293b" }}>Recent Tasks</h3>
            <button type="button" onClick={() => setPage("tasks")} style={{ fontSize: 12, color: "#6366f1", background: "none", border: "none", cursor: "pointer" }}>
              View all
            </button>
          </div>
          {recTasks.length === 0 ? (
            <p style={{ textAlign: "center", color: "#94a3b8", fontSize: 13, padding: 16 }}>No tasks yet</p>
          ) : (
            recTasks.map((t) => (
              <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#1e293b" }}>{t.title}</div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>{t.assigneeName}</div>
                </div>
                <RemixBadge status={t.status} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export function RemixAttendancePage({ user, attendance, onRefresh }: { user: RemixUser; attendance: AttendanceDto[]; onRefresh: () => void }) {
  const [ip, setIp] = useState("Fetching…");
  const [tick, setTick] = useState(new Date());
  const todayRec = todayAttendanceRecord(attendance, user.id);

  useEffect(() => {
    const id = setInterval(() => setTick(new Date()), 1000);
    fetch("https://api.ipify.org?format=json")
      .then((r) => r.json())
      .then((d: { ip?: string }) => setIp(d.ip ?? "—"))
      .catch(() => setIp("Unavailable"));
    return () => clearInterval(id);
  }, []);

  const dur = (rec: AttendanceDto) => {
    if (!rec.clockOut) return "Ongoing";
    const ms = new Date(rec.clockOut).getTime() - new Date(rec.clockIn).getTime();
    return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`;
  };
  const shown = user.role === "manager" ? [...attendance].reverse() : [...attendance].filter((a) => a.userId === user.id).reverse();

  return (
    <div>
      <div className="dr-card" style={{ textAlign: "center", padding: 40, marginBottom: 24 }}>
        <div style={{ fontSize: 44, fontWeight: 700, color: "#1e293b", letterSpacing: 2, marginBottom: 6 }}>{tick.toLocaleTimeString()}</div>
        <div style={{ fontSize: 14, color: "#64748b", marginBottom: 6 }}>
          {tick.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </div>
        <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 28 }}>
          Your IP:{" "}
          <strong style={{ color: "#374151", fontFamily: "monospace" }}>{ip}</strong>
        </div>
        {!todayRec ? (
          <button
            type="button"
            className="dr-bp"
            onClick={() => void clockIn().then(onRefresh)}
            style={{ padding: "14px 40px", fontSize: 15 }}
          >
            <Clock size={18} />
            Clock In
          </button>
        ) : !todayRec.clockOut ? (
          <div>
            <div style={{ color: "#10b981", fontSize: 13, marginBottom: 12 }}>Clocked in at {fmtTime(todayRec.clockIn)}</div>
            <button
              type="button"
              className="dr-bd"
              onClick={() => void clockOut().then(onRefresh)}
              style={{ padding: "14px 40px", fontSize: 15 }}
            >
              <Clock size={18} />
              Clock Out
            </button>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#10b981", marginBottom: 6 }}>✓ Shift completed</div>
            <div style={{ fontSize: 13, color: "#64748b" }}>Duration: {dur(todayRec)}</div>
          </div>
        )}
      </div>
      <div className="dr-card">
        <h3 style={{ fontSize: 15, fontWeight: 600, color: "#1e293b", marginBottom: 16 }}>{user.role === "manager" ? "Team Attendance History" : "My Attendance History"}</h3>
        <div style={{ overflowX: "auto" }}>
          <table className="dr-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #f1f5f9" }}>
                {user.role === "manager" && <th>Name</th>}
                <th>Date</th>
                <th>Clock In</th>
                <th>Clock Out</th>
                <th>Duration</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {shown.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 24, color: "#94a3b8" }}>
                    No records yet
                  </td>
                </tr>
              ) : (
                shown.map((a) => (
                  <tr key={a.id} className="dr-hr" style={{ borderBottom: "1px solid #f8fafc" }}>
                    {user.role === "manager" && <td style={{ fontWeight: 500, color: "#1e293b" }}>{a.userName}</td>}
                    <td>{a.dateLabel}</td>
                    <td>{fmtTime(a.clockIn)}</td>
                    <td>{a.clockOut ? fmtTime(a.clockOut) : <span style={{ color: "#10b981", fontWeight: 500 }}>Active</span>}</td>
                    <td>{dur(a)}</td>
                    <td style={{ fontFamily: "monospace", fontSize: 12, color: "#64748b" }}>{a.ip ?? "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function RemixLeavesPage({
  user,
  leaves,
  onRefresh,
}: {
  user: RemixUser;
  leaves: LeaveRow[];
  onRefresh: () => void;
}) {
  const [show, setShow] = useState(false);
  const [f, setF] = useState({ type: "vacation", start: "", end: "", reason: "" });
  const submit = async () => {
    if (!f.start || !f.end || !f.reason) return;
    await createLeave(f);
    setF({ type: "vacation", start: "", end: "", reason: "" });
    setShow(false);
    onRefresh();
  };
  const decide = async (id: number, status: string) => {
    await decideLeave(id, status);
    onRefresh();
  };
  const shown = user.role === "manager" ? [...leaves].reverse() : [...leaves].filter((l) => l.userId === user.id).reverse();
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <span style={{ color: "#64748b", fontSize: 13 }}>{shown.length} issue(s)</span>
        {user.role !== "manager" && (
          <button type="button" className="dr-bp" onClick={() => setShow(true)}>
            <Plus size={16} />
            New issue
          </button>
        )}
      </div>
      {show && (
        <div className="dr-mo" onClick={(e) => e.target === e.currentTarget && setShow(false)}>
          <div className="dr-md">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#1e293b" }}>New issue</h3>
              <button type="button" onClick={() => setShow(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label>Type</label>
              <select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>
                <option value="vacation">Vacation</option>
                <option value="sick">Sick / medical</option>
                <option value="personal">Personal</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              <div>
                <label>Start Date</label>
                <input type="date" value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} />
              </div>
              <div>
                <label>End Date</label>
                <input type="date" value={f.end} onChange={(e) => setF({ ...f, end: e.target.value })} />
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label>Reason</label>
              <textarea rows={4} value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} placeholder="Describe the reason…" style={{ resize: "vertical" }} />
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button type="button" className="dr-bs" onClick={() => setShow(false)}>
                Cancel
              </button>
              <button type="button" className="dr-bp" onClick={() => void submit()}>
                Submit issue
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="dr-card">
        <div style={{ overflowX: "auto" }}>
          <table className="dr-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #f1f5f9" }}>
                {user.role === "manager" && <th>Coordinator</th>}
                <th>Type</th>
                <th>From</th>
                <th>To</th>
                <th>Reason</th>
                <th>Status</th>
                {user.role === "manager" && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {shown.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: 24, color: "#94a3b8" }}>
                    No issues found
                  </td>
                </tr>
              ) : (
                shown.map((l) => (
                  <tr key={l.id} className="dr-hr" style={{ borderBottom: "1px solid #f8fafc" }}>
                    {user.role === "manager" && <td style={{ fontWeight: 500, color: "#1e293b" }}>{l.userName}</td>}
                    <td style={{ textTransform: "capitalize" }}>{l.type}</td>
                    <td>{l.start}</td>
                    <td>{l.end}</td>
                    <td style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#64748b" }}>{l.reason}</td>
                    <td>
                      <RemixBadge status={l.status} />
                    </td>
                    {user.role === "manager" && (
                      <td>
                        {l.status === "pending" && (
                          <div style={{ display: "flex", gap: 6 }}>
                            <button type="button" className="dr-bgs" onClick={() => void decide(l.id, "approved")} style={{ padding: "4px 10px", fontSize: 12 }}>
                              Approve
                            </button>
                            <button type="button" className="dr-bd" onClick={() => void decide(l.id, "rejected")} style={{ padding: "4px 10px", fontSize: 12 }}>
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function RemixSessionsPage({
  user,
  sessions,
  trainers,
  onRefresh,
}: {
  user: RemixUser;
  sessions: SessionDto[];
  trainers: { id: number; name: string }[];
  onRefresh: () => void;
}) {
  const [show, setShow] = useState(false);
  const [view, setView] = useState<SessionDto | null>(null);
  const [search, setSearch] = useState("");
  const [fStatus, setFStatus] = useState("all");
  const [f, setF] = useState({
    groupCode: "",
    trainerName: "",
    sessionLink: "",
    recordingLink: "",
    notes: "",
    sessionDate: new Date().toISOString().slice(0, 10),
    attFiles: null as FileList | null,
    shots: null as FileList | null,
  });

  const submit = async () => {
    if (!f.groupCode.trim()) {
      window.alert("Group Code is required");
      return;
    }
    const fd = new FormData();
    fd.append("groupCode", f.groupCode.trim());
    fd.append("trainerName", f.trainerName);
    fd.append("sessionDate", f.sessionDate);
    if (f.sessionLink) fd.append("sessionLink", f.sessionLink);
    if (f.recordingLink) fd.append("recordingLink", f.recordingLink);
    if (f.notes) fd.append("notes", f.notes);
    if (f.attFiles) for (const file of Array.from(f.attFiles)) fd.append("attendanceFiles", file);
    if (f.shots) for (const file of Array.from(f.shots)) fd.append("screenshots", file);
    await createSession(fd);
    setF({
      groupCode: "",
      trainerName: "",
      sessionLink: "",
      recordingLink: "",
      notes: "",
      sessionDate: new Date().toISOString().slice(0, 10),
      attFiles: null,
      shots: null,
    });
    setShow(false);
    onRefresh();
  };

  const decide = async (id: number, status: string) => {
    await decideSession(id, status);
    onRefresh();
    setView((v) => (v && v.id === id ? { ...v, status } : v));
  };

  const filtered = [...sessions]
    .filter((s) => {
      if (user.role !== "manager" && s.coordinatorUserId !== user.id) return false;
      if (fStatus !== "all" && s.status !== fStatus) return false;
      if (search && !s.groupCode.toLowerCase().includes(search.toLowerCase()) && !(s.trainerName || "").toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .reverse();

  return (
    <div>
      <p style={{ color: "#64748b", fontSize: 13, marginBottom: 16, lineHeight: 1.5 }}>
        Each log is stored under the <strong>coordinator</strong> who submitted it. Include group code, trainer, links, attendance file, recording, and screenshots as needed.
      </p>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 24, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search group code or trainer…" style={{ paddingLeft: 34 }} />
        </div>
        <select value={fStatus} onChange={(e) => setFStatus(e.target.value)} style={{ width: 150 }}>
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
        </select>
        <button type="button" className="dr-bp" onClick={() => setShow(true)}>
          <Plus size={16} />
          New session
        </button>
      </div>

      {show && (
        <div className="dr-mo" onClick={(e) => e.target === e.currentTarget && setShow(false)}>
          <div className="dr-md" style={{ maxWidth: 640 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#1e293b" }}>New session log</h3>
              <button type="button" onClick={() => setShow(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <label>
                  Group Code <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input value={f.groupCode} onChange={(e) => setF({ ...f, groupCode: e.target.value.toUpperCase() })} placeholder="e.g. ON-CA-L1-G0001" />
              </div>
              <div>
                <label>Trainer Name</label>
                <select value={f.trainerName} onChange={(e) => setF({ ...f, trainerName: e.target.value })}>
                  <option value="">Select trainer…</option>
                  {trainers.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Session Date</label>
                <input type="date" value={f.sessionDate} onChange={(e) => setF({ ...f, sessionDate: e.target.value })} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label>Session Link (Zoom / Teams)</label>
                <input value={f.sessionLink} onChange={(e) => setF({ ...f, sessionLink: e.target.value })} placeholder="https://zoom.us/j/…" />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label>Recording Link</label>
                <input value={f.recordingLink} onChange={(e) => setF({ ...f, recordingLink: e.target.value })} placeholder="https://…" />
              </div>
              <div>
                <label>Attendance File (Excel / PDF)</label>
                <div style={{ border: "2px dashed #e2e8f0", borderRadius: 8, padding: 12, textAlign: "center", position: "relative", cursor: "pointer" }}>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.pdf"
                    multiple
                    onChange={(e) => setF({ ...f, attFiles: e.target.files })}
                    style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
                  />
                  <Upload size={18} color="#94a3b8" style={{ margin: "0 auto 4px" }} />
                  <div style={{ fontSize: 12, color: "#64748b" }}>{f.attFiles && f.attFiles.length > 0 ? Array.from(f.attFiles).map((x) => x.name).join(", ") : "Click to upload"}</div>
                </div>
              </div>
              <div>
                <label>Screenshots</label>
                <div style={{ border: "2px dashed #e2e8f0", borderRadius: 8, padding: 12, textAlign: "center", position: "relative", cursor: "pointer" }}>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => setF({ ...f, shots: e.target.files })}
                    style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
                  />
                  <Upload size={18} color="#94a3b8" style={{ margin: "0 auto 4px" }} />
                  <div style={{ fontSize: 12, color: "#64748b" }}>{f.shots && f.shots.length > 0 ? `${f.shots.length} image(s) selected` : "Click to upload"}</div>
                </div>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label>Notes</label>
                <textarea rows={3} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} placeholder="Additional notes…" style={{ resize: "vertical" }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 20 }}>
              <button type="button" className="dr-bs" onClick={() => setShow(false)}>
                Cancel
              </button>
              <button type="button" className="dr-bp" onClick={() => void submit()}>
                Submit session
              </button>
            </div>
          </div>
        </div>
      )}

      {view && (
        <div className="dr-mo" onClick={(e) => e.target === e.currentTarget && setView(null)}>
          <div className="dr-md" style={{ maxWidth: 640 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#6366f1" }}>{view.groupCode}</h3>
              <button type="button" onClick={() => setView(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 13, marginBottom: 16 }}>
              {(
                [
                  ["Coordinator", view.coordinatorName],
                  ["Trainer", view.trainerName || "—"],
                  ["Date", view.sessionDate],
                  ["Status", view.status],
                  ["Session Link", view.sessionLink || "—"],
                  ["Recording Link", view.recordingLink || "—"],
                  ["Files", `${view.files?.length ?? 0} file(s)`],
                ] as const
              ).map(([k, v]) => (
                <div key={k} style={{ background: "#f8fafc", borderRadius: 8, padding: 12 }}>
                  <div style={{ color: "#94a3b8", fontSize: 11, textTransform: "uppercase", fontWeight: 500, marginBottom: 4 }}>{k}</div>
                  <div style={{ color: "#1e293b", wordBreak: "break-all" }}>{k === "Status" ? <RemixBadge status={v} /> : v}</div>
                </div>
              ))}
              {view.notes && (
                <div style={{ gridColumn: "1 / -1", background: "#f8fafc", borderRadius: 8, padding: 12 }}>
                  <div style={{ color: "#94a3b8", fontSize: 11, textTransform: "uppercase", fontWeight: 500, marginBottom: 4 }}>Notes</div>
                  <div style={{ color: "#1e293b" }}>{view.notes}</div>
                </div>
              )}
            </div>
            {user.role === "manager" && view.status === "pending" && (
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button type="button" className="dr-bd" onClick={() => void decide(view.id, "rejected")}>
                  Reject
                </button>
                <button type="button" className="dr-bgs" onClick={() => void decide(view.id, "approved")}>
                  Approve
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="dr-card">
        <div style={{ overflowX: "auto" }}>
          <table className="dr-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #f1f5f9" }}>
                <th>Group Code</th>
                {user.role === "manager" && <th>Coordinator</th>}
                <th>Trainer</th>
                <th>Date</th>
                <th>Files</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: 24, color: "#94a3b8" }}>
                    No sessions found
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id} className="dr-hr" style={{ borderBottom: "1px solid #f8fafc" }}>
                    <td style={{ fontWeight: 700, color: "#6366f1" }}>{s.groupCode}</td>
                    {user.role === "manager" && <td style={{ color: "#374151" }}>{s.coordinatorName}</td>}
                    <td>{s.trainerName || "—"}</td>
                    <td>{s.sessionDate}</td>
                    <td>
                      {(s.files?.length ?? 0) > 0 ? (
                        <span style={{ fontSize: 12, background: "#e0e7ff", color: "#4338ca", padding: "2px 8px", borderRadius: 20 }}>{s.files!.length} files</span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <RemixBadge status={s.status} />
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <button
                          type="button"
                          onClick={() => setView(s)}
                          style={{
                            background: "none",
                            border: "1px solid #e2e8f0",
                            borderRadius: 6,
                            padding: "4px 8px",
                            cursor: "pointer",
                            color: "#64748b",
                            fontSize: 12,
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <Eye size={12} />
                          View
                        </button>
                        {user.role === "manager" && s.status === "pending" && (
                          <>
                            <button type="button" className="dr-bgs" onClick={() => void decide(s.id, "approved")} style={{ padding: "4px 8px", fontSize: 12 }}>
                              ✓
                            </button>
                            <button type="button" className="dr-bd" onClick={() => void decide(s.id, "rejected")} style={{ padding: "4px 8px", fontSize: 12 }}>
                              ✗
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function RemixTasksPage({
  user,
  tasks,
  coordinators,
  onRefresh,
}: {
  user: RemixUser;
  tasks: TaskDto[];
  coordinators: CoordinatorOption[];
  onRefresh: () => void;
}) {
  const [show, setShow] = useState(false);
  const [f, setF] = useState({ title: "", desc: "", assigneeId: "", deadline: "", priority: "medium" });
  const shown = user.role === "manager" ? tasks : tasks.filter((t) => t.assigneeId === user.id);
  const create = async () => {
    if (!f.title || !f.assigneeId) return;
    await createTask({
      title: f.title,
      description: f.desc || undefined,
      assigneeId: parseInt(f.assigneeId, 10),
      priority: f.priority,
      deadline: f.deadline || undefined,
    });
    setF({ title: "", desc: "", assigneeId: "", deadline: "", priority: "medium" });
    setShow(false);
    onRefresh();
  };
  const upd = async (id: number, status: string) => {
    await patchTaskStatus(id, status);
    onRefresh();
  };
  const del = async (id: number) => {
    await deleteTask(id);
    onRefresh();
  };
  const pc = { high: "#ef4444", medium: "#f59e0b", low: "#10b981" };
  const cols = ["todo", "in-progress", "done"] as const;
  const colLabel: Record<string, string> = { todo: "To Do", "in-progress": "In Progress", done: "Done" };
  const colColor: Record<string, string> = { todo: "#6366f1", "in-progress": "#f59e0b", done: "#10b981" };
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 24 }}>
        {user.role === "manager" && (
          <button type="button" className="dr-bp" onClick={() => setShow(true)}>
            <Plus size={16} />
            Assign Task
          </button>
        )}
      </div>
      {show && (
        <div className="dr-mo" onClick={(e) => e.target === e.currentTarget && setShow(false)}>
          <div className="dr-md">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#1e293b" }}>Assign New Task</h3>
              <button type="button" onClick={() => setShow(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label>Task Title *</label>
              <input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Enter task title…" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              <div>
                <label>Assign To *</label>
                <select value={f.assigneeId} onChange={(e) => setF({ ...f, assigneeId: e.target.value })}>
                  <option value="">Select coordinator…</option>
                  {coordinators.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Priority</label>
                <select value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value })}>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label>Deadline</label>
              <input type="date" value={f.deadline} onChange={(e) => setF({ ...f, deadline: e.target.value })} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label>Description</label>
              <textarea rows={3} value={f.desc} onChange={(e) => setF({ ...f, desc: e.target.value })} placeholder="Task details…" style={{ resize: "vertical" }} />
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button type="button" className="dr-bs" onClick={() => setShow(false)}>
                Cancel
              </button>
              <button type="button" className="dr-bp" onClick={() => void create()}>
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {cols.map((col) => {
          const colTasks = shown.filter((t) => t.status === col);
          return (
            <div key={col}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: colColor[col] }} />
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>{colLabel[col]}</h3>
                <span style={{ background: "#f1f5f9", color: "#64748b", borderRadius: 20, padding: "1px 8px", fontSize: 12 }}>{colTasks.length}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {colTasks.length === 0 ? (
                  <div style={{ background: "#f8fafc", border: "2px dashed #e2e8f0", borderRadius: 10, padding: 20, textAlign: "center", fontSize: 13, color: "#94a3b8" }}>No tasks</div>
                ) : (
                  colTasks.map((t) => (
                    <div key={t.id} className="dr-card" style={{ padding: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 8 }}>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 500,
                            background: `${pc[t.priority as keyof typeof pc] ?? "#94a3b8"}20`,
                            color: pc[t.priority as keyof typeof pc] ?? "#94a3b8",
                            padding: "2px 8px",
                            borderRadius: 20,
                            textTransform: "capitalize",
                          }}
                        >
                          {t.priority}
                        </span>
                        {user.role === "manager" && (
                          <button type="button" onClick={() => void del(t.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#cbd5e1", padding: 2 }}>
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: "#1e293b", marginBottom: 6 }}>{t.title}</div>
                      {t.description && <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>{t.description}</div>}
                      <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 10 }}>
                        👤 {t.assigneeName}
                        {t.deadline && <> · 📅 {t.deadline}</>}
                      </div>
                      <select value={t.status} onChange={(e) => void upd(t.id, e.target.value)} style={{ fontSize: 12, padding: "4px 8px", borderRadius: 6 }}>
                        <option value="todo">To Do</option>
                        <option value="in-progress">In Progress</option>
                        <option value="done">Done</option>
                      </select>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function RemixChatPage({ user, messages, onRefresh }: { user: RemixUser; messages: ChatDto[]; onRefresh: () => void }) {
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  const send = async () => {
    if (!text.trim()) return;
    await postChat(text.trim());
    setText("");
    onRefresh();
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 160px)" }}>
      <div className="dr-card" style={{ flex: 1, display: "flex", flexDirection: "column", padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #f1f5f9", background: "#f8fafc", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex" }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: "#1e293b" }}>DECI Team Chat</div>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 14 }} className="dr-sc">
          {messages.length === 0 && <div style={{ textAlign: "center", color: "#94a3b8", margin: "auto", fontSize: 13 }}>No messages yet. Say hello! 👋</div>}
          {messages.map((m, i) => {
            const isMe = m.userId === user.id;
            const showAv = i === 0 || messages[i - 1].userId !== m.userId;
            return (
              <div key={m.id} style={{ display: "flex", gap: 8, flexDirection: isMe ? "row-reverse" : "row", alignItems: "flex-end" }}>
                {!isMe && (
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: showAv ? ucForId(m.userId) : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#fff",
                      flexShrink: 0,
                    }}
                  >
                    {showAv ? m.initials : ""}
                  </div>
                )}
                <div style={{ maxWidth: "65%" }}>
                  {showAv && !isMe && <div style={{ fontSize: 12, fontWeight: 500, color: "#64748b", marginBottom: 3 }}>{m.userName}</div>}
                  <div
                    style={{
                      padding: "10px 14px",
                      borderRadius: isMe ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
                      background: isMe ? "#6366f1" : "#f1f5f9",
                      color: isMe ? "#fff" : "#1e293b",
                      fontSize: 14,
                      lineHeight: 1.5,
                    }}
                  >
                    {m.text}
                  </div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3, textAlign: isMe ? "right" : "left" }}>{fmtTime(m.sentAt)}</div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
        <div style={{ padding: "12px 16px", borderTop: "1px solid #f1f5f9", display: "flex", gap: 10, alignItems: "center" }}>
          <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && void send()} placeholder="Type a message…" style={{ flex: 1 }} />
          <button type="button" className="dr-bp" onClick={() => void send()} style={{ padding: "10px 14px", flexShrink: 0 }}>
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function RemixReportsPage({
  sessions,
  coordinators,
}: {
  sessions: SessionDto[];
  coordinators: CoordinatorOption[];
}) {
  const [code, setCode] = useState("");
  const [coord, setCoord] = useState("all");
  const filtered = sessions
    .filter((s) => {
      if (coord !== "all" && s.coordinatorUserId !== parseInt(coord, 10)) return false;
      if (code && !s.groupCode.toLowerCase().includes(code.toLowerCase())) return false;
      return true;
    })
    .reverse();
  const exportCSV = () => {
    const h = ["Group Code", "Coordinator", "Trainer", "Date", "Status", "Session Link", "Recording Link", "Files"];
    const rows = filtered.map((s) => [
      s.groupCode,
      s.coordinatorName,
      s.trainerName || "",
      s.sessionDate,
      s.status,
      s.sessionLink || "",
      s.recordingLink || "",
      `${s.files?.length ?? 0} files`,
    ]);
    const csv = [h, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "deci_sessions_export.csv";
    a.click();
  };
  const stats = [
    { l: "Total Sessions", v: sessions.length, c: "#6366f1" },
    { l: "Approved", v: sessions.filter((s) => s.status === "approved").length, c: "#10b981" },
    { l: "Pending", v: sessions.filter((s) => s.status === "pending").length, c: "#f59e0b" },
    { l: "Rejected", v: sessions.filter((s) => s.status === "rejected").length, c: "#ef4444" },
  ];
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {stats.map(({ l, v, c }) => (
          <div key={l} className="dr-card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: c, marginBottom: 4 }}>{v}</div>
            <div style={{ fontSize: 13, color: "#64748b" }}>{l}</div>
          </div>
        ))}
      </div>
      <div className="dr-card" style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: "#1e293b", marginBottom: 16 }}>Sessions by Coordinator</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 12 }}>
          {coordinators.map((u) => {
            const total = sessions.filter((s) => s.coordinatorUserId === u.id).length;
            const approved = sessions.filter((s) => s.coordinatorUserId === u.id && s.status === "approved").length;
            const pct = total > 0 ? Math.round((approved / total) * 100) : 0;
            const ru: RemixUser = { id: u.id, name: u.fullName, initials: initialsFromName(u.fullName), role: "coordinator" };
            return (
              <div key={u.id} style={{ background: "#f8fafc", borderRadius: 10, padding: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <RemixAvatar user={ru} size={28} />
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#1e293b" }}>{u.fullName.split(" ")[0]}</div>
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#1e293b" }}>{total}</div>
                <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>
                  {approved} approved · {pct}%
                </div>
                <div style={{ height: 4, background: "#e2e8f0", borderRadius: 4 }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: "#10b981", borderRadius: 4, transition: "width .5s" }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="dr-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: "#1e293b" }}>Export Session Data</h3>
          <button type="button" className="dr-bgs" onClick={exportCSV}>
            <Download size={16} />
            Export CSV
          </button>
        </div>
        <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Filter by group code…" />
          </div>
          <select value={coord} onChange={(e) => setCoord(e.target.value)} style={{ width: 200 }}>
            <option value="all">All Coordinators</option>
            {coordinators.map((u) => (
              <option key={u.id} value={u.id}>
                {u.fullName}
              </option>
            ))}
          </select>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="dr-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #f1f5f9" }}>
                {["Group Code", "Coordinator", "Trainer", "Date", "Status", "Files"].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 24, color: "#94a3b8" }}>
                    No data
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id} className="dr-hr" style={{ borderBottom: "1px solid #f8fafc" }}>
                    <td style={{ fontWeight: 700, color: "#6366f1" }}>{s.groupCode}</td>
                    <td>{s.coordinatorName}</td>
                    <td>{s.trainerName || "—"}</td>
                    <td>{s.sessionDate}</td>
                    <td>
                      <RemixBadge status={s.status} />
                    </td>
                    <td>{s.files?.length ?? 0} files</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
