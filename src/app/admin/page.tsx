"use client";

// ============================================================
//  ADMIN DASHBOARD — /admin  (UPDATED)
//  Added: Process Images button so admin can trigger
//         image upload without opening a terminal.
// ============================================================
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Order } from "@/types";
import AdminGuard from "@/components/AdminGuard";

function Dashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [processResult, setProcessResult] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    fetch("/api/orders").then((r) => r.json()).then((d) => { setOrders(Array.isArray(d) ? d : []); setLoading(false); });
  }, []);

  const newOrders = orders.filter((o) => o.status === "Placed").length;
  const inProgress = orders.filter((o) => o.status === "Accepted" || o.status === "Out for Delivery").length;
  const returnRequests = orders.filter((o) => o.return_requested).length;

  async function processImages() {
    setProcessing(true); setProcessResult(null);
    try {
      const res = await fetch("/api/process-images", { method: "POST" });
      const data = await res.json();
      setProcessResult(data.processed === 0
        ? { ok: false, msg: "No new images found in admin-uploads folder." }
        : { ok: true, msg: `${data.processed} product(s) added to the website!` });
    } catch { setProcessResult({ ok: false, msg: "Something went wrong. Please try again." }); }
    setProcessing(false);
  }

  const tiles = [
    { label: "New Orders", value: loading ? "—" : String(newOrders), sub: "Tap to respond", icon: "📬", route: "/admin/orders", urgent: newOrders > 0 },
    { label: "In Progress", value: loading ? "—" : String(inProgress), sub: "Accepted / Out for delivery", icon: "🚚", route: "/admin/orders", urgent: false },
    { label: "All Orders", value: loading ? "—" : String(orders.length), sub: "Full history", icon: "📋", route: "/admin/orders", urgent: false },
    { label: "Products", value: "", sub: "Edit prices & stock", icon: "📦", route: "/admin/products", urgent: false },
    { label: "Inventory", value: "", sub: "Stock levels", icon: "📊", route: "/admin/inventory", urgent: false },
    { label: "View Site", value: "", sub: "Customer view", icon: "🌐", route: "/", urgent: false },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
      {/* Header */}
      <div style={{ background: "var(--navy)", padding: "24px 16px 20px" }}>
        <div style={{ maxWidth: 672, margin: "0 auto", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>Admin Panel</p>
            <h1 style={{ fontFamily: "'Noto Serif', serif", color: "#fff", fontSize: 22, fontWeight: 700, marginTop: 4 }}>Karia Marketing</h1>
          </div>
          <button onClick={() => { sessionStorage.removeItem("adminAuth"); router.push("/admin/login"); }}
            style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", fontSize: 12, padding: "6px 12px", borderRadius: 8, marginTop: 4 }}>
            Logout
          </button>
        </div>

        {/* Return request banner */}
        {returnRequests > 0 && (
          <div style={{ maxWidth: 672, margin: "14px auto 0", background: "rgba(232,134,26,0.2)", border: "1px solid rgba(232,134,26,0.4)", borderRadius: 12, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ color: "#fcd34d", fontSize: 13, fontWeight: 600 }}>⚠ {returnRequests} return request{returnRequests > 1 ? "s" : ""} pending</p>
            <button onClick={() => router.push("/admin/orders")} style={{ color: "#fcd34d", fontSize: 12, textDecoration: "underline" }}>View →</button>
          </div>
        )}
      </div>

      <main style={{ maxWidth: 672, margin: "0 auto", padding: "16px 16px 40px", display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Tiles grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {tiles.map((t) => (
            <button key={t.label} onClick={() => router.push(t.route)}
              className="card"
              style={{ padding: 16, textAlign: "left", outline: t.urgent ? `2px solid var(--saffron)` : "none", outlineOffset: 2, transition: "transform 0.12s" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span style={{ fontSize: 24 }}>{t.icon}</span>
                {t.urgent && <span style={{ background: "var(--saffron)", color: "#fff", fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 20 }}>NEW</span>}
              </div>
              {t.value && <p style={{ fontSize: 28, fontWeight: 800, color: "var(--navy)", marginTop: 8 }}>{t.value}</p>}
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--navy)", marginTop: t.value ? 2 : 12 }}>{t.label}</p>
              <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{t.sub}</p>
            </button>
          ))}
        </div>

        {/* Add Product */}
        <div className="card" style={{ padding: 20 }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: "var(--navy)", marginBottom: 4 }}>Add New Product</p>
          <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 14 }}>
            Rename your photo file, drop it in the <code style={{ background: "#f7f3ee", padding: "1px 6px", borderRadius: 6, fontSize: 12 }}>admin-uploads</code> folder, then tap the button below.
          </p>

          {/* Format guide */}
          <div style={{ background: "var(--navy)", borderRadius: 12, padding: 14, marginBottom: 14 }}>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>Filename format</p>
            <code style={{ color: "var(--saffron2)", fontSize: 13, fontWeight: 600 }}>ProductName_Price_YES_Quantity.jpg</code>
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 4 }}>
              {["NeckMassager_1499_YES_25.jpg", "WirelessCharger_899_NO_10.jpg"].map((ex) => (
                <code key={ex} style={{ color: "rgba(255,255,255,0.55)", fontSize: 12 }}>{ex}</code>
              ))}
            </div>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 8 }}>YES = returnable &nbsp;·&nbsp; NO = not returnable</p>
          </div>

          <button onClick={processImages} disabled={processing}
            className="btn-primary"
            style={{ width: "100%", padding: 14, fontSize: 14, opacity: processing ? 0.7 : 1 }}>
            {processing ? "Processing…" : "Process New Images →"}
          </button>

          {processResult && (
            <div style={{ marginTop: 12, background: processResult.ok ? "#f0fdf4" : "#f9fafb", border: `1px solid ${processResult.ok ? "#bbf7d0" : "#e5e7eb"}`, borderRadius: 10, padding: "10px 14px", fontSize: 13, color: processResult.ok ? "var(--green)" : "var(--muted)" }}>
              {processResult.ok ? "✓ " : ""}{processResult.msg}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function AdminDashboard() {
  return <AdminGuard><Dashboard /></AdminGuard>;
}