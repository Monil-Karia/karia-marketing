"use client";

// ============================================================
//  HOMEPAGE — Product Listing
//  Mobile-first. Shows all products with category filter.
//  Manages cart state. Opens cart drawer on cart button press.
// ============================================================

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Product, CartItem } from "@/types";
import config from "@/lib/config";
import ProductCard from "@/components/ProductCard";
import CartDrawer from "@/components/CartDrawer";

export default function HomePage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setProducts(data || []);
        setFiltered(data || []);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    let r = products;
    if (category !== "All") r = r.filter((p) => p.category === category);
    if (search.trim()) r = r.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
    setFiltered(r);
  }, [category, search, products]);

  function addToCart(product: Product) {
    setCart((prev) => {
      const ex = prev.find((i) => i.product.id === product.id);
      if (ex) return prev.map((i) => i.product.id === product.id ? { ...i, quantity: Math.min(i.quantity + 1, product.quantity) } : i);
      return [...prev, { product, quantity: 1 }];
    });
    setCartOpen(true);
  }

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const cartTotal = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);

  return (
    <div className="min-h-screen" style={{ background: "var(--cream)" }}>

      {/* ── Header ─────────────────────────────────────────── */}
      <header style={{ background: "var(--navy)" }} className="sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 pt-4 pb-3">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div style={{ background: "var(--saffron)", width: 6, height: 22, borderRadius: 3 }} />
                <h1 style={{ fontFamily: "'Noto Serif', serif", color: "#fff", fontSize: 20, fontWeight: 700, letterSpacing: "-0.3px" }}>
                  Karia Marketing
                </h1>
              </div>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, marginTop: 2, marginLeft: 14 }}>
                📍 {config.shopAddress}
              </p>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={() => router.push("/track")}
                style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.85)", fontSize: 12, padding: "6px 12px", borderRadius: 10, fontWeight: 500 }}
              >
                Track Order
              </button>
              <button
                onClick={() => setCartOpen(true)}
                style={{ background: "var(--saffron)", borderRadius: 12, padding: "8px 12px", position: "relative" }}
              >
                <svg width="20" height="20" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
                </svg>
                {cartCount > 0 && (
                  <span style={{ position: "absolute", top: -6, right: -6, background: "#fff", color: "var(--saffron)", fontSize: 10, fontWeight: 700, width: 18, height: 18, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Search */}
          <div style={{ marginTop: 14, position: "relative" }}>
            <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", opacity: 0.4 }} width="16" height="16" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products…"
              style={{ width: "100%", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12, padding: "10px 12px 10px 36px", color: "#fff", fontSize: 14, outline: "none" }}
            />
          </div>
        </div>

        {/* Category pills */}
        <div className="scrollbar-none" style={{ display: "flex", gap: 8, padding: "10px 16px 14px", overflowX: "auto" }}>
          {config.categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              style={{
                flexShrink: 0, fontSize: 13, fontWeight: 500,
                padding: "6px 16px", borderRadius: 20,
                background: category === cat ? "var(--saffron)" : "rgba(255,255,255,0.12)",
                color: category === cat ? "#fff" : "rgba(255,255,255,0.7)",
                border: category === cat ? "none" : "1px solid rgba(255,255,255,0.15)",
                transition: "all 0.15s",
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      {/* ── Products grid ───────────────────────────────────── */}
      <main className="max-w-2xl mx-auto px-4 py-4 pb-32">
        {loading ? (
          <div className="grid grid-cols-2 gap-3 stagger">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton fade-up" style={{ height: 220 }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--muted)" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
            <p style={{ fontSize: 15, fontWeight: 500 }}>No products found</p>
            {search && <button onClick={() => setSearch("")} style={{ color: "var(--saffron)", fontSize: 13, marginTop: 8, textDecoration: "underline" }}>Clear search</button>}
          </div>
        ) : (
          <>
            <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>
              {filtered.length} product{filtered.length !== 1 ? "s" : ""}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 stagger">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} onAddToCart={addToCart} />
              ))}
            </div>
          </>
        )}
      </main>

      {/* ── Floating cart bar ───────────────────────────────── */}
      {cartCount > 0 && !cartOpen && (
        <div style={{ position: "fixed", bottom: 20, left: 16, right: 16, zIndex: 30, maxWidth: 672, margin: "0 auto" }}>
          <button
            onClick={() => setCartOpen(true)}
            className="btn-primary"
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", fontSize: 15, boxShadow: "0 8px 32px rgba(232,134,26,0.35)" }}
          >
            <span style={{ background: "rgba(255,255,255,0.25)", borderRadius: 8, padding: "2px 10px", fontSize: 13 }}>
              {cartCount} item{cartCount !== 1 ? "s" : ""}
            </span>
            <span>View Cart</span>
            <span>₹{cartTotal?.toLocaleString("en-IN") ?? "0"}</span>
          </button>
        </div>
      )}

      <CartDrawer
        items={cart}
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        onUpdateQty={(id, qty) => setCart((p) => p.map((i) => i.product.id === id ? { ...i, quantity: qty } : i))}
        onRemove={(id) => setCart((p) => p.filter((i) => i.product.id !== id))}
      />
    </div>
  );
}