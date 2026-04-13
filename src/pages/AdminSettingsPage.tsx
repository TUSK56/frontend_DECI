import { useEffect, useState } from "react";
import { apiJson } from "../api/client";
import type { SystemSettingsDto } from "../types";
import type { PageId } from "../types";
import { useAuth } from "../auth/AuthContext";
import { UserManagementPage } from "./UserManagementPage";

type Row = { id: number; name?: string; code?: string; isActive?: boolean };

export type AdminSettingsTab = "users" | "control";

function ControlPanelSection() {
  const [settings, setSettings] = useState<SystemSettingsDto | null>(null);
  const [trainers, setTrainers] = useState<Row[]>([]);
  const [codes, setCodes] = useState<Row[]>([]);
  const [newTrainer, setNewTrainer] = useState("");
  const [newCode, setNewCode] = useState("");

  const load = async () => {
    const [s, t, c] = await Promise.all([
      apiJson<SystemSettingsDto>("/api/settings"),
      apiJson<Row[]>("/api/admin/trainers/all"),
      apiJson<Row[]>("/api/admin/group-codes/all"),
    ]);
    setSettings(s);
    setTrainers(t);
    setCodes(c);
  };

  useEffect(() => {
    void load().catch(() => {});
  }, []);

  const saveSettings = async () => {
    if (!settings) return;
    const updated = await apiJson<SystemSettingsDto>("/api/settings", {
      method: "PUT",
      body: JSON.stringify({
        shiftStart: settings.shiftStart,
        shiftEnd: settings.shiftEnd,
        ipTrackingEnabled: settings.ipTrackingEnabled,
        sessionApprovalRequired: settings.sessionApprovalRequired,
      }),
    });
    setSettings(updated);
  };

  const addTrainer = async () => {
    if (!newTrainer.trim()) return;
    await apiJson("/api/admin/trainers", { method: "POST", body: JSON.stringify({ name: newTrainer.trim() }) });
    setNewTrainer("");
    await load();
  };

  const addCode = async () => {
    if (!newCode.trim()) return;
    await apiJson("/api/admin/group-codes", { method: "POST", body: JSON.stringify({ code: newCode.trim() }) });
    setNewCode("");
    await load();
  };

  const delTrainer = async (id: number) => {
    await apiJson(`/api/admin/trainers/${id}`, { method: "DELETE" });
    await load();
  };

  const delCode = async (id: number) => {
    await apiJson(`/api/admin/group-codes/${id}`, { method: "DELETE" });
    await load();
  };

  if (!settings) return <div className="text-sm text-slate-600">Loading…</div>;

  return (
    <div className="space-y-6">
      <div className="card space-y-4">
        <div className="text-sm font-semibold text-slate-900">Attendance policy</div>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="label">Shift start (hh:mm)</label>
            <input className="input" value={settings.shiftStart} onChange={(e) => setSettings({ ...settings, shiftStart: e.target.value })} />
          </div>
          <div>
            <label className="label">Shift end (hh:mm)</label>
            <input className="input" value={settings.shiftEnd} onChange={(e) => setSettings({ ...settings, shiftEnd: e.target.value })} />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={settings.ipTrackingEnabled} onChange={(e) => setSettings({ ...settings, ipTrackingEnabled: e.target.checked })} />
          IP tracking enabled for clock-in
        </label>
        <div className="text-sm font-semibold text-slate-900">Session rules</div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={settings.sessionApprovalRequired} onChange={(e) => setSettings({ ...settings, sessionApprovalRequired: e.target.checked })} />
          Approval required for new session logs
        </label>
        <button type="button" className="btn-primary" onClick={() => void saveSettings()}>
          Save settings
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card space-y-3">
          <div className="text-sm font-semibold text-slate-900">Global list — trainer names</div>
          <p className="text-xs text-slate-500">Used in session forms for all coordinators.</p>
          <div className="flex gap-2">
            <input className="input" value={newTrainer} onChange={(e) => setNewTrainer(e.target.value)} placeholder="Add trainer…" />
            <button type="button" className="btn-primary" onClick={() => void addTrainer()}>
              Add
            </button>
          </div>
          <ul className="divide-y divide-slate-100 text-sm">
            {trainers.map((t) => (
              <li key={t.id} className="flex items-center justify-between py-2">
                <span className={t.isActive === false ? "text-slate-400 line-through" : ""}>{t.name}</span>
                {t.isActive !== false && (
                  <button type="button" className="text-xs text-red-600 hover:underline" onClick={() => void delTrainer(t.id)}>
                    Remove
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="card space-y-3">
          <div className="text-sm font-semibold text-slate-900">Global list — group codes</div>
          <p className="text-xs text-slate-500">Master codes available when logging sessions.</p>
          <div className="flex gap-2">
            <input className="input" value={newCode} onChange={(e) => setNewCode(e.target.value)} placeholder="Add code…" />
            <button type="button" className="btn-primary" onClick={() => void addCode()}>
              Add
            </button>
          </div>
          <ul className="divide-y divide-slate-100 text-sm">
            {codes.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-2">
                <span className={c.isActive === false ? "text-slate-400 line-through" : ""}>{c.code}</span>
                {c.isActive !== false && (
                  <button type="button" className="text-xs text-red-600 hover:underline" onClick={() => void delCode(c.id)}>
                    Remove
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

type Props = {
  initialTab?: AdminSettingsTab;
  setPage?: (p: PageId) => void;
};

export function AdminSettingsPage({ initialTab = "control", setPage }: Props) {
  const { isAdmin, isElevated } = useAuth();
  const [tab, setTab] = useState<AdminSettingsTab>(initialTab);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  if (!isElevated) {
    return <div className="text-sm text-slate-600">You do not have access to admin settings.</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Admin settings</h1>
        <p className="mt-1 text-sm text-slate-600">
          {isAdmin
            ? "User & profile management and the operational control panel (lists, attendance policy, session rules)."
            : "Operational control panel: trainer/group lists, attendance policy, and session approval rules."}
        </p>
      </div>

      {isAdmin && (
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-1">
          <button
            type="button"
            className={`rounded-t-lg px-4 py-2 text-sm font-medium transition ${
              tab === "users" ? "border-b-2 border-brand-600 text-brand-700" : "text-slate-600 hover:text-slate-900"
            }`}
            onClick={() => setTab("users")}
          >
            User &amp; profile management
          </button>
          <button
            type="button"
            className={`rounded-t-lg px-4 py-2 text-sm font-medium transition ${
              tab === "control" ? "border-b-2 border-brand-600 text-brand-700" : "text-slate-600 hover:text-slate-900"
            }`}
            onClick={() => setTab("control")}
          >
            Control panel
          </button>
        </div>
      )}

      {isAdmin && tab === "users" && setPage && (
        <UserManagementPage
          setPage={setPage}
          onOpenControlPanel={() => setTab("control")}
        />
      )}

      {(!isAdmin || tab === "control") && <ControlPanelSection />}
    </div>
  );
}
