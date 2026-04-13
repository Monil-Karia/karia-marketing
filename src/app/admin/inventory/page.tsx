"use client";

// ============================================================
//  ADMIN: INVENTORY PAGE — /admin/inventory
//  At-a-glance stock view.
//  Shows low stock warnings and out-of-stock items.
// ============================================================
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Product } from "@/types";
import AdminGuard from "@/components/AdminGuard";

function AdminInventoryContent() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => {
        setProducts(Array.isArray(data) ? data : []);
        setIsLoading(false);
      });
  }, []);

  const outOfStock = products.filter((p) => p.quantity === 0);
  const lowStock = products.filter((p) => p.quantity > 0 && p.quantity <= 5);
  const inStock = products.filter((p) => p.quantity > 5);

  function Section({
    title, items, color, emptyMsg,
  }: {
    title: string; items: Product[]; color: string; emptyMsg: string;
  }) {
    return (
      <div>
        <h2 className={`text-xs font-semibold uppercase tracking-wide mb-2 ${color}`}>
          {title} ({items.length})
        </h2>
        {items.length === 0 ? (
          <p className="text-xs text-gray-400 py-2">{emptyMsg}</p>
        ) : (
          <div className="space-y-2">
            {items.map((p) => (
              <div key={p.id} className="bg-white rounded-xl px-4 py-3 flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-sm font-medium text-gray-800">{p.name}</p>
                  <p className="text-xs text-gray-400">{p.category} · ₹{p.price?.toLocaleString("en-IN") ?? "0"}</p>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${
                    p.quantity === 0 ? "text-red-500" : p.quantity <= 5 ? "text-amber-500" : "text-green-600"
                  }`}>
                    {p.quantity}
                  </p>
                  <p className="text-xs text-gray-400">units</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.push("/admin")} className="text-gray-500 text-xl">←</button>
          <h1 className="text-base font-semibold text-gray-800">Inventory</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4 space-y-6 pb-10">
        {isLoading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-16 animate-pulse" />
          ))
        ) : (
          <>
            <Section title="Out of Stock" items={outOfStock} color="text-red-600" emptyMsg="Nothing out of stock." />
            <Section title="Low Stock (5 or fewer)" items={lowStock} color="text-amber-600" emptyMsg="No items running low." />
            <Section title="In Stock" items={inStock} color="text-green-600" emptyMsg="No items in stock." />
          </>
        )}
      </main>
    </div>
  );
}

export default function AdminInventoryPage() {
  return <AdminGuard><AdminInventoryContent /></AdminGuard>;
}