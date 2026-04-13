"use client";

// ============================================================
//  ORDER PAGE — /order
//  1. Reads cart from sessionStorage
//  2. Customer chooses: Home Delivery or Shop Pickup
//  3. If delivery: checks GPS distance, shows charge
//  4. Customer fills name + phone
//  5. Submits order
// ============================================================"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CartItem, DeliveryCheckResult, OrderType } from "@/types";
import DeliveryChecker from "@/components/DeliveryChecker";
import config from "@/lib/config";

export default function OrderPage() {
  const router = useRouter();
  const [cart, setCart]               = useState<CartItem[]>([]);
  const [orderType, setOrderType]     = useState<OrderType>("pickup");
  const [deliveryOk, setDeliveryOk]   = useState(false);
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState("");
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);

  // ── Use refs for name, phone, address to avoid re-render on type ──
  const nameRef    = useRef<HTMLInputElement>(null);
  const phoneRef   = useRef<HTMLInputElement>(null);
  // address is kept in a ref too — DeliveryChecker writes to it via callback
  const addressRef = useRef<string>("");

  useEffect(() => {
    const saved = sessionStorage.getItem("cart");
    if (!saved) { router.push("/"); return; }
    setCart(JSON.parse(saved));
  }, [router]);

  const subtotal = cart.reduce((s, i) => s + (i.product.price ?? 0) * i.quantity, 0);
  const total    = subtotal + (orderType === "delivery" ? deliveryCharge : 0);

  // ── Callbacks for DeliveryChecker — stable refs, no re-render ──
  const handleAddressChange = useCallback((val: string) => {
    addressRef.current = val;
  }, []);

  const handleDeliveryResult = useCallback((result: DeliveryCheckResult) => {
    setDeliveryOk(result.isEligible);
    setDeliveryCharge(result.isEligible ? result.deliveryCharge : 0);
  }, []);

  function validate(): string | null {
    if (!nameRef.current?.value.trim())         return "Please enter your name.";
    if ((phoneRef.current?.value ?? "").replace(/\D/g,"").length < 10)
                                                return "Please enter a valid 10-digit phone number.";
    if (orderType === "delivery" && !deliveryOk) return "Please confirm your delivery location first.";
    if (orderType === "delivery" && !addressRef.current.trim())
                                                return "Please enter your delivery address.";
    return null;
  }

  async function placeOrder(): Promise<string | null> {
    const res = await fetch("/api/orders", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_name:    nameRef.current?.value.trim(),
        customer_phone:   (phoneRef.current?.value ?? "").replace(/\D/g,""),
        customer_address: orderType === "pickup" ? config.shopAddress : addressRef.current,
        items:            cart,
        subtotal,
        delivery_charge:  orderType === "delivery" ? deliveryCharge : 0,
        total_amount:     total,
        order_type:       orderType,
      }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Something went wrong."); return null; }
    sessionStorage.removeItem("cart");
    sessionStorage.setItem("lastOrder", JSON.stringify(data));
    return data.id;
  }

  async function handleCash() {
    const err = validate();
    if (err) { setError(err); return; }
    setSubmitting(true); setError("");
    const id = await placeOrder();
    if (id) router.push("/order-success");
    else setSubmitting(false);
  }

  async function handleOnline() {
    const err = validate();
    if (err) { setError(err); return; }
    setSubmitting(true); setError("");
    const id = await placeOrder();
    if (id) setPlacedOrderId(id);
    setSubmitting(false);
  }

  if (!cart.length) return null;

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="card" style={{ padding: 20 }}>
      <p style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 14 }}>
        {title}
      </p>
      {children}
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)" }}>

      {/* Header */}
      <header style={{ background: "var(--navy)", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 672, margin: "0 auto", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => router.back()}
            style={{ width: 36, height: 36, background: "rgba(255,255,255,0.1)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer" }}
          >
            <svg width="18" height="18" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
          </button>
          <p style={{ color: "#fff", fontSize: 16, fontWeight: 600 }}>Place Order</p>
        </div>
      </header>

      <main style={{ maxWidth: 672, margin: "0 auto", padding: 16, paddingBottom: 140, display: "flex", flexDirection: "column", gap: 12 }}>

        {/* Cart items */}
        <Section title="Your Items">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {cart.map((item) => (
              <div key={item.product.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                <span style={{ color: "#374151" }}>
                  {item.product.name}{" "}
                  <span style={{ color: "var(--muted)" }}>× {item.quantity}</span>
                </span>
                <span style={{ fontWeight: 600, color: "var(--navy)" }}>
                  ₹{((item.product.price ?? 0) * item.quantity).toLocaleString("en-IN")}
                </span>
              </div>
            ))}
          </div>
        </Section>

        {/* Delivery / Pickup */}
        <Section title="How do you want this?">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            {(["delivery", "pickup"] as OrderType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setOrderType(type)}
                style={{
                  padding: "14px 10px", borderRadius: 14, fontSize: 14, fontWeight: 600,
                  background: orderType === type ? "var(--navy)" : "#f7f3ee",
                  color: orderType === type ? "#fff" : "var(--navy)",
                  border: `2px solid ${orderType === type ? "var(--navy)" : "transparent"}`,
                  cursor: "pointer", transition: "all 0.15s",
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
              <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>Order will be ready once admin confirms.</p>
            </div>
          ) : (
            <DeliveryChecker
              onAddressChange={handleAddressChange}
              onResult={handleDeliveryResult}
            />
          )}
        </Section>

        {/* Customer details — uncontrolled inputs, no cursor jump */}
        <Section title="Your Details">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 6 }}>Full Name</label>
              <input
                ref={nameRef}
                type="text"
                placeholder="e.g. Ramesh Patil"
                autoComplete="name"
                style={{
                  width: "100%", background: "#f7f3ee", border: "1px solid var(--border)",
                  borderRadius: 12, padding: "12px 14px", fontSize: 14, outline: "none",
                  color: "var(--navy)", fontFamily: "inherit", boxSizing: "border-box",
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 6 }}>
                WhatsApp / Phone Number
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <span style={{
                  background: "#f7f3ee", border: "1px solid var(--border)", borderRadius: 12,
                  padding: "12px 14px", fontSize: 14, color: "var(--muted)", whiteSpace: "nowrap",
                }}>
                  +91
                </span>
                <input
                  ref={phoneRef}
                  type="tel"
                  placeholder="98765 43210"
                  autoComplete="tel"
                  maxLength={10}
                  style={{
                    flex: 1, background: "#f7f3ee", border: "1px solid var(--border)",
                    borderRadius: 12, padding: "12px 14px", fontSize: 14, outline: "none",
                    color: "var(--navy)", fontFamily: "inherit", boxSizing: "border-box",
                  }}
                />
              </div>
            </div>
          </div>
        </Section>

        {/* Payment method
        <Section title="Payment Method">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {([
              { method: "cash" as PaymentMethod, icon: "💵", label: "Cash / UPI", sub: "Pay on delivery/pickup" },
              { method: "online" as PaymentMethod, icon: "💳", label: "Pay Online", sub: "Cards, UPI, NetBanking" },
            ]).map(({ method, icon, label, sub }) => (
              <button
                key={method}
                type="button"
                onClick={() => setPayMethod(method)}
                style={{
                  padding: 14, borderRadius: 14, textAlign: "left", cursor: "pointer",
                  background: payMethod === method ? "#fff8ee" : "#f7f3ee",
                  border: `2px solid ${payMethod === method ? "var(--saffron)" : "transparent"}`,
                  transition: "all 0.15s",
                }}
              >
                <span style={{ fontSize: 22 }}>{icon}</span>
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--navy)", marginTop: 6 }}>{label}</p>
                <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{sub}</p>
              </button>
            ))}
          </div>
          {payMethod === "online" && (
            <div style={{ marginTop: 12, background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#92400e" }}>
              💡 Secure payment via Razorpay. Supports UPI, cards, and net banking.
            </div>
          )}
        </Section> */}

        {/* Bill */}
        <div className="card" style={{ padding: 20 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 14 }}>
            Bill Summary
          </p>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 14, color: "#4b5563" }}>
            <span>Subtotal</span>
            <span>₹{subtotal.toLocaleString("en-IN")}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 14, color: "#4b5563" }}>
            <span>Delivery</span>
            <span>
              {orderType === "pickup"
                ? "Free (Pickup)"
                : deliveryOk
                ? `₹${deliveryCharge}`
                : "—"}
            </span>
          </div>
          <div style={{ borderTop: "1px solid var(--border)", marginTop: 8, paddingTop: 10, display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: "var(--navy)" }}>Total</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: "var(--navy)" }}>
              ₹{total.toLocaleString("en-IN")}
            </span>
          </div>
          <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 8 }}>
            Payment collected on delivery/pickup. Cash &amp; UPI accepted.
          </p>
        </div>

        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "12px 16px", fontSize: 13, color: "var(--red)" }}>
            {error}
          </div>
        )}
      </main>

      {/* Fixed bottom CTA */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "#fff", padding: "12px 16px 28px",
        borderTop: "1px solid var(--border)",
        boxShadow: "0 -4px 20px rgba(15,31,61,0.08)",
      }}>
        <div style={{ maxWidth: 672, margin: "0 auto", display: "flex", flexDirection: "column", gap: 10 }}>
        </div>
      </div>
    </div>
  );
}