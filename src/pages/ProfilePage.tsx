import { useEffect, useState } from "react";
import { apiForm, apiJson } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { Avatar } from "../components/Avatar";

type Profile = {
  user: {
    id: number;
    email: string;
    fullName: string;
    phone?: string | null;
    profileImageUrl?: string | null;
    role: string;
    isActive: boolean;
    createdAt: string;
  };
  stats?: { totalSessionsLogged: number; tasksCompleted: number } | null;
};

export function ProfilePage() {
  const { user, refreshMe } = useAuth();
  const [data, setData] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [cur, setCur] = useState("");
  const [nw, setNw] = useState("");

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const p = await apiJson<Profile>(`/api/users/${user.id}`);
      setData(p);
      setFullName(p.user.fullName);
      setPhone(p.user.phone ?? "");
    })();
  }, [user]);

  const saveProfile = async () => {
    await apiJson("/api/users/me/profile", { method: "PUT", body: JSON.stringify({ fullName, phone }) });
    await refreshMe();
    if (user) {
      const p = await apiJson<Profile>(`/api/users/${user.id}`);
      setData(p);
    }
  };

  const savePassword = async () => {
    await apiJson("/api/users/me/password", { method: "PUT", body: JSON.stringify({ currentPassword: cur, newPassword: nw }) });
    setCur("");
    setNw("");
    window.alert("Password updated");
  };

  const uploadAvatar = async (f: File | null) => {
    if (!f) return;
    const fd = new FormData();
    fd.append("file", f);
    await apiForm("/api/users/me/avatar", fd);
    await refreshMe();
    if (user) setData(await apiJson<Profile>(`/api/users/${user.id}`));
  };

  if (!data) return <div className="text-sm text-slate-600">Loading…</div>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">My profile</h1>
        <p className="mt-1 text-sm text-slate-600">Your information, activity summary, and security.</p>
      </div>
      <div className="card flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Avatar userId={data.user.id} name={data.user.fullName} imageUrl={data.user.profileImageUrl} size={56} />
          <div>
            <div className="text-lg font-semibold text-slate-900">{data.user.fullName}</div>
            <div className="text-sm text-slate-600">{data.user.email}</div>
            <div className="mt-1 text-xs text-slate-500">Role: {data.user.role}</div>
          </div>
        </div>
        <div>
          <label className="label">Profile picture</label>
          <input type="file" accept="image/*" className="text-sm" onChange={(e) => void uploadAvatar(e.target.files?.[0] ?? null)} />
        </div>
      </div>

      {data.stats ? (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Activity summary</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="card">
              <div className="text-xs text-slate-500">Total sessions logged</div>
              <div className="text-2xl font-bold text-slate-900">{data.stats.totalSessionsLogged}</div>
            </div>
            <div className="card">
              <div className="text-xs text-slate-500">Tasks completed</div>
              <div className="text-2xl font-bold text-slate-900">{data.stats.tasksCompleted}</div>
            </div>
          </div>
        </div>
      ) : (
        data.user.role !== "Coordinator" && (
          <div className="card text-sm text-slate-600">
            Session and task totals on this screen apply to <strong>coordinator</strong> field work. For organization-wide metrics, use{" "}
            <strong>Dashboard</strong> and <strong>Reports</strong>.
          </div>
        )
      )}

      <div className="card space-y-3">
        <div className="text-sm font-semibold text-slate-900">Update profile</div>
        <div>
          <label className="label">Full name</label>
          <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div>
          <label className="label">Phone</label>
          <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <button type="button" className="btn-primary" onClick={() => void saveProfile()}>
          Save profile
        </button>
      </div>

      <div className="card space-y-3">
        <div className="text-sm font-semibold text-slate-900">Change password</div>
        <div>
          <label className="label">Current password</label>
          <input className="input" type="password" value={cur} onChange={(e) => setCur(e.target.value)} />
        </div>
        <div>
          <label className="label">New password</label>
          <input className="input" type="password" value={nw} onChange={(e) => setNw(e.target.value)} />
        </div>
        <button type="button" className="btn-secondary" onClick={() => void savePassword()}>
          Update password
        </button>
      </div>
    </div>
  );
}
