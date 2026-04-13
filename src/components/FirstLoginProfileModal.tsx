import { useState } from "react";
import { useAuth } from "../auth/AuthContext";

/**
 * Blocking first-login dialog: user must set a new email and password (and phone) before using the app.
 * No dismiss except sign out. Shown over the Profile area until complete-profile succeeds.
 */
export function FirstLoginProfileModal() {
  const { completeProfile, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setErr("");
    if (!currentPassword || !newEmail || !newPassword || !confirmPassword || !phone.trim()) {
      setErr("Please fill all fields");
      return;
    }
    setLoading(true);
    try {
      await completeProfile({
        currentPassword,
        newEmail: newEmail.trim(),
        newPassword,
        confirmPassword,
        phone: phone.trim(),
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      try {
        const j = JSON.parse(msg) as { title?: string; detail?: string };
        setErr(typeof j.detail === "string" ? j.detail : typeof j.title === "string" ? j.title : msg);
      } catch {
        setErr(msg.replace(/^"|"$/g, "") || "Request failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="first-login-title"
      >
        <h2 id="first-login-title" className="text-lg font-semibold text-slate-900">
          Security setup required
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Before you continue, set your work email and a new password. This step runs once per account.
        </p>
        {err && <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}
        <div className="mt-5 space-y-4">
          <div>
            <label className="label">Current password</label>
            <input
              className="input"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <div>
            <label className="label">New work email</label>
            <input className="input" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} autoComplete="email" />
          </div>
          <div>
            <label className="label">New password</label>
            <input
              className="input"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="label">Confirm new password</label>
            <input
              className="input"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="label">Phone number</label>
            <input className="input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
          </div>
        </div>
        <button type="button" className="btn-primary mt-6 w-full py-3" disabled={loading} onClick={() => void submit()}>
          {loading ? "Saving…" : "Save and continue"}
        </button>
        <button type="button" className="mt-4 w-full text-center text-sm text-slate-500 underline" onClick={() => logout()}>
          Sign out
        </button>
      </div>
    </div>
  );
}
