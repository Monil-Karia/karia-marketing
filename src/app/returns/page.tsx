"use client";

// ============================================================
//  RETURNS PAGE — /returns
//  Customer submits a return or replacement request.
//  Only shown for products that are_returnable = true.
//  Admin sees the request in the orders panel.
// ============================================================

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ReturnsForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") ?? "";
  const productName = searchParams.get("product") ?? "your product";

  const [requestType, setRequestType] = useState<"return" | "replacement">("replacement");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState("");

  async function submitRequest() {
    setError("");
    if (!reason.trim()) {
      setError("Please describe the issue before submitting.");
      return;
    }
    if (!orderId) {
      setError("Order ID missing. Please go back and try again.");
      return;
    }

    setIsSubmitting(true);

    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        return_requested: true,
        return_reason: `[${requestType.toUpperCase()}] ${reason.trim()}`,
      }),
    });

    if (res.ok) {
      setIsDone(true);
    } else {
      const data = await res.json();
      setError(data.error || "Something went wrong. Please try again.");
    }

    setIsSubmitting(false);
  }

  if (isDone) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="text-6xl">📬</div>
          <h1 className="text-xl font-bold text-gray-800">Request Submitted!</h1>
          <p className="text-gray-500 text-sm">
            We&apos;ve received your {requestType} request for{" "}
            <span className="font-medium">{productName}</span>. Our team will
            contact you shortly.
          </p>
          <button
            onClick={() => router.push("/")}
            className="w-full bg-blue-600 text-white py-3.5 rounded-2xl font-semibold text-sm"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-500 text-xl">←</button>
          <h1 className="text-base font-semibold text-gray-800">Return / Replacement</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Product name */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-gray-400 mb-1">Product</p>
          <p className="text-sm font-semibold text-gray-800">{productName}</p>
          {orderId && (
            <p className="text-xs text-gray-400 mt-1">
              Order #{orderId.slice(0, 8).toUpperCase()}
            </p>
          )}
        </div>

        {/* Request type toggle */}
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
          <p className="text-sm font-semibold text-gray-700">What do you need?</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setRequestType("replacement")}
              className={`py-3 rounded-xl text-sm font-medium border transition-all ${
                requestType === "replacement"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-gray-50 text-gray-600 border-gray-200"
              }`}
            >
              🔄 Replacement
            </button>
            <button
              onClick={() => setRequestType("return")}
              className={`py-3 rounded-xl text-sm font-medium border transition-all ${
                requestType === "return"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-gray-50 text-gray-600 border-gray-200"
              }`}
            >
              ↩️ Return
            </button>
          </div>
          <p className="text-xs text-gray-400">
            {requestType === "replacement"
              ? "We will replace the product with a new one."
              : "We will pick up the product and process a refund."}
          </p>
        </div>

        {/* Reason textarea */}
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-2">
          <label className="text-sm font-semibold text-gray-700">
            Describe the issue
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={
              requestType === "replacement"
                ? "e.g. Product stopped working after 2 days, screen is cracked..."
                : "e.g. Wrong product delivered, changed my mind..."
            }
            rows={4}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200 resize-none placeholder:text-gray-400"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Info note */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
          Our team will review your request and contact you on your registered
          phone number within 1–2 business days.
        </div>

        {/* Submit */}
        <button
          onClick={submitRequest}
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-4 rounded-2xl font-semibold text-base disabled:opacity-60 active:scale-[0.98] transition-transform"
        >
          {isSubmitting ? "Submitting…" : `Submit ${requestType === "replacement" ? "Replacement" : "Return"} Request`}
        </button>
      </main>
    </div>
  );
}

export default function ReturnsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <ReturnsForm />
    </Suspense>
  );
}
