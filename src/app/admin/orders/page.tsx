"use client";

// ============================================================
//  ADMIN: ORDERS PAGE — /admin/orders
//  Shows all orders. Admin can:
//    - See order details + items
//    - Change order status (Accepted, Out for Delivery, etc.)
//    - Set a delivery date
//    - Handle return requests
//  Simple UI — no tech knowledge needed.
// ============================================================
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Order, OrderStatus } from "@/types";
import config from "@/lib/config";
import AdminGuard from "@/components/AdminGuard";

const STATUS_COLORS: Record<OrderStatus, { bg: string; text: string }> = {
  Placed:             { bg: "#fef3c7", text: "#92400e" },
  Accepted:           { bg: "#dbeafe", text: "#1e40af" },
  "Out for Delivery": { bg: "#ede9fe", text: "#5b21b6" },
  Delivered:          { bg: "#dcfce7", text: "#166534" },
  Cancelled:          { bg: "#fee2e2", text: "#991b1b" },
};

function Spinner({ label = "Saving…" }: { label?: string }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(255,255,255,0.75)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(2px)" }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: "24px 36px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, boxShadow: "0 4px 24px rgba(15,31,61,0.12)" }}>
        <div style={{ width: 32, height: 32, border: "3px solid var(--border)", borderTopColor: "var(--saffron)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <p style={{ fontSize: 13, color: "var(--muted)" }}>{label}</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function AdminOrdersContent() {
  const router = useRouter();
  const [orders, setOrders]         = useState<Order[]>([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [savingLabel, setSavingLabel] = useState("Saving…");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterStatus, setFilter]   = useState("All");

  const loadOrders = useCallback(async () => {
    setLoading(true);
    const res  = await fetch("/api/orders");
    const data = await res.json();
    setOrders(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  // Update a single order field — updates local state immediately
  async function updateOrder(id: string, payload: Partial<Order & { return_status: string }>, label = "Saving…") {
    setSavingLabel(label);
    setSaving(true);

    const res = await fetch(`/api/orders/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });

    if (res.ok) {
      const updated = await res.json();
      // Immediately update local state — no stale data
      setOrders((prev) => prev.map((o) => o.id === id ? { ...o, ...updated } : o));
    }

    setSaving(false);
  }

  // Count orders with unresolved return requests
  const returnPending = orders.filter(
    (o) => o.return_requested && !((o as Order & { return_status?: string }).return_status)
  ).length;

  const filtered = filterStatus === "All"
    ? orders
    : orders.filter((o) => o.status === filterStatus);

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
      {saving && <Spinner label={savingLabel} />}

      <header style={{ background: "var(--navy)", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 672, margin: "0 auto", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => router.push("/admin")}
              style={{ width: 36, height: 36, background: "rgba(255,255,255,0.1)", borderRadius: 10, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            </button>
            <p style={{ color: "#fff", fontSize: 16, fontWeight: 600 }}>Orders</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {returnPending > 0 && (
              <span style={{ background: "var(--saffron)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>
                {returnPending} return{returnPending > 1 ? "s" : ""} pending
              </span>
            )}
            <span style={{ background: "rgba(255,255,255,0.15)", color: "#fff", fontSize: 12, padding: "3px 10px", borderRadius: 20 }}>
              {orders.length} total
            </span>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="scrollbar-none" style={{ display: "flex", gap: 8, padding: "8px 16px 12px", overflowX: "auto" }}>
          {["All", ...config.orderStatuses].map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              style={{ flexShrink: 0, fontSize: 12, fontWeight: 600, padding: "6px 14px", borderRadius: 20, border: "none", cursor: "pointer", background: filterStatus === s ? "#fff" : "rgba(255,255,255,0.1)", color: filterStatus === s ? "var(--navy)" : "rgba(255,255,255,0.65)", transition: "all 0.15s" }}>
              {s}
            </button>
          ))}
        </div>
      </header>

      <main style={{ maxWidth: 672, margin: "0 auto", padding: 16, display: "flex", flexDirection: "column", gap: 10, paddingBottom: 40 }}>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 0", gap: 12 }}>
            <div style={{ width: 32, height: 32, border: "3px solid var(--border)", borderTopColor: "var(--saffron)", borderRadius: "50%", animation: "spin2 0.8s linear infinite" }} />
            <p style={{ fontSize: 13, color: "var(--muted)" }}>Loading orders…</p>
            <style>{`@keyframes spin2 { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--muted)" }}>
            <p style={{ fontSize: 36, marginBottom: 10 }}>📋</p>
            <p style={{ fontSize: 15, fontWeight: 600 }}>No orders yet</p>
          </div>
        ) : filtered.map((order) => {
          const orderWithReturn = order as Order & { return_status?: string };
          const sc = STATUS_COLORS[order.status] ?? { bg: "#f3f4f6", text: "#374151" };
          const isExpanded = expandedId === order.id;
          const isPaid     = order.payment_status === "paid";
          const returnStatus = orderWithReturn.return_status;

          return (
            <div key={order.id} className="card" style={{ overflow: "hidden" }}>

              {/* Summary row */}
              <button onClick={() => setExpandedId(isExpanded ? null : order.id)}
                style={{ width: "100%", textAlign: "left", padding: "14px 16px", background: "none", border: "none", cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "var(--navy)" }}>{order.customer_name}</p>
                      <span style={{ background: sc.bg, color: sc.text, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>
                        {order.status}
                      </span>
                      <span style={{ background: "#f3f4f6", color: "#374151", fontSize: 11, padding: "2px 8px", borderRadius: 20 }}>
                        {order.order_type === "delivery" ? "🏠" : "🏪"}
                      </span>
                      <span style={{ background: isPaid ? "#dcfce7" : "#fff8ee", color: isPaid ? "#166534" : "#92400e", fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20 }}>
                        {isPaid ? "💳 Paid" : order.payment_method === "online" ? "⏳ Pay pending" : "💵 Cash"}
                      </span>

                      {/* Return badge — shows current state clearly */}
                      {order.return_requested && (
                        <span style={{
                          background: returnStatus === "accepted" ? "#dcfce7" : returnStatus === "rejected" ? "#fee2e2" : "#fff7ed",
                          color:      returnStatus === "accepted" ? "#166534"  : returnStatus === "rejected" ? "#991b1b"  : "#c2410c",
                          fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                        }}>
                          ↩ {returnStatus ? `Return ${returnStatus}` : "Return pending"}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                      {order.customer_phone} · {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p style={{ fontSize: 15, fontWeight: 800, color: "var(--navy)" }}>
                      ₹{(order.total_amount ?? 0).toLocaleString("en-IN")}
                    </p>
                    <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{isExpanded ? "▲" : "▼"}</p>
                  </div>
                </div>
              </button>

              {/* Expanded panel */}
              {isExpanded && (
                <div style={{ borderTop: "1px solid var(--border)", padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>

                  {/* Items */}
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>Items</p>
                    {order.items.map((item, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                        <span>{item.product.name} × {item.quantity}</span>
                        <span style={{ fontWeight: 600 }}>
                          ₹{((item.product.price ?? 0) * item.quantity).toLocaleString("en-IN")}
                        </span>
                      </div>
                    ))}
                    {order.delivery_charge > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--muted)" }}>
                        <span>Delivery</span><span>₹{order.delivery_charge}</span>
                      </div>
                    )}
                  </div>

                  {/* Address */}
                  {order.customer_address && (
                    <div style={{ background: "#f7f3ee", borderRadius: 10, padding: "10px 14px" }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", marginBottom: 4 }}>ADDRESS</p>
                      <p style={{ fontSize: 13, color: "var(--navy)" }}>{order.customer_address}</p>
                    </div>
                  )}

                  {/* Return request section */}
                  {order.return_requested && (
                    <div style={{
                      background: returnStatus === "accepted" ? "#f0fdf4" : returnStatus === "rejected" ? "#fef2f2" : "#fff7ed",
                      border: `1px solid ${returnStatus === "accepted" ? "#bbf7d0" : returnStatus === "rejected" ? "#fecaca" : "#fed7aa"}`,
                      borderRadius: 12, padding: 14,
                    }}>
                      <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: returnStatus === "accepted" ? "var(--green)" : returnStatus === "rejected" ? "var(--red)" : "#c2410c" }}>
                        ↩ Return / Replacement Request
                        {returnStatus && ` — ${returnStatus.charAt(0).toUpperCase()}${returnStatus.slice(1)}`}
                      </p>
                      <p style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.5, marginBottom: returnStatus ? 0 : 12 }}>
                        {order.return_reason || "No reason given"}
                      </p>

                      {/* Only show buttons if not yet decided */}
                      {!returnStatus && (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                          <button
                            onClick={() => updateOrder(order.id, { return_status: "accepted" }, "Accepting return…")}
                            style={{ background: "var(--green)", color: "#fff", padding: "10px", borderRadius: 10, fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer" }}
                          >
                            ✓ Accept Return
                          </button>
                          <button
                            onClick={() => updateOrder(order.id, { return_status: "rejected" }, "Rejecting return…")}
                            style={{ background: "var(--red)", color: "#fff", padding: "10px", borderRadius: 10, fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer" }}
                          >
                            ✗ Reject Return
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Admin actions */}
                  <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Update Order</p>

                    <div>
                      <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 6 }}>Order Status</label>
                      <select value={order.status}
                        onChange={(e) => updateOrder(order.id, { status: e.target.value as OrderStatus }, "Updating status…")}
                        style={{ width: "100%", background: "#f7f3ee", border: "1px solid var(--border)", borderRadius: 12, padding: "11px 14px", fontSize: 14, outline: "none", color: "var(--navy)" }}>
                        {config.orderStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>

                    {order.order_type === "delivery" && (
                      <div>
                        <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 6 }}>Delivery Date</label>
                        <input type="date"
                          defaultValue={order.delivery_date ?? ""}
                          min={new Date().toISOString().split("T")[0]}
                          onChange={(e) => updateOrder(order.id, { delivery_date: e.target.value }, "Setting delivery date…")}
                          style={{ width: "100%", background: "#f7f3ee", border: "1px solid var(--border)", borderRadius: 12, padding: "11px 14px", fontSize: 14, outline: "none", color: "var(--navy)" }} />
                      </div>
                    )}

                    <a href={`tel:+91${order.customer_phone}`}
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#f0fdf4", border: "1px solid #bbf7d0", color: "var(--green)", padding: "11px", borderRadius: 12, fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
                      📞 Call {order.customer_name}
                    </a>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </main>
    </div>
  );
}

export default function AdminOrdersPage() {
  return <AdminGuard><AdminOrdersContent /></AdminGuard>;
}