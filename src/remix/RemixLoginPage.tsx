import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import "./remix.css";

export function RemixLoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const go = async () => {
    if (!email || !password) {
      setErr("Please fill all fields");
      return;
    }
    setLoading(true);
    setErr("");
    try {
      await login(email.trim(), password);
    } catch {
      setErr("Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="deci-remix" style={{ minHeight: "100vh", background: "linear-gradient(135deg,#1e1b4b,#312e81 50%,#4338ca)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              width: 64,
              height: 64,
              background: "#6366f1",
              borderRadius: 16,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 26,
              fontWeight: 800,
              color: "#fff",
              marginBottom: 16,
            }}
          >
            D
          </div>
          <h1 style={{ color: "#fff", fontSize: 26, fontWeight: 700, marginBottom: 4 }}>DECI Portal</h1>
          <p style={{ color: "rgba(255,255,255,.6)", fontSize: 14 }}>Educational Program Management System</p>
        </div>
        <div style={{ background: "#fff", borderRadius: 16, padding: 32, boxShadow: "0 25px 50px rgba(0,0,0,.3)" }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 24, color: "#1e293b" }}>Sign In</h2>
          {err && <div style={{ background: "#fee2e2", color: "#dc2626", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{err}</div>}
          <div style={{ marginBottom: 16 }}>
            <label>Email</label>
            <input
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErr("");
              }}
              onKeyDown={(e) => e.key === "Enter" && void go()}
              placeholder="you@company.com"
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErr("");
              }}
              onKeyDown={(e) => e.key === "Enter" && void go()}
              placeholder="••••••••"
            />
          </div>
          <button type="button" className="dr-bp" onClick={() => void go()} disabled={loading} style={{ width: "100%", justifyContent: "center", padding: "12px", fontSize: 15 }}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
}
