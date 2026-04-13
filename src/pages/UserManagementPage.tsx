import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { apiJson } from "../api/client";
import { Avatar } from "../components/Avatar";
import type { PageId } from "../types";

type UserRow = {
  id: number;
  email: string;
  fullName: string;
  phone?: string | null;
  profileImageUrl?: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
};

export function UserManagementPage({
  setPage,
  onOpenControlPanel,
}: {
  setPage: (p: PageId) => void;
  /** When set, &quot;Control panel&quot; switches admin hub to the control tab instead of navigating away. */
  onOpenControlPanel?: () => void;
}) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [show, setShow] = useState(false);
  const [edit, setEdit] = useState<UserRow | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("Coordinator");

  const load = async () => setUsers(await apiJson<UserRow[]>("/api/users/all"));

  useEffect(() => {
    void load().catch(() => {});
  }, []);

  const openCreate = () => {
    setEdit(null);
    setEmail("");
    setPassword("");
    setFullName("");
    setPhone("");
    setRole("Coordinator");
    setShow(true);
  };

  const openEdit = (u: UserRow) => {
    setEdit(u);
    setEmail(u.email);
    setPassword("");
    setFullName(u.fullName);
    setPhone(u.phone ?? "");
    setRole(u.role);
    setShow(true);
  };

  const save = async () => {
    if (edit) {
      await apiJson(`/api/users/${edit.id}`, {
        method: "PUT",
        body: JSON.stringify({
          email,
          fullName,
          phone,
          password: password || undefined,
          role,
          isActive: edit.isActive,
        }),
      });
    } else {
      if (!password) {
        window.alert("Password required for new users");
        return;
      }
      await apiJson("/api/users", {
        method: "POST",
        body: JSON.stringify({ email, password, fullName, phone, role }),
      });
    }
    setShow(false);
    await load();
  };

  const deactivate = async (u: UserRow) => {
    if (!window.confirm(`Deactivate ${u.fullName}?`)) return;
    await apiJson(`/api/users/${u.id}`, { method: "DELETE" });
    await load();
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">User &amp; profile management</h1>
        <p className="mt-1 text-sm text-slate-600">
          Manage coordinators and managers. Each user has a profile page for their details, photo, password, and activity.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-slate-600">{users.length} users</div>
        <div className="flex gap-2">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => (onOpenControlPanel ? onOpenControlPanel() : setPage("settings"))}
          >
            Control panel
          </button>
          <button type="button" className="btn-primary" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add user
          </button>
        </div>
      </div>

      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={(e) => e.target === e.currentTarget && setShow(false)}>
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">{edit ? "Edit user" : "New user"}</h3>
              <button type="button" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" onClick={() => setShow(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="label">Email</label>
                <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} disabled={!!edit} />
              </div>
              <div>
                <label className="label">{edit ? "New password (optional)" : "Password *"}</label>
                <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <div>
                <label className="label">Full name</label>
                <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div>
                <label className="label">Phone</label>
                <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div>
                <label className="label">Role</label>
                <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="Coordinator">Coordinator</option>
                  <option value="Manager">Manager</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setShow(false)}>
                Cancel
              </button>
              <button type="button" className="btn-primary" onClick={() => void save()}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-slate-500">
            <tr className="border-b border-slate-200">
              <th className="py-2 pr-3">User</th>
              <th className="py-2 pr-3">Email</th>
              <th className="py-2 pr-3">Phone</th>
              <th className="py-2 pr-3">Role</th>
              <th className="py-2 pr-3">Active</th>
              <th className="py-2 pr-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="py-2 pr-3">
                  <div className="flex items-center gap-2">
                    <Avatar userId={u.id} name={u.fullName} imageUrl={u.profileImageUrl} size={32} />
                    <div className="font-medium text-slate-900">{u.fullName}</div>
                  </div>
                </td>
                <td className="py-2 pr-3">{u.email}</td>
                <td className="py-2 pr-3">{u.phone || "—"}</td>
                <td className="py-2 pr-3">{u.role}</td>
                <td className="py-2 pr-3">{u.isActive ? "Yes" : "No"}</td>
                <td className="py-2 pr-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn-secondary px-2 py-1 text-xs"
                      onClick={() => openEdit(u)}
                      disabled={u.role === "Admin"}
                      title={u.role === "Admin" ? "Primary administrator cannot be edited here" : undefined}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn-danger px-2 py-1 text-xs"
                      onClick={() => void deactivate(u)}
                      disabled={!u.isActive || u.role === "Admin"}
                      title={u.role === "Admin" ? "Primary administrator cannot be deactivated" : undefined}
                    >
                      Deactivate
                    </button>
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
