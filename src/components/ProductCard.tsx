"use client";

// ============================================================
//  PRODUCT CARD — Updated
//  Tapping the card image/name opens the product detail page.
//  "Add" button still works directly from the card.
// ============================================================
"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Product } from "@/types";
import config from "@/lib/config";

type Props = { product: Product; onAddToCart: (p: Product) => void };

export default function ProductCard({ product, onAddToCart }: Props) {
  const router = useRouter();
  const oos = product.quantity === 0;

  return (
    <div
      className="card fade-up"
      style={{ display: "flex", flexDirection: "column", overflow: "hidden", cursor: "pointer", transition: "transform 0.15s, box-shadow 0.15s" }}
      onClick={() => router.push(`/products/${product.id}`)}
    >
      {/* Image area */}
      <div style={{ background: "#f7f3ee", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, minHeight: 110 }}>
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            width={config.imageWidth}
            height={config.imageHeight}
            style={{ objectFit: "contain" }}
          />
        ) : (
          <div style={{ width: 72, height: 72, background: "#ede8e0", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="28" height="28" fill="none" stroke="#b0a898" strokeWidth="1.5" viewBox="0 0 24 24">
              <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
            </svg>
          </div>
        )}

        {/* Tags */}
        {oos && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.75)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ background: "#fee2e2", color: "var(--red)", fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20 }}>
              Out of Stock
            </span>
          </div>
        )}
        {product.is_returnable && !oos && (
          <span style={{ position: "absolute", top: 8, right: 8, background: "#dcfce7", color: "var(--green)", fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 20 }}>
            ✓ Return
          </span>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: "10px 12px 12px", display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
        <span style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>
          {product.category}
        </span>
        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--navy)", lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {product.name}
        </p>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto", paddingTop: 6 }}>
          <div>
            <p style={{ fontSize: 16, fontWeight: 700, color: "var(--navy)" }}>
              ₹{product.price?.toLocaleString("en-IN") ?? "0"}
            </p>
            <p style={{ fontSize: 10, color: "var(--muted)", marginTop: 1 }}>
              {oos ? "—" : `${product.quantity} left`}
            </p>
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); if (!oos) onAddToCart(product); }}
            disabled={oos}
            style={{
              background: oos ? "#f3f4f6" : "var(--saffron)",
              color: oos ? "#9ca3af" : "#fff",
              fontSize: 12, fontWeight: 600,
              padding: "7px 14px", borderRadius: 10,
              transition: "transform 0.1s",
              cursor: oos ? "not-allowed" : "pointer",
            }}
          >
            {oos ? "Sold out" : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}