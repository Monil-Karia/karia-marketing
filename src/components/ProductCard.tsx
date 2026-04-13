"use client";
// ============================================================
//  PRODUCT CARD — Updated
//  Tapping the card image/name opens the product detail page.
//  "Add" button still works directly from the card.
// ============================================================
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Product } from "@/types";
import config from "@/lib/config";

type Props = { product: Product; onAddToCart: (p: Product) => void };

export default function ProductCard({ product, onAddToCart }: Props) {
  const router = useRouter();
  const oos = product.quantity === 0;

  return (
    <div className="card fade-up"
      style={{ display: "flex", flexDirection: "column", overflow: "hidden", cursor: "pointer", transition: "transform 0.15s" }}
      onClick={() => router.push(`/products/${product.id}`)}>

      {/* Image */}
      <div style={{ background: "#f7f3ee", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, minHeight: 110 }}>
        {product.image_url ? (
          <Image src={product.image_url} alt={product.name} width={config.imageWidth} height={config.imageHeight} style={{ objectFit: "contain", opacity: oos ? 0.5 : 1 }} />
        ) : (
          <div style={{ width: 72, height: 72, background: "#ede8e0", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", opacity: oos ? 0.5 : 1 }}>
            <svg width="28" height="28" fill="none" stroke="#b0a898" strokeWidth="1.5" viewBox="0 0 24 24">
              <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
            </svg>
          </div>
        )}

        {/* Out of stock overlay */}
        {oos && (
          <div style={{ position: "absolute", top: 8, left: 8 }}>
            <span style={{ background: "#fee2e2", color: "var(--red)", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 20 }}>
              Out of Stock
            </span>
          </div>
        )}

        {/* Returnable badge */}
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
        <p style={{ fontSize: 13, fontWeight: 600, color: oos ? "var(--muted)" : "var(--navy)", lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {product.name}
        </p>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto", paddingTop: 6 }}>
          <div>
            <p style={{ fontSize: 16, fontWeight: 700, color: oos ? "var(--muted)" : "var(--navy)" }}>
              ₹{(product.price ?? 0).toLocaleString("en-IN")}
            </p>
            <p style={{ fontSize: 10, color: "var(--muted)", marginTop: 1 }}>
              {oos ? "Currently unavailable" : `${product.quantity} left`}
            </p>
          </div>

          {/* Show Call button for out-of-stock, Add button otherwise */}
          {oos ? (
            <a
              href={`tel:${config.shopPhone}`}
              onClick={(e) => e.stopPropagation()}
              style={{ background: "#f7f3ee", color: "var(--navy)", fontSize: 11, fontWeight: 700, padding: "7px 10px", borderRadius: 10, textDecoration: "none", display: "flex", alignItems: "center", gap: 4, border: "1px solid var(--border)" }}
            >
              📞 Call
            </a>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}
              style={{ background: "var(--saffron)", color: "#fff", fontSize: 12, fontWeight: 600, padding: "7px 14px", borderRadius: 10, border: "none", cursor: "pointer", transition: "transform 0.1s" }}
            >
              Add
            </button>
          )}
        </div>

        {/* Out of stock call CTA */}
        {oos && (
          <div style={{ marginTop: 6, background: "#fff8ee", border: "1px solid #fde68a", borderRadius: 8, padding: "6px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ fontSize: 10, color: "#92400e" }}>Need it urgently?</p>
            <a href={`tel:${config.shopPhone}`} onClick={(e) => e.stopPropagation()}
              style={{ fontSize: 10, fontWeight: 700, color: "var(--saffron)", textDecoration: "none" }}>
              Call owner →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}