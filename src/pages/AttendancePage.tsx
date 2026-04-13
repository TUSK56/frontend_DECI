import { useEffect, useState } from "react";
import { apiJson } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import type { AttendanceDto } from "../types";

export function AttendancePage() {
  const { isElevated } = useAuth();
  const [rows, setRows] = useState<AttendanceDto[]>([]);
  const [tick, setTick] = useState(() => new Date());
  const [msg, setMsg] = useState<string | null>(null);

  const load = async () => {
    const data = await apiJson<AttendanceDto[]>("/api/attendance");
    setRows(data);
  };

  useEffect(() => {
    void load().catch(() => {});
    const id = setInterval(() => setTick(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const todayRows = rows.filter((r) => r.clockIn.slice(0, 10) === today);
  const active = todayRows.find((r) => !r.clockOut);

  const clockIn = async () => {
    setMsg(null);
    try {
      await apiJson("/api/attendance/clock-in", { method: "POST" });
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed");
    }
  };

  const clockOut = async () => {
    setMsg(null);
    try {
      await apiJson("/api/attendance/clock-out", { method: "POST" });
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed");
    }
  };

  const fmt = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="space-y-6">
      <div className="card text-center">
        <div className="text-4xl font-bold tracking-wide text-slate-900">{tick.toLocaleTimeString()}</div>
        <div className="mt-1 text-sm text-slate-600">{tick.toLocaleDateString()}</div>
        {msg && <div className="mt-3 text-sm text-red-600">{msg}</div>}
        <div className="mt-6">
          {!active ? (
            <button type="button" className="btn-primary px-8 py-3" onClick={() => void clockIn()}>
              Clock in
            </button>
          ) : (
            <div className="space-y-3">
              <div className="text-sm text-emerald-700">Clocked in at {fmt(active.clockIn)}</div>
              <button type="button" className="btn-danger px-8 py-3" onClick={() => void clockOut()}>
                Clock out
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="card overflow-x-auto">
        <div className="mb-3 text-sm font-semibold text-slate-900">{isElevated ? "Team attendance" : "My attendance"}</div>
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-slate-500">
            <tr className="border-b border-slate-200">
              {isElevated && <th className="py-2 pr-3">User</th>}
              <th className="py-2 pr-3">Date</th>
              <th className="py-2 pr-3">In</th>
              <th className="py-2 pr-3">Out</th>
              <th className="py-2 pr-3">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 && (
              <tr>
                <td className="py-6 text-center text-slate-500" colSpan={5}>
                  No records
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                {isElevated && <td className="py-2 pr-3 font-medium">{r.userName}</td>}
                <td className="py-2 pr-3">{r.dateLabel}</td>
                <td className="py-2 pr-3">{fmt(r.clockIn)}</td>
                <td className="py-2 pr-3">{r.clockOut ? fmt(r.clockOut) : <span className="text-emerald-700">Active</span>}</td>
                <td className="py-2 pr-3 font-mono text-xs text-slate-600">{r.ip ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
