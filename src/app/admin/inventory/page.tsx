"use client";
// ============================================================
//  ADMIN: INVENTORY PAGE — /admin/inventory
//  At-a-glance stock view.
//  Shows low stock warnings and out-of-stock items.
// ============================================================

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Product } from "@/types";
import AdminGuard from "@/components/AdminGuard";

function InventoryContent() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    // Fetch ALL products including out-of-stock and hidden ones
    fetch("/api/products/all")
      .then((r) => r.json())
      .then((data) => {
        setProducts(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, []);

  const outOfStock = products.filter((p) => p.quantity === 0);
  const lowStock   = products.filter((p) => p.quantity > 0 && p.quantity <= 5);
  const inStock    = products.filter((p) => p.quantity > 5);

  function Section({ title, items, color, emptyMsg }: {
    title: string; items: Product[]; color: string; emptyMsg: string;
  }) {
    return (
      <div>
        <h2 style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10, color }}>
          {title} ({items.length})
        </h2>
        {items.length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--muted)", padding: "8px 0" }}>{emptyMsg}</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {items.map((p) => (
              <div key={p.id} className="card" style={{ padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "var(--navy)" }}>{p.name}</p>
                  <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                    {p.category} · ₹{(p.price ?? 0).toLocaleString("en-IN")}
                    {!p.is_active && <span style={{ marginLeft: 8, color: "var(--red)", fontSize: 11 }}>(hidden)</span>}
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: 20, fontWeight: 800, color: p.quantity === 0 ? "var(--red)" : p.quantity <= 5 ? "#d97706" : "var(--green)" }}>
                    {p.quantity}
                  </p>
                  <p style={{ fontSize: 11, color: "var(--muted)" }}>units</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
      <header style={{ background: "var(--navy)", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 672, margin: "0 auto", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => router.push("/admin")}
            style={{ width: 36, height: 36, background: "rgba(255,255,255,0.1)", borderRadius: 10, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="18" height="18" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          </button>
          <p style={{ color: "#fff", fontSize: 16, fontWeight: 600 }}>Inventory</p>
          <span style={{ marginLeft: "auto", background: "rgba(255,255,255,0.15)", color: "#fff", fontSize: 12, padding: "3px 10px", borderRadius: 20 }}>
            {products.length} total
          </span>
        </div>
      </header>

      <main style={{ maxWidth: 672, margin: "0 auto", padding: 16, display: "flex", flexDirection: "column", gap: 24, paddingBottom: 40 }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
            <div style={{ width: 32, height: 32, border: "3px solid var(--border)", borderTopColor: "var(--saffron)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          <>
            <Section title="Out of Stock" items={outOfStock} color="var(--red)" emptyMsg="Nothing out of stock. Great!" />
            <Section title="Low Stock (5 or fewer)" items={lowStock} color="#d97706" emptyMsg="No items running low." />
            <Section title="In Stock" items={inStock} color="var(--green)" emptyMsg="No items in stock." />
          </>
        )}
      </main>
    </div>
  );
}

export default function AdminInventoryPage() {
  return <AdminGuard><InventoryContent /></AdminGuard>;
}