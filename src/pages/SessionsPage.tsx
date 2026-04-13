import { useEffect, useMemo, useState } from "react";
import { Eye, Plus, Search, Upload, X } from "lucide-react";
import { apiForm, apiJson } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import type { SessionDto } from "../types";
import { Badge } from "../components/Badge";

type CatalogItem = { id: number; name?: string; code?: string };

export function SessionsPage() {
  const { isElevated } = useAuth();
  const [sessions, setSessions] = useState<SessionDto[]>([]);
  const [search, setSearch] = useState("");
  const [fStatus, setFStatus] = useState("all");
  const [show, setShow] = useState(false);
  const [view, setView] = useState<SessionDto | null>(null);
  const [trainers, setTrainers] = useState<CatalogItem[]>([]);
  const [codes, setCodes] = useState<CatalogItem[]>([]);

  const [groupCode, setGroupCode] = useState("");
  const [trainerName, setTrainerName] = useState("");
  const [sessionDate, setSessionDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [sessionLink, setSessionLink] = useState("");
  const [recordingLink, setRecordingLink] = useState("");
  const [notes, setNotes] = useState("");
  const [attendanceFiles, setAttendanceFiles] = useState<FileList | null>(null);
  const [shots, setShots] = useState<FileList | null>(null);

  const load = async () => {
    const qs = new URLSearchParams();
    if (fStatus !== "all") qs.set("status", fStatus);
    if (search) qs.set("search", search);
    const q = qs.toString();
    const data = await apiJson<SessionDto[]>(`/api/sessions${q ? `?${q}` : ""}`);
    setSessions(data);
  };

  useEffect(() => {
    void load().catch(() => {});
  }, [fStatus]);

  useEffect(() => {
    void (async () => {
      try {
        const [t, c] = await Promise.all([
          apiJson<CatalogItem[]>("/api/catalog/trainers"),
          apiJson<CatalogItem[]>("/api/catalog/group-codes"),
        ]);
        setTrainers(t);
        setCodes(c);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const sLower = search.toLowerCase();
    return sessions.filter((s) => {
      if (!search) return true;
      return s.groupCode.toLowerCase().includes(sLower) || (s.trainerName || "").toLowerCase().includes(sLower);
    });
  }, [sessions, search]);

  const submit = async () => {
    if (!groupCode.trim()) {
      window.alert("Group code is required");
      return;
    }
    const fd = new FormData();
    fd.append("groupCode", groupCode.trim());
    fd.append("trainerName", trainerName);
    fd.append("sessionDate", sessionDate);
    fd.append("sessionLink", sessionLink);
    fd.append("recordingLink", recordingLink);
    fd.append("notes", notes);
    if (attendanceFiles) for (const f of Array.from(attendanceFiles)) fd.append("attendanceFiles", f);
    if (shots) for (const f of Array.from(shots)) fd.append("screenshots", f);
    await apiForm<SessionDto>("/api/sessions", fd);
    setShow(false);
    setGroupCode("");
    setTrainerName("");
    setSessionLink("");
    setRecordingLink("");
    setNotes("");
    setAttendanceFiles(null);
    setShots(null);
    await load();
  };

  const decide = async (id: number, status: "approved" | "rejected") => {
    await apiJson(`/api/sessions/${id}/decide`, { method: "POST", body: JSON.stringify({ status }) });
    await load();
    setView((v) => (v && v.id === id ? { ...v, status } : v));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input className="input pl-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search group or trainer…" />
        </div>
        <select className="input w-44" value={fStatus} onChange={(e) => setFStatus(e.target.value)}>
          <option value="all">All status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <button type="button" className="btn-primary" onClick={() => void load()}>
          Refresh
        </button>
        <button type="button" className="btn-primary" onClick={() => setShow(true)}>
          <Plus className="h-4 w-4" />
          Log session
        </button>
      </div>

      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={(e) => e.target === e.currentTarget && setShow(false)}>
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold">Log session</h3>
              <button type="button" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" onClick={() => setShow(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="label">Group code *</label>
                <select className="input" value={groupCode} onChange={(e) => setGroupCode(e.target.value)}>
                  <option value="">Select from master list…</option>
                  {codes.map((c) => (
                    <option key={c.id} value={c.code}>
                      {c.code}
                    </option>
                  ))}
                </select>
                <input className="input mt-2" value={groupCode} onChange={(e) => setGroupCode(e.target.value.toUpperCase())} placeholder="Or type manually" />
              </div>
              <div className="md:col-span-2">
                <label className="label">Trainer</label>
                <select className="input" value={trainerName} onChange={(e) => setTrainerName(e.target.value)}>
                  <option value="">Select trainer…</option>
                  {trainers.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Session date</label>
                <input className="input" type="date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <label className="label">Session link</label>
                <input className="input" value={sessionLink} onChange={(e) => setSessionLink(e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <label className="label">Recording link</label>
                <input className="input" value={recordingLink} onChange={(e) => setRecordingLink(e.target.value)} />
              </div>
              <div>
                <label className="label">Attendance files</label>
                <div className="rounded-lg border border-dashed border-slate-200 p-3 text-center text-xs text-slate-600">
                  <Upload className="mx-auto mb-1 h-4 w-4 text-slate-400" />
                  <input type="file" multiple className="w-full text-xs" onChange={(e) => setAttendanceFiles(e.target.files)} />
                </div>
              </div>
              <div>
                <label className="label">Screenshots</label>
                <div className="rounded-lg border border-dashed border-slate-200 p-3 text-center text-xs text-slate-600">
                  <Upload className="mx-auto mb-1 h-4 w-4 text-slate-400" />
                  <input type="file" accept="image/*" multiple className="w-full text-xs" onChange={(e) => setShots(e.target.files)} />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="label">Notes</label>
                <textarea className="input min-h-[90px]" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setShow(false)}>
                Cancel
              </button>
              <button type="button" className="btn-primary" onClick={() => void submit()}>
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {view && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={(e) => e.target === e.currentTarget && setView(null)}>
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-brand-600">{view.groupCode}</h3>
              <button type="button" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" onClick={() => setView(null)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 text-sm">
              {[
                ["Coordinator", view.coordinatorName],
                ["Trainer", view.trainerName || "—"],
                ["Date", view.sessionDate],
                ["Status", view.status],
                ["Session link", view.sessionLink || "—"],
                ["Recording link", view.recordingLink || "—"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg bg-slate-50 p-3">
                  <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{k}</div>
                  <div className="mt-1 break-all text-slate-900">{k === "Status" ? <Badge status={String(v)} /> : v}</div>
                </div>
              ))}
              <div className="md:col-span-2 rounded-lg bg-slate-50 p-3">
                <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Files</div>
                <ul className="mt-2 list-disc pl-5 text-slate-800">
                  {view.files.length === 0 && <li className="text-slate-500">None</li>}
                  {view.files.map((f) => (
                    <li key={f.url}>
                      <a className="text-brand-600 hover:underline" href={f.url} target="_blank" rel="noreferrer">
                        {f.originalName} ({f.kind})
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            {isElevated && view.status === "pending" && (
              <div className="mt-4 flex justify-end gap-2">
                <button type="button" className="btn-danger" onClick={() => void decide(view.id, "rejected")}>
                  Reject
                </button>
                <button type="button" className="btn-primary bg-emerald-600 hover:bg-emerald-700" onClick={() => void decide(view.id, "approved")}>
                  Approve
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-slate-500">
            <tr className="border-b border-slate-200">
              <th className="py-2 pr-3">Group</th>
              {isElevated && <th className="py-2 pr-3">Coordinator</th>}
              <th className="py-2 pr-3">Trainer</th>
              <th className="py-2 pr-3">Date</th>
              <th className="py-2 pr-3">Files</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2 pr-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 && (
              <tr>
                <td className="py-8 text-center text-slate-500" colSpan={7}>
                  No sessions
                </td>
              </tr>
            )}
            {filtered.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="py-2 pr-3 font-semibold text-brand-600">{s.groupCode}</td>
                {isElevated && <td className="py-2 pr-3">{s.coordinatorName}</td>}
                <td className="py-2 pr-3">{s.trainerName || "—"}</td>
                <td className="py-2 pr-3">{s.sessionDate}</td>
                <td className="py-2 pr-3 text-xs">{s.files.length ? `${s.files.length} file(s)` : "—"}</td>
                <td className="py-2 pr-3">
                  <Badge status={s.status} />
                </td>
                <td className="py-2 pr-3">
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="btn-secondary px-2 py-1 text-xs" onClick={() => setView(s)}>
                      <Eye className="h-3 w-3" />
                      View
                    </button>
                    {isElevated && s.status === "pending" && (
                      <>
                        <button type="button" className="btn-primary bg-emerald-600 px-2 py-1 text-xs hover:bg-emerald-700" onClick={() => void decide(s.id, "approved")}>
                          ✓
                        </button>
                        <button type="button" className="btn-danger px-2 py-1 text-xs" onClick={() => void decide(s.id, "rejected")}>
                          ✗
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
