"use client";

// ============================================================
//  ORDER PAGE — /order
//  1. Reads cart from sessionStorage
//  2. Customer chooses: Home Delivery or Shop Pickup
//  3. If delivery: checks GPS distance, shows charge
//  4. Customer fills name + phone
//  5. Submits order
// ============================================================
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CartItem, DeliveryCheckResult, OrderType } from "@/types";
import DeliveryChecker from "@/components/DeliveryChecker";
import config from "@/lib/config";

export default function OrderPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<OrderType>("pickup");
  const [deliveryResult, setDeliveryResult] = useState<DeliveryCheckResult | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = sessionStorage.getItem("cart");
    if (!saved) { router.push("/"); return; }
    setCart(JSON.parse(saved));
  }, [router]);

  const subtotal = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const deliveryCharge = orderType === "delivery" && deliveryResult?.isEligible ? deliveryResult.deliveryCharge : 0;
  const total = subtotal + deliveryCharge;

  async function submit() {
    setError("");
    if (!name.trim()) return setError("Please enter your name.");
    if (phone.trim().length < 10) return setError("Please enter a valid 10-digit phone number.");
    if (orderType === "delivery" && !deliveryResult?.isEligible) return setError("Please confirm your delivery location first.");
    if (orderType === "delivery" && !deliveryAddress.trim()) return setError("Please enter your delivery address.");
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer_name: name.trim(), customer_phone: phone.trim(), customer_address: orderType === "pickup" ? config.shopAddress : deliveryAddress, items: cart, subtotal, delivery_charge: deliveryCharge, total_amount: total, order_type: orderType }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Something went wrong."); setSubmitting(false); return; }
      sessionStorage.removeItem("cart");
      sessionStorage.setItem("lastOrder", JSON.stringify(data));
      router.push("/order-success");
    } catch { setError("Network error. Please try again."); setSubmitting(false); }
  }

  if (!cart.length) return null;

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="card" style={{ padding: 20 }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 14 }}>{title}</p>
      {children}
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
      <header style={{ background: "var(--navy)", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 672, margin: "0 auto", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => router.back()} style={{ width: 36, height: 36, background: "rgba(255,255,255,0.1)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="18" height="18" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          </button>
          <p style={{ color: "#fff", fontSize: 16, fontWeight: 600 }}>Place Order</p>
        </div>
      </header>

      <main style={{ maxWidth: 672, margin: "0 auto", padding: 16, paddingBottom: 120, display: "flex", flexDirection: "column", gap: 12 }}>

        {/* Items summary */}
        <Section title="Your Items">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {cart.map((item) => (
              <div key={item.product.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                <span style={{ color: "#374151" }}>{item.product.name} <span style={{ color: "var(--muted)" }}>× {item.quantity}</span></span>
                <span style={{ fontWeight: 600, color: "var(--navy)" }}>₹{(item.product.price * item.quantity)?.toLocaleString("en-IN") ?? "0"}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Delivery or Pickup */}
        <Section title="How do you want this?">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            {(["delivery", "pickup"] as OrderType[]).map((type) => (
              <button
                key={type}
                onClick={() => setOrderType(type)}
                style={{
                  padding: "14px 10px", borderRadius: 14, fontSize: 14, fontWeight: 600,
                  background: orderType === type ? "var(--navy)" : "#f7f3ee",
                  color: orderType === type ? "#fff" : "var(--navy)",
                  border: `2px solid ${orderType === type ? "var(--navy)" : "transparent"}`,
                  transition: "all 0.15s",
                }}
              >
                {type === "delivery" ? "🏠 Home Delivery" : "🏪 Shop Pickup"}
              </button>
            ))}
          </div>
          {orderType === "pickup" ? (
            <div style={{ background: "#f7f3ee", borderRadius: 12, padding: 14 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--navy)", marginBottom: 4 }}>Visit us at:</p>
              <p style={{ fontSize: 13, color: "#4b5563" }}>{config.shopAddress}</p>
              <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>Order will be ready once confirmed by admin.</p>
            </div>
          ) : (
            <div>
              <DeliveryChecker onResult={(r, addr) => { setDeliveryResult(r); setDeliveryAddress(addr); }} />
            </div>
          )}
        </Section>

        {/* Customer details */}
        <Section title="Your Details">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 6 }}>Full Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ramesh Patil"
                style={{ width: "100%", background: "#f7f3ee", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 14px", fontSize: 14, outline: "none", color: "var(--navy)" }} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 6 }}>WhatsApp / Phone</label>
              <div style={{ display: "flex", gap: 8 }}>
                <span style={{ background: "#f7f3ee", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 14px", fontSize: 14, color: "var(--muted)", whiteSpace: "nowrap" }}>+91</span>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="98765 43210"
                  style={{ flex: 1, background: "#f7f3ee", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 14px", fontSize: 14, outline: "none", color: "var(--navy)" }} />
              </div>
            </div>
          </div>
        </Section>

        {/* Bill */}
        <div className="card" style={{ padding: 20 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 14 }}>Bill Summary</p>
          {[
            { label: "Subtotal", value: `₹${subtotal?.toLocaleString("en-IN") ?? "0"}` },
            { label: "Delivery", value: orderType === "pickup" ? "Free (Pickup)" : deliveryResult?.isEligible ? `₹${deliveryCharge}` : "—" },
          ].map((row) => (
            <div key={row.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 14, color: "#4b5563" }}>
              <span>{row.label}</span><span>{row.value}</span>
            </div>
          ))}
          <div style={{ borderTop: "1px solid var(--border)", marginTop: 8, paddingTop: 10, display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: "var(--navy)" }}>Total</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: "var(--navy)" }}>₹{total?.toLocaleString("en-IN") ?? "0"}</span>
          </div>
          <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 8 }}>Payment collected on delivery/pickup. Cash & UPI accepted.</p>
        </div>

        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "12px 16px", fontSize: 13, color: "var(--red)" }}>{error}</div>
        )}
      </main>

      {/* Fixed place order */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff", padding: "12px 16px 24px", borderTop: "1px solid var(--border)", boxShadow: "0 -4px 20px rgba(15,31,61,0.08)" }}>
        <div style={{ maxWidth: 672, margin: "0 auto" }}>
          <button onClick={submit} disabled={submitting} className="btn-primary" style={{ width: "100%", padding: 16, fontSize: 16, opacity: submitting ? 0.6 : 1 }}>
            {submitting ? "Placing Order…" : `Place Order — ₹${total?.toLocaleString("en-IN") ?? "0"}`}
          </button>
        </div>
      </div>
    </div>
  );
}