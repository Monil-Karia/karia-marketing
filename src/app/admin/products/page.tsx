"use client";

// ============================================================
//  ADMIN: PRODUCTS PAGE — /admin/products
//  Shows all products. Admin can edit:
//    - Name, Price, Category
//    - Is Returnable (Yes/No toggle)
//    - Quantity (restock)
//    - Hide/Show product on site
//  Designed to be simple — no tech knowledge needed.
// ============================================================
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Product } from "@/types";
import config from "@/lib/config";
import AdminGuard from "@/components/AdminGuard";

function AdminProductsContent() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Product>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => { loadProducts(); }, []);

  async function loadProducts() {
    const res = await fetch("/api/products");
    const data = await res.json();
    setProducts(Array.isArray(data) ? data : []);
    setIsLoading(false);
  }

  function startEdit(product: Product) {
    setEditingId(product.id);
    setEditData({
      name: product.name,
      price: product.price,
      quantity: product.quantity,
      category: product.category,
      is_returnable: product.is_returnable,
      is_active: product.is_active,
    });
  }

  async function saveEdit(productId: string) {
    setSavingId(productId);
    const res = await fetch(`/api/products/${productId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editData),
    });
    if (res.ok) {
      const updated = await res.json();
      setProducts((prev) => prev.map((p) => (p.id === productId ? updated : p)));
      setEditingId(null);
    }
    setSavingId(null);
  }

  async function toggleActive(product: Product) {
    const res = await fetch(`/api/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !product.is_active }),
    });
    if (res.ok) {
      const updated = await res.json();
      setProducts((prev) => prev.map((p) => (p.id === product.id ? updated : p)));
    }
  }

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/admin")} className="text-gray-500 text-xl">←</button>
            <h1 className="text-base font-semibold text-gray-800">Products</h1>
          </div>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
            {products.length} total
          </span>
        </div>
        <div className="max-w-2xl mx-auto px-4 pb-3">
          <input
            type="text"
            placeholder="Search products…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-100 rounded-xl px-4 py-2 text-sm outline-none"
          />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4 space-y-3 pb-10">
        {isLoading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-20 animate-pulse" />
          ))
        ) : (
          filtered.map((product) => {
            const isEditing = editingId === product.id;
            const isSaving = savingId === product.id;

            return (
              <div key={product.id} className={`bg-white rounded-2xl shadow-sm overflow-hidden ${!product.is_active ? "opacity-60" : ""}`}>
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex-shrink-0 overflow-hidden">
                    {product.image_url ? (
                      <Image src={product.image_url} alt={product.name} width={48} height={48} className="object-cover w-full h-full" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">No img</div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{product.name}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-gray-500">₹{product.price?.toLocaleString("en-IN") ?? "0"}</span>
                      <span className="text-gray-300">·</span>
                      <span className={`text-xs ${product.quantity === 0 ? "text-red-500" : "text-gray-500"}`}>
                        {product.quantity === 0 ? "Out of stock" : `${product.quantity} in stock`}
                      </span>
                      {product.is_returnable && (
                        <span className="text-xs text-green-600">· Returnable</span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => toggleActive(product)} title={product.is_active ? "Hide" : "Show"} className="text-lg">
                      {product.is_active ? "👁" : "🚫"}
                    </button>
                    <button
                      onClick={() => isEditing ? setEditingId(null) : startEdit(product)}
                      className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg"
                    >
                      {isEditing ? "Cancel" : "Edit"}
                    </button>
                  </div>
                </div>

                {isEditing && (
                  <div className="border-t border-gray-100 px-4 py-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Name</label>
                        <input
                          type="text"
                          value={editData.name ?? ""}
                          onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Price (₹)</label>
                        <input
                          type="number"
                          value={editData.price ?? ""}
                          onChange={(e) => setEditData({ ...editData, price: parseInt(e.target.value) || 0 })}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Stock Qty</label>
                        <input
                          type="number"
                          value={editData.quantity ?? ""}
                          onChange={(e) => setEditData({ ...editData, quantity: parseInt(e.target.value) || 0 })}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Category</label>
                        <select
                          value={editData.category ?? "Other"}
                          onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none"
                        >
                          {config.categories.filter((c) => c !== "All").map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Returnable</p>
                        <p className="text-xs text-gray-400">Can customer return this?</p>
                      </div>
                      <button
                        onClick={() => setEditData({ ...editData, is_returnable: !editData.is_returnable })}
                        className={`relative w-12 h-6 rounded-full transition-colors ${editData.is_returnable ? "bg-green-500" : "bg-gray-300"}`}
                      >
                        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${editData.is_returnable ? "translate-x-6" : "translate-x-0.5"}`} />
                      </button>
                    </div>

                    <button
                      onClick={() => saveEdit(product.id)}
                      disabled={isSaving}
                      className="w-full bg-blue-600 text-white py-3 rounded-xl text-sm font-semibold disabled:opacity-60"
                    >
                      {isSaving ? "Saving…" : "Save Changes"}
                    </button>
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

export default function AdminProductsPage() {
  return <AdminGuard><AdminProductsContent /></AdminGuard>;
}