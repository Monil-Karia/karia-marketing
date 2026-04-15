"use client";

import { useState } from "react";

type Props = {
  orderId:      string;
  amount:       number;
  customerName: string;
  customerPhone:string;
  onSuccess:    () => void;
  onFailure:    (reason: string) => void;
};

// Tell TypeScript that window.Razorpay exists (loaded from their CDN)
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

// Load Razorpay script from their CDN
function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) { resolve(); return; }
    const script    = document.createElement("script");
    script.src      = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload   = () => resolve();
    script.onerror  = () => reject(new Error("Failed to load Razorpay"));
    document.body.appendChild(script);
  });
}

export default function RazorpayButton({
  orderId, amount, customerName, customerPhone, onSuccess, onFailure,
}: Props) {
  const [loading, setLoading] = useState(false);

  async function startPayment() {
    setLoading(true);

    try {
      // Step 1: Load Razorpay SDK
      await loadRazorpayScript();

      // Step 2: Create Razorpay order on our server
      const orderRes = await fetch("/api/create-payment-order", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ amount, orderId }),
      });

      if (!orderRes.ok) {
        const err = await orderRes.json();
        onFailure(err.error || "Could not start payment. Please try Cash.");
        setLoading(false);
        return;
      }

      const { razorpayOrderId, amount: rzpAmount, currency } = await orderRes.json();

      // Step 3: Open Razorpay payment sheet
      const rzp = new window.Razorpay({
        key:         process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount:      rzpAmount,
        currency,
        name:        "Karia Marketing",
        description: "Wholesale Order Payment",
        order_id:    razorpayOrderId,
        prefill: {
          name:    customerName,
          contact: `+91${customerPhone}`,
        },
        theme: { color: "#e8861a" }, // Our saffron brand colour
        handler: async (response: {
          razorpay_order_id:   string;
          razorpay_payment_id: string;
          razorpay_signature:  string;
        }) => {
          // Step 4: Verify payment on our server
          const verifyRes = await fetch("/api/verify-payment", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpayOrderId:   response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              orderId,
            }),
          });

          if (verifyRes.ok) {
            onSuccess();
          } else {
            const err = await verifyRes.json();
            onFailure(err.error || "Payment verification failed. Please contact us.");
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            onFailure("Payment was cancelled.");
          },
        },
      });

      rzp.open();
    } catch (err) {
      console.error("Razorpay error:", err);
      onFailure("Something went wrong. Please try Cash instead.");
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={startPayment}
      disabled={loading}
      style={{
        width: "100%",
        background: loading ? "#f7f3ee" : "var(--saffron)",
        color:      loading ? "var(--muted)" : "#fff",
        fontWeight: 700,
        fontSize:   15,
        padding:    "16px",
        borderRadius: 14,
        border:     "none",
        cursor:     loading ? "not-allowed" : "pointer",
        display:    "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        opacity:    loading ? 0.7 : 1,
        transition: "all 0.15s",
      }}
    >
      {loading ? (
        <>
          <span style={{
            width: 18, height: 18,
            border: "2px solid #ccc",
            borderTopColor: "var(--navy)",
            borderRadius: "50%",
            display: "inline-block",
            animation: "spin 0.8s linear infinite",
          }} />
          Opening payment…
        </>
      ) : (
        <>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
            <rect x="1" y="4" width="22" height="16" rx="2"/>
            <line x1="1" y1="10" x2="23" y2="10"/>
          </svg>
          Pay ₹{amount.toLocaleString("en-IN")} Online
        </>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </button>
  );
}