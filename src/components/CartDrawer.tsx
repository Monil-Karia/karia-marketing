"use client";

// ============================================================
//  CART DRAWER
//  Slides up from the bottom of the screen on mobile.
//  Shows all items, quantities, and total.
// ============================================================
"use client";

import { CartItem } from "@/types";
import { useRouter } from "next/navigation";

type Props = {
  items: CartItem[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateQty: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
};

export default function CartDrawer({ items, isOpen, onClose, onUpdateQty, onRemove }: Props) {
  const router = useRouter();
  const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const totalItems = items.reduce((s, i) => s + i.quantity, 0);

  function checkout() {
    sessionStorage.setItem("cart", JSON.stringify(items));
    onClose();
    router.push("/order");
  }

  if (!isOpen) return null;

  return (
    <>
      <div style={{ position: "fixed", inset: 0, background: "rgba(15,31,61,0.5)", zIndex: 40, backdropFilter: "blur(2px)" }} onClick={onClose} />
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50, background: "#fff", borderRadius: "24px 24px 0 0", maxHeight: "88vh", display: "flex", flexDirection: "column", boxShadow: "0 -8px 40px rgba(15,31,61,0.18)" }}>

        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 12, paddingBottom: 4 }}>
          <div style={{ width: 40, height: 4, background: "#e5e7eb", borderRadius: 2 }} />
        </div>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 20px 12px", borderBottom: "1px solid #f3f4f6" }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--navy)" }}>Your Cart</h2>
            <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 1 }}>{totalItems} item{totalItems !== 1 ? "s" : ""}</p>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, background: "#f3f4f6", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: "var(--muted)" }}>×</button>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
          {items.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--muted)" }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🛒</div>
              <p style={{ fontSize: 14 }}>Your cart is empty</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.product.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "var(--navy)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.product.name}</p>
                  <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>₹{item.product.price?.toLocaleString("en-IN") ?? "0"} each</p>
                </div>

                {/* Qty controls */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#f7f3ee", borderRadius: 10, padding: "4px 8px" }}>
                  <button
                    onClick={() => item.quantity === 1 ? onRemove(item.product.id) : onUpdateQty(item.product.id, item.quantity - 1)}
                    style={{ width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16, color: "var(--navy)" }}
                  >−</button>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--navy)", minWidth: 18, textAlign: "center" }}>{item.quantity}</span>
                  <button
                    onClick={() => item.quantity < item.product.quantity && onUpdateQty(item.product.id, item.quantity + 1)}
                    style={{ width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16, color: "var(--navy)" }}
                  >+</button>
                </div>

                <p style={{ fontSize: 14, fontWeight: 700, color: "var(--navy)", minWidth: 64, textAlign: "right" }}>
                  ₹{(item.product.price * item.quantity)?.toLocaleString("en-IN") ?? "0"}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div style={{ padding: "12px 20px 24px", borderTop: "1px solid #f3f4f6" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 13, color: "var(--muted)" }}>Subtotal</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: "var(--navy)" }}>₹{subtotal?.toLocaleString("en-IN") ?? "0"}</span>
            </div>
            <p style={{ fontSize: 11, color: "var(--muted)", marginBottom: 14 }}>Delivery charges calculated at checkout</p>
            <button onClick={checkout} className="btn-navy" style={{ width: "100%", padding: "16px", fontSize: 15 }}>
              Proceed to Order →
            </button>
          </div>
        )}
      </div>
    </>
  );
}