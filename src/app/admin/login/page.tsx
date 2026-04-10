"use client";
// ============================================================
//  API: /api/admin-login
//  POST { password } → checks against ADMIN_PASSWORD in .env.local
//  Returns { success: true } or 401
// ============================================================
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function login() {
    if (!password.trim()) {
      setError("Please enter the password.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        sessionStorage.setItem("adminAuth", "true");
        router.push("/admin");
      } else {
        setError("Wrong password. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    }

    setLoading(false);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--navy)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div style={{ maxWidth: 380, width: "100%" }}>
        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              width: 56,
              height: 56,
              background: "var(--saffron)",
              borderRadius: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              fontSize: 24,
            }}
          >
            🔐
          </div>
          <h1
            style={{
              fontFamily: "'Noto Serif', serif",
              color: "#fff",
              fontSize: 22,
              fontWeight: 700,
            }}
          >
            Karia Marketing
          </h1>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, marginTop: 4 }}>
            Admin Panel
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 20,
            padding: 28,
          }}
        >
          <label
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.5)",
              display: "block",
              marginBottom: 8,
              fontWeight: 600,
              letterSpacing: "0.5px",
            }}
          >
            PASSWORD
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && login()}
            placeholder="Enter admin password"
            autoFocus
            style={{
              width: "100%",
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 12,
              padding: "14px 16px",
              fontSize: 15,
              color: "#fff",
              outline: "none",
              marginBottom: 16,
              boxSizing: "border-box",
            }}
          />

          {error && (
            <p style={{ fontSize: 13, color: "#fca5a5", marginBottom: 14 }}>
              {error}
            </p>
          )}

          <button
            onClick={login}
            disabled={loading}
            style={{
              width: "100%",
              background: "var(--saffron)",
              color: "#fff",
              fontWeight: 700,
              fontSize: 15,
              padding: 15,
              borderRadius: 12,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer",
              border: "none",
              transition: "opacity 0.15s",
            }}
          >
            {loading ? "Checking…" : "Login →"}
          </button>
        </div>

        <p
          style={{
            textAlign: "center",
            fontSize: 12,
            color: "rgba(255,255,255,0.3)",
            marginTop: 20,
          }}
        >
          Forgot password? Contact your developer.
        </p>
      </div>
    </div>
  );
}