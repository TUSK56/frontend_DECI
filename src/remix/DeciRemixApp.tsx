import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bell,
  LogOut,
  Menu,
  MessageSquare,
  Settings,
  Users,
  ClipboardList,
  FileText,
  Clock,
  CircleAlert,
  Home,
  BarChart2,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import type { SessionDto, TaskDto, ChatDto, AttendanceDto, PageId } from "../types";
import type { NotifDto } from "../types";
import { apiJson } from "../api/client";
import { AdminSettingsPage } from "../pages/AdminSettingsPage";
import { ProfilePage } from "../pages/ProfilePage";
import { initialsFromName, type RemixUser, type CoordinatorOption, type LeaveRow, RemixAvatar } from "./remixCommon";
import {
  RemixDashboard,
  RemixAttendancePage,
  RemixLeavesPage,
  RemixSessionsPage,
  RemixTasksPage,
  RemixChatPage,
  RemixReportsPage,
} from "./remixPages";
import {
  fetchAttendance,
  fetchLeaves,
  fetchSessions,
  fetchTasks,
  fetchChat,
  fetchTrainers,
  fetchAssignableCoordinators,
} from "./remixApi";
import "./remix.css";

type RemixPage = string;

export default function DeciRemixApp() {
  const { user, logout, isElevated, isAdmin } = useAuth();
  const [page, setPage] = useState<RemixPage>("dashboard");
  const [settingsTab, setSettingsTab] = useState<"users" | "control">("control");
  const [sidebar, setSidebar] = useState(true);
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState<AttendanceDto[]>([]);
  const [leaves, setLeaves] = useState<LeaveRow[]>([]);
  const [sessions, setSessions] = useState<SessionDto[]>([]);
  const [tasks, setTasks] = useState<TaskDto[]>([]);
  const [messages, setMessages] = useState<ChatDto[]>([]);
  const [trainers, setTrainers] = useState<{ id: number; name: string }[]>([]);
  const [coordinators, setCoordinators] = useState<CoordinatorOption[]>([]);
  const [notifs, setNotifs] = useState<NotifDto[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const rUser: RemixUser | null = useMemo(() => {
    if (!user) return null;
    const elevated = user.role === "Admin" || user.role === "Manager";
    return {
      id: user.id,
      name: user.fullName,
      initials: initialsFromName(user.fullName),
      role: elevated ? "manager" : "coordinator",
      imageUrl: user.profileImageUrl ?? null,
    };
  }, [user]);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [att, lv, sess, tsk, msgs, tr] = await Promise.all([
        fetchAttendance(),
        fetchLeaves(),
        fetchSessions(),
        fetchTasks(),
        fetchChat(),
        fetchTrainers(),
      ]);
      setAttendance(att);
      setLeaves(lv);
      setSessions(sess);
      setTasks(tsk);
      setMessages(msgs);
      setTrainers(tr);
      let coords: CoordinatorOption[] = [];
      if (isElevated) {
        try {
          coords = await fetchAssignableCoordinators();
        } catch {
          coords = [];
        }
      }
      setCoordinators(coords);
      try {
        const n = await apiJson<NotifDto[]>("/api/notifications");
        setNotifs(n);
      } catch {
        setNotifs([]);
      }
    } catch {
      /* keep partial state */
    } finally {
      setLoading(false);
    }
  }, [user, isElevated]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const refresh = useCallback(() => {
    void loadData();
  }, [loadData]);

  const markRead = async () => {
    await apiJson("/api/notifications/read-all", { method: "POST" });
    setNotifs((xs) => xs.map((n) => ({ ...n, read: true })));
  };

  const unread = notifs.filter((n) => !n.read).length;

  const nav = useMemo(() => {
    const base: { id: RemixPage; label: string; icon: typeof Home }[] = [
      { id: "dashboard", label: "Dashboard", icon: Home },
      { id: "tasks", label: "Tasks", icon: ClipboardList },
      { id: "sessions", label: "Session", icon: FileText },
      { id: "chat", label: "Chat", icon: MessageSquare },
      { id: "leaves", label: "Issues", icon: CircleAlert },
      { id: "attendance", label: "Attendance", icon: Clock },
    ];
    if (isElevated) base.push({ id: "reports", label: "Reports & Export", icon: BarChart2 });
    if (isAdmin) base.push({ id: "userMgmt", label: "User Management", icon: Users });
    if (isElevated) base.push({ id: "settings", label: "Settings", icon: Settings });
    return base;
  }, [isElevated, isAdmin]);

  if (!rUser) return null;

  if (loading && sessions.length === 0 && tasks.length === 0) {
    return (
      <div className="deci-remix" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#f1f5f9" }}>
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 40,
              height: 40,
              border: "4px solid #6366f1",
              borderTopColor: "transparent",
              borderRadius: "50%",
              animation: "dr-spin 1s linear infinite",
              margin: "0 auto 12px",
            }}
          />
          <p style={{ color: "#64748b", fontSize: 14 }}>Loading DECI Portal…</p>
        </div>
      </div>
    );
  }

  const title =
    page === "settings"
      ? settingsTab === "users"
        ? "User & profile management"
        : "Settings"
      : nav.find((n) => n.id === page)?.label ?? (page === "profile" ? "Profile" : "DECI");

  return (
    <div className="deci-remix" style={{ display: "flex", height: "100vh", background: "#f8fafc", fontFamily: "'Inter',system-ui,sans-serif" }}>
      <div
        style={{
          width: sidebar ? 240 : 64,
          background: "linear-gradient(180deg,#1e1b4b,#312e81)",
          display: "flex",
          flexDirection: "column",
          transition: "width .3s",
          overflow: "hidden",
          flexShrink: 0,
          zIndex: 100,
        }}
      >
        <div style={{ padding: "18px 14px", borderBottom: "1px solid rgba(255,255,255,.1)", display: "flex", alignItems: "center", gap: 10, minHeight: 64 }}>
          <div
            style={{
              width: 36,
              height: 36,
              background: "#6366f1",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 15,
              fontWeight: 800,
              color: "#fff",
              flexShrink: 0,
            }}
          >
            D
          </div>
          {sidebar && (
            <div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 14, whiteSpace: "nowrap" }}>DECI Portal</div>
              <div style={{ color: "rgba(255,255,255,.45)", fontSize: 11, whiteSpace: "nowrap" }}>Management System</div>
            </div>
          )}
        </div>
        <nav style={{ flex: 1, padding: "10px 8px", overflowY: "auto" }}>
          {nav.map(({ id, label, icon: Icon }) => {
            const active =
              id === "userMgmt"
                ? page === "settings" && settingsTab === "users"
                : id === "settings"
                  ? page === "settings" && settingsTab === "control"
                  : page === id;
            return (
              <button
                key={id}
                type="button"
                className="dr-ni"
                onClick={() => {
                  if (id === "userMgmt") {
                    setSettingsTab("users");
                    setPage("settings");
                    return;
                  }
                  if (id === "settings") {
                    setSettingsTab("control");
                    setPage("settings");
                    return;
                  }
                  setPage(id);
                }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 8px",
                  borderRadius: 8,
                  border: "none",
                  cursor: "pointer",
                  marginBottom: 2,
                  background: active ? "rgba(255,255,255,.15)" : "transparent",
                  color: active ? "#fff" : "rgba(255,255,255,.6)",
                  fontWeight: active ? 600 : 400,
                  fontSize: 13,
                  transition: "all .2s",
                  fontFamily: "inherit",
                }}
              >
                <Icon size={17} style={{ flexShrink: 0 }} />
                {sidebar && <span style={{ whiteSpace: "nowrap" }}>{label}</span>}
              </button>
            );
          })}
        </nav>
        <div style={{ padding: "10px 8px", borderTop: "1px solid rgba(255,255,255,.1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 4px", marginBottom: 8, width: "100%" }}>
            <button
              type="button"
              title="Profile"
              onClick={() => setPage("profile")}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
                borderRadius: "50%",
                lineHeight: 0,
                flexShrink: 0,
              }}
            >
              <RemixAvatar user={rUser} size={36} />
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              {sidebar && (
                <>
                  <div style={{ color: "#fff", fontSize: 12, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{rUser.name}</div>
                  <div style={{ color: "rgba(255,255,255,.4)", fontSize: 11, textTransform: "capitalize" }}>{rUser.role === "manager" ? "Lead" : "Coordinator"}</div>
                </>
              )}
            </div>
            <button
              type="button"
              className="dr-ni"
              title={isElevated ? "Settings" : "Account"}
              onClick={() => {
                if (isElevated) {
                  setSettingsTab("control");
                  setPage("settings");
                } else {
                  setPage("profile");
                }
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 6,
                border: "none",
                cursor: "pointer",
                background: "transparent",
                color: "rgba(255,255,255,.9)",
                flexShrink: 0,
              }}
            >
              <Settings size={18} />
            </button>
          </div>
          <button
            type="button"
            className="dr-ni"
            onClick={() => logout()}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              background: "transparent",
              color: "rgba(255,120,120,.8)",
              fontSize: 13,
              fontFamily: "inherit",
            }}
          >
            <LogOut size={16} style={{ flexShrink: 0 }} />
            {sidebar && <span>Sign Out</span>}
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "0 20px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button type="button" onClick={() => setSidebar(!sidebar)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: 4, borderRadius: 6, display: "flex" }}>
              <Menu size={19} />
            </button>
            <h1 style={{ fontSize: 17, fontWeight: 600, color: "#1e293b" }}>{title}</h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ position: "relative" }}>
              <button type="button" onClick={() => setShowNotifs(!showNotifs)} style={{ background: "none", border: "none", cursor: "pointer", padding: 8, borderRadius: 8, color: "#64748b", position: "relative", display: "flex" }}>
                <Bell size={19} />
                {unread > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: 4,
                      right: 4,
                      width: 16,
                      height: 16,
                      background: "#ef4444",
                      borderRadius: "50%",
                      fontSize: 9,
                      fontWeight: 700,
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </button>
              {showNotifs && (
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "calc(100% + 8px)",
                    width: 300,
                    background: "#fff",
                    borderRadius: 12,
                    boxShadow: "0 10px 40px rgba(0,0,0,.15)",
                    border: "1px solid #e2e8f0",
                    zIndex: 200,
                    animation: "dr-si .15s",
                  }}
                >
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>Notifications</span>
                    <button type="button" onClick={() => void markRead()} style={{ fontSize: 12, color: "#6366f1", background: "none", border: "none", cursor: "pointer" }}>
                      Mark all read
                    </button>
                  </div>
                  <div style={{ maxHeight: 280, overflowY: "auto" }} className="dr-sc">
                    {notifs.length === 0 ? (
                      <div style={{ padding: 20, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>No notifications</div>
                    ) : (
                      notifs.slice(0, 10).map((n) => (
                        <div key={n.id} style={{ padding: "10px 16px", borderBottom: "1px solid #f8fafc", background: n.read ? "#fff" : "#f0f0ff" }}>
                          <div style={{ fontSize: 13, fontWeight: n.read ? 400 : 500, color: "#1e293b" }}>{n.title}</div>
                          <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{n.body}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <div style={{ position: "relative" }}>
              <button type="button" onClick={() => setMenuOpen((v) => !v)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                <RemixAvatar user={rUser} size={34} />
              </button>
              {menuOpen && (
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "calc(100% + 8px)",
                    minWidth: 160,
                    background: "#fff",
                    borderRadius: 12,
                    boxShadow: "0 10px 40px rgba(0,0,0,.12)",
                    border: "1px solid #e2e8f0",
                    zIndex: 200,
                    overflow: "hidden",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setPage("profile");
                    }}
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "12px 16px",
                      textAlign: "center",
                      fontSize: 13,
                      border: "none",
                      borderBottom: "1px solid #e2e8f0",
                      background: page === "profile" ? "#f8fafc" : "#fff",
                      cursor: "pointer",
                      color: "#2563eb",
                    }}
                  >
                    Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                    }}
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "12px 16px",
                      textAlign: "center",
                      fontSize: 13,
                      border: "none",
                      background: "none",
                      cursor: "pointer",
                      color: "#e11d48",
                    }}
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div
          style={{ flex: 1, overflowY: "auto", padding: 24 }}
          className="dr-sc"
          onClick={() => {
            if (showNotifs) setShowNotifs(false);
            if (menuOpen) setMenuOpen(false);
          }}
        >
          {page === "dashboard" && (
            <RemixDashboard user={rUser} attendance={attendance} leaves={leaves} sessions={sessions} tasks={tasks} setPage={setPage} teamCount={coordinators.length || 1} />
          )}
          {page === "attendance" && <RemixAttendancePage user={rUser} attendance={attendance} onRefresh={refresh} />}
          {page === "leaves" && <RemixLeavesPage user={rUser} leaves={leaves} onRefresh={refresh} />}
          {page === "sessions" && <RemixSessionsPage user={rUser} sessions={sessions} trainers={trainers} onRefresh={refresh} />}
          {page === "tasks" && <RemixTasksPage user={rUser} tasks={tasks} coordinators={coordinators} onRefresh={refresh} />}
          {page === "chat" && <RemixChatPage user={rUser} messages={messages} onRefresh={refresh} />}
          {page === "reports" && isElevated && <RemixReportsPage sessions={sessions} coordinators={coordinators} />}
          {page === "settings" && isElevated && (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <AdminSettingsPage initialTab={settingsTab} setPage={(p: PageId) => setPage(p)} />
            </div>
          )}
          {page === "profile" && (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <ProfilePage />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
