"use client";

// ============================================================
//  ORDER TRACKING PAGE — /track
//  Customer enters their phone number to see all their orders.
//  Shows status, delivery date, and items for each order.
//  No login needed — just phone number lookup.
// ============================================================

import { useState } from "react";
import { Order } from "@/types";
import { useRouter } from "next/navigation";
import config from "@/lib/config";

const STATUS_STEPS = ["Placed", "Accepted", "Out for Delivery", "Delivered"];
const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  Placed:            { bg: "#fef3c7", text: "#92400e" },
  Accepted:          { bg: "#dbeafe", text: "#1e40af" },
  "Out for Delivery":{ bg: "#ede9fe", text: "#5b21b6" },
  Delivered:         { bg: "#dcfce7", text: "#166534" },
  Cancelled:         { bg: "#fee2e2", text: "#991b1b" },
};

export default function TrackOrderPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  async function search() {
    const cleaned = phone.trim().replace(/\D/g, "");
    if (cleaned.length < 10) { setError("Please enter a valid 10-digit number."); return; }
    setLoading(true); setError(""); setSearched(false);
    const res = await fetch(`/api/orders/track?phone=${cleaned}`);
    const data = await res.json();
    setOrders(Array.isArray(data) ? data : []);
    setSearched(true); setLoading(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
      <header style={{ background: "var(--navy)", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 672, margin: "0 auto", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => router.push("/")} style={{ width: 36, height: 36, background: "rgba(255,255,255,0.1)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="18" height="18" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          </button>
          <p style={{ color: "#fff", fontSize: 16, fontWeight: 600 }}>Track My Order</p>
        </div>
      </header>

      <main style={{ maxWidth: 672, margin: "0 auto", padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Search */}
        <div className="card" style={{ padding: 20 }}>
          <p style={{ fontSize: 14, color: "#4b5563", marginBottom: 14 }}>Enter the phone number you used when placing your order.</p>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <span style={{ background: "#f7f3ee", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 14px", fontSize: 14, color: "var(--muted)" }}>+91</span>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              onKeyDown={(e) => e.key === "Enter" && search()}
              placeholder="98765 43210"
              style={{ flex: 1, background: "#f7f3ee", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 14px", fontSize: 14, outline: "none", color: "var(--navy)" }} />
          </div>
          {error && <p style={{ fontSize: 13, color: "var(--red)", marginBottom: 10 }}>{error}</p>}
          <button onClick={search} disabled={loading} className="btn-navy" style={{ width: "100%", padding: 14, fontSize: 15, opacity: loading ? 0.7 : 1 }}>
            {loading ? "Searching…" : "Find My Orders"}
          </button>
        </div>

        {/* No results */}
        {searched && orders.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--muted)" }}>
            <p style={{ fontSize: 36, marginBottom: 10 }}>🔍</p>
            <p style={{ fontSize: 15, fontWeight: 600 }}>No orders found</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>
              Contact us at <a href={`tel:${config.shopPhone}`} style={{ color: "var(--saffron)" }}>{config.shopPhone}</a>
            </p>
          </div>
        )}

        {/* Orders */}
        {orders.map((order) => {
          const stepIdx = STATUS_STEPS.indexOf(order.status);
          const sc = STATUS_COLOR[order.status] ?? { bg: "#f3f4f6", text: "#374151" };
          const isCancelled = order.status === "Cancelled";

          return (
            <div key={order.id} className="card" style={{ overflow: "hidden" }}>
              {/* Header row */}
              <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <p style={{ fontFamily: "monospace", fontSize: 12, color: "var(--muted)" }}>#{order.id.slice(0, 8).toUpperCase()}</p>
                  <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                    {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ background: sc.bg, color: sc.text, fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20 }}>{order.status}</span>
                  <p style={{ fontSize: 15, fontWeight: 800, color: "var(--navy)", marginTop: 4 }}>₹{order.total_amount?.toLocaleString("en-IN") ?? "0"}</p>
                </div>
              </div>

              {/* Progress */}
              {!isCancelled && (
                <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", alignItems: "center", position: "relative" }}>
                    <div style={{ position: "absolute", top: 10, left: "10%", right: "10%", height: 2, background: "#e5e7eb", borderRadius: 1 }} />
                    <div style={{ position: "absolute", top: 10, left: "10%", height: 2, background: "var(--saffron)", borderRadius: 1, width: stepIdx >= 0 ? `${(stepIdx / (STATUS_STEPS.length - 1)) * 80}%` : "0%", transition: "width 0.5s" }} />
                    {STATUS_STEPS.map((s, i) => (
                      <div key={s} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, position: "relative" }}>
                        <div style={{ width: 20, height: 20, borderRadius: "50%", background: i <= stepIdx ? "var(--saffron)" : "#e5e7eb", color: i <= stepIdx ? "#fff" : "#9ca3af", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1 }}>
                          {i < stepIdx ? "✓" : i + 1}
                        </div>
                        <p style={{ fontSize: 9, color: i <= stepIdx ? "var(--saffron)" : "var(--muted)", fontWeight: i === stepIdx ? 700 : 400, textAlign: "center", lineHeight: 1.2 }}>{s}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Delivery date */}
              {order.delivery_date && (
                <div style={{ padding: "10px 20px", background: "#fffbeb", borderBottom: "1px solid #fde68a" }}>
                  <p style={{ fontSize: 13, color: "#92400e", fontWeight: 600 }}>
                    {order.order_type === "delivery" ? "🚚 Delivery on: " : "🏪 Pickup ready: "}
                    {new Date(order.delivery_date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
                  </p>
                </div>
              )}

              {/* Items */}
              <div style={{ padding: "14px 20px", display: "flex", flexDirection: "column", gap: 6 }}>
                {order.items.map((item, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <span style={{ color: "#374151" }}>{item.product.name} <span style={{ color: "var(--muted)" }}>× {item.quantity}</span></span>
                    <span style={{ fontWeight: 600, color: "var(--navy)" }}>₹{(item.product.price * item.quantity)?.toLocaleString("en-IN") ?? "0"}</span>
                  </div>
                ))}
              </div>

              {/* Return */}
              {order.return_requested ? (
                <div style={{ margin: "0 16px 16px", background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#9a3412" }}>
                  Return/replacement request submitted. We'll contact you soon.
                </div>
              ) : order.status === "Delivered" && order.items.some((i) => i.product.is_returnable) ? (
                <div style={{ padding: "0 16px 16px" }}>
                  <button onClick={() => router.push(`/returns?orderId=${order.id}&product=${encodeURIComponent(order.items.find((i) => i.product.is_returnable)?.product.name ?? "")}`)}
                    style={{ width: "100%", background: "#f7f3ee", borderRadius: 10, padding: "10px", fontSize: 13, fontWeight: 600, color: "var(--navy)" }}>
                    Request Return / Replacement →
                  </button>
                </div>
              ) : null}
            </div>
          );
        })}
      </main>
    </div>
  );
}