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
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Order, OrderStatus } from "@/types";
import config from "@/lib/config";
import AdminGuard from "@/components/AdminGuard";

const STATUS_COLORS: Record<OrderStatus, string> = {
  Placed: "bg-amber-100 text-amber-800",
  Accepted: "bg-blue-100 text-blue-800",
  "Out for Delivery": "bg-purple-100 text-purple-800",
  Delivered: "bg-green-100 text-green-800",
  Cancelled: "bg-red-100 text-red-800",
};

function AdminOrdersContent() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("All");

  useEffect(() => { loadOrders(); }, []);

  async function loadOrders() {
    const res = await fetch("/api/orders");
    const data = await res.json();
    setOrders(Array.isArray(data) ? data : []);
    setIsLoading(false);
  }

  async function updateOrder(orderId: string, payload: Partial<Order>) {
    setUpdatingId(orderId);
    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const updated = await res.json();
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
    }
    setUpdatingId(null);
  }

  const filtered = filterStatus === "All"
    ? orders
    : orders.filter((o) => o.status === filterStatus);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/admin")} className="text-gray-500 text-xl">←</button>
            <h1 className="text-base font-semibold text-gray-800">Orders</h1>
          </div>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
            {orders.length} total
          </span>
        </div>
        <div className="max-w-2xl mx-auto px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-none">
          {["All", ...config.orderStatuses].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                filterStatus === s ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-600"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4 space-y-3 pb-10">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-24 animate-pulse" />
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-sm">No orders yet</p>
          </div>
        ) : (
          filtered.map((order) => {
            const isExpanded = expandedId === order.id;
            const isUpdating = updatingId === order.id;

            return (
              <div key={order.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                  className="w-full text-left px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-800">{order.customer_name}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[order.status]}`}>
                          {order.status}
                        </span>
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                          {order.order_type === "delivery" ? "🏠 Delivery" : "🏪 Pickup"}
                        </span>
                        {order.return_requested && (
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                            ↩ Return
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {order.customer_phone} ·{" "}
                        {new Date(order.created_at).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-gray-800">
                        ₹{order.total_amount?.toLocaleString("en-IN") ?? "0"}
                      </p>
                      <p className="text-xs text-gray-400">{isExpanded ? "▲" : "▼"}</p>
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-100 px-4 py-4 space-y-4">
                    {/* Items */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Items</p>
                      <div className="space-y-1">
                        {order.items.map((item, i) => (
                          <div key={i} className="flex justify-between text-sm text-gray-700">
                            <span>{item.product.name} × {item.quantity}</span>
                            <span>₹{(item.product.price * item.quantity)?.toLocaleString("en-IN") ?? "0"}</span>
                          </div>
                        ))}
                        {order.delivery_charge > 0 && (
                          <div className="flex justify-between text-sm text-gray-500">
                            <span>Delivery</span>
                            <span>₹{order.delivery_charge}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Address */}
                    {order.customer_address && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Address</p>
                        <p className="text-sm text-gray-700">{order.customer_address}</p>
                      </div>
                    )}

                    {/* Return request */}
                    {order.return_requested && (
                      <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
                        <p className="text-xs font-semibold text-orange-800 mb-1">Return / Replacement Request</p>
                        <p className="text-sm text-orange-700">{order.return_reason || "No reason given"}</p>
                      </div>
                    )}

                    {/* Admin actions */}
                    <div className="space-y-3 pt-2 border-t border-gray-100">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Update Order</p>

                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Status</label>
                        <select
                          value={order.status}
                          onChange={(e) => updateOrder(order.id, { status: e.target.value as OrderStatus })}
                          disabled={isUpdating}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none"
                        >
                          {config.orderStatuses.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>

                      {order.order_type === "delivery" && (
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Delivery Date</label>
                          <input
                            type="date"
                            defaultValue={order.delivery_date ?? ""}
                            min={new Date().toISOString().split("T")[0]}
                            onChange={(e) => updateOrder(order.id, { delivery_date: e.target.value })}
                            disabled={isUpdating}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none"
                          />
                        </div>
                      )}

                      {/* Quick call button */}
                      <a
                        href={`tel:+91${order.customer_phone}`}
                        className="flex items-center justify-center gap-2 w-full bg-green-50 border border-green-200 text-green-700 py-2.5 rounded-xl text-sm font-medium"
                      >
                        📞 Call {order.customer_name}
                      </a>

                      {isUpdating && (
                        <p className="text-xs text-blue-600 text-center animate-pulse">Saving…</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </main>
    </div>
  );
}

export default function AdminOrdersPage() {
  return <AdminGuard><AdminOrdersContent /></AdminGuard>;
}