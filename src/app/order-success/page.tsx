"use client";

// ============================================================
//  ORDER SUCCESS PAGE — /order-success  (UPDATED)
//  Now shows Return / Replacement button for returnable items.
// ============================================================
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Order } from "@/types";
import config from "@/lib/config";

export default function OrderSuccessPage() {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem("lastOrder");
    if (!saved) { router.push("/"); return; }
    setOrder(JSON.parse(saved));
  }, [router]);

  if (!order) return null;

  const isDelivery = order.order_type === "delivery";
  const returnableItems = order.items.filter((i) => i.product.is_returnable);

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ maxWidth: 420, width: "100%", display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Success */}
        <div style={{ textAlign: "center", padding: "20px 0 8px" }}>
          <div style={{ width: 72, height: 72, background: "#f0fdf4", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 32 }}>✅</div>
          <h1 style={{ fontFamily: "'Noto Serif', serif", fontSize: 26, fontWeight: 700, color: "var(--navy)" }}>Order Placed!</h1>
          <p style={{ color: "var(--muted)", marginTop: 6, fontSize: 14 }}>Thank you, {order.customer_name}. We've received your order.</p>
        </div>

        {/* Order summary */}
        <div className="card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { label: "Order ID", value: `#${order.id.slice(0, 8).toUpperCase()}`, mono: true },
            { label: "Total", value: `₹${order.total_amount?.toLocaleString("en-IN") ?? "0"}`, bold: true },
            { label: "Type", value: isDelivery ? "🏠 Home Delivery" : "🏪 Shop Pickup" },
            { label: "Payment", value: `Cash / UPI on ${isDelivery ? "delivery" : "pickup"}` },
          ].map((row) => (
            <div key={row.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
              <span style={{ color: "var(--muted)" }}>{row.label}</span>
              <span style={{ fontWeight: row.bold ? 700 : 500, color: "var(--navy)", fontFamily: row.mono ? "monospace" : "inherit", fontSize: row.mono ? 12 : 14 }}>{row.value}</span>
            </div>
          ))}
        </div>

        {/* Steps */}
        <div style={{ background: "var(--navy)", borderRadius: 18, padding: 20 }}>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 14 }}>What happens next</p>
          {[
            "Our team reviews your order",
            `We confirm a ${isDelivery ? "delivery" : "pickup"} date`,
            isDelivery ? "We deliver to your address" : `Visit us at ${config.shopAddress}`,
            "Pay by Cash or UPI",
          ].map((step, i) => (
            <div key={i} style={{ display: "flex", gap: 12, marginBottom: i < 3 ? 12 : 0, alignItems: "flex-start" }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--saffron)", color: "#fff", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
              <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, lineHeight: 1.5 }}>{step}</p>
            </div>
          ))}
        </div>

        {/* Return button */}
        {returnableItems.length > 0 && (
          <div className="card" style={{ padding: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--navy)", marginBottom: 10 }}>Need to return or replace?</p>
            {returnableItems.map((item) => (
              <button key={item.product.id}
                onClick={() => router.push(`/returns?orderId=${order.id}&product=${encodeURIComponent(item.product.name)}`)}
                style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f7f3ee", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 6 }}>
                <span style={{ color: "var(--navy)", fontWeight: 500 }}>{item.product.name}</span>
                <span style={{ color: "var(--saffron)", fontWeight: 600 }}>Return →</span>
              </button>
            ))}
          </div>
        )}

        {/* Contact */}
        <div className="card" style={{ padding: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--navy)" }}>Questions?</p>
            <p style={{ fontSize: 12, color: "var(--muted)" }}>We're here to help</p>
          </div>
          <a href={`tel:${config.shopPhone}`} style={{ background: "var(--saffron)", color: "#fff", fontSize: 13, fontWeight: 600, padding: "8px 16px", borderRadius: 10 }}>
            Call Us
          </a>
        </div>

        <button onClick={() => router.push("/")} style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 14, padding: 14, fontSize: 14, fontWeight: 600, color: "var(--navy)" }}>
          ← Back to Products
        </button>
      </div>
    </div>
  );
}