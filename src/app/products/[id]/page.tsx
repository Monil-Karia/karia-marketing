"use client";

// ============================================================
//  PRODUCT DETAIL PAGE — /products/[id]
//  Shows full product info when customer taps a product.
//  Has a quantity selector and Add to Cart button.
//  Cart state is passed via sessionStorage.
// ============================================================

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { Product, CartItem } from "@/types";
import config from "@/lib/config";

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    fetch(`/api/products/${params.id}`)
      .then((r) => r.json())
      .then((d) => { setProduct(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [params.id]);

  function addToCart() {
    if (!product) return;
    const existing: CartItem[] = JSON.parse(sessionStorage.getItem("cart") || "[]");
    const idx = existing.findIndex((i) => i.product.id === product.id);
    if (idx >= 0) existing[idx].quantity = Math.min(existing[idx].quantity + qty, product.quantity);
    else existing.push({ product, quantity: qty });
    sessionStorage.setItem("cart", JSON.stringify(existing));
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
      <div style={{ maxWidth: 672, margin: "0 auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="skeleton" style={{ height: 56 }} />
        <div className="skeleton" style={{ height: 260 }} />
        <div className="skeleton" style={{ height: 140 }} />
      </div>
    </div>
  );

  if (!product) return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", color: "var(--muted)" }}>
        <p style={{ fontSize: 40, marginBottom: 8 }}>📦</p>
        <p>Product not found</p>
        <button onClick={() => router.push("/")} style={{ color: "var(--saffron)", fontSize: 13, marginTop: 8, textDecoration: "underline" }}>Back to products</button>
      </div>
    </div>
  );

  const oos = product.quantity === 0;

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
      {/* Header */}
      <header style={{ background: "var(--navy)", position: "sticky", top: 0, zIndex: 20 }}>
        <div style={{ maxWidth: 672, margin: "0 auto", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => router.back()} style={{ width: 36, height: 36, background: "rgba(255,255,255,0.1)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="18" height="18" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          </button>
          <p style={{ color: "#fff", fontSize: 15, fontWeight: 600, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{product.name}</p>
        </div>
      </header>

      <main style={{ maxWidth: 672, margin: "0 auto", padding: 16, paddingBottom: 120, display: "flex", flexDirection: "column", gap: 12 }}>

        {/* Image card */}
        <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 32, background: "#f7f3ee", position: "relative" }}>
          {product.image_url ? (
            <Image src={product.image_url} alt={product.name} width={180} height={180} style={{ objectFit: "contain" }} />
          ) : (
            <div style={{ width: 120, height: 120, background: "#ede8e0", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="40" height="40" fill="none" stroke="#c0b8ae" strokeWidth="1.5" viewBox="0 0 24 24">
                <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
              </svg>
            </div>
          )}
          {product.is_returnable && (
            <span style={{ position: "absolute", top: 12, right: 12, background: "#dcfce7", color: "var(--green)", fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20 }}>✓ Returnable</span>
          )}
        </div>

        {/* Info card */}
        <div className="card" style={{ padding: 20 }}>
          <span style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>{product.category}</span>
          <h2 style={{ fontFamily: "'Noto Serif', serif", fontSize: 22, fontWeight: 700, color: "var(--navy)", marginTop: 6, lineHeight: 1.25 }}>{product.name}</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14 }}>
            <span style={{ fontSize: 28, fontWeight: 800, color: "var(--navy)" }}>₹{product.price?.toLocaleString("en-IN") ?? "0"}</span>
            {!oos ? (
              <span style={{ background: "#f0fdf4", color: "var(--green)", fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 20 }}>{product.quantity} in stock</span>
            ) : (
              <span style={{ background: "#fef2f2", color: "var(--red)", fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 20 }}>Out of Stock</span>
            )}
          </div>
        </div>

        {/* Delivery info */}
        <div className="card" style={{ padding: 20 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: "var(--navy)", marginBottom: 12 }}>Delivery Info</p>
          {[
            { icon: "📍", text: `Home delivery within ${config.deliveryRadiusKm} km of our shop` },
            { icon: "💰", text: `₹${config.chargePerKm}/km delivery charge (min ₹${config.minDeliveryCharge})` },
            { icon: "🏪", text: "Free pickup at our Alibag shop" },
            { icon: "💳", text: "Pay by Cash or UPI on delivery/pickup" },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 14, marginTop: 1 }}>{item.icon}</span>
              <p style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.45 }}>{item.text}</p>
            </div>
          ))}
        </div>

        {/* Return policy */}
        <div className="card" style={{ padding: 20, background: product.is_returnable ? "#f0fdf4" : "#fafafa", borderLeft: `3px solid ${product.is_returnable ? "var(--green)" : "var(--border)"}`, borderRadius: 18 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: product.is_returnable ? "var(--green)" : "var(--muted)", marginBottom: 4 }}>
            {product.is_returnable ? "✓ Return & Replacement Eligible" : "× Not Returnable"}
          </p>
          <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.5 }}>
            {product.is_returnable
              ? "This product can be returned or replaced. Raise a request within 7 days of receiving your order."
              : "This product is not eligible for return. Please check all details carefully before ordering."}
          </p>
        </div>
      </main>

      {/* Fixed bottom */}
      {!oos && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff", padding: "12px 16px 24px", boxShadow: "0 -4px 20px rgba(15,31,61,0.08)", borderTop: "1px solid var(--border)" }}>
          <div style={{ maxWidth: 672, margin: "0 auto", display: "flex", gap: 12 }}>
            {/* Qty */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#f7f3ee", borderRadius: 12, padding: "0 14px" }}>
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} style={{ fontSize: 20, fontWeight: 700, color: "var(--navy)", padding: "10px 0" }}>−</button>
              <span style={{ fontSize: 15, fontWeight: 700, color: "var(--navy)", minWidth: 24, textAlign: "center" }}>{qty}</span>
              <button onClick={() => setQty((q) => Math.min(product.quantity, q + 1))} style={{ fontSize: 20, fontWeight: 700, color: "var(--navy)", padding: "10px 0" }}>+</button>
            </div>
            {/* Add button */}
            <button
              onClick={addToCart}
              className={added ? "" : "btn-primary"}
              style={{ flex: 1, padding: "14px", fontSize: 15, fontWeight: 700, borderRadius: 14, background: added ? "var(--green)" : "var(--saffron)", color: "#fff", transition: "background 0.2s" }}
            >
              {added ? "✓ Added!" : `Add to Cart — ₹${(product.price * qty)?.toLocaleString("en-IN") ?? "0"}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}