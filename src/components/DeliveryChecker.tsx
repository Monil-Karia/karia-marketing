"use client";

import { useState } from "react";
import { DeliveryCheckResult } from "@/types";
import config from "@/lib/config";

type Props = { onResult: (result: DeliveryCheckResult, address: string) => void };

export default function DeliveryChecker({ onResult }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DeliveryCheckResult | null>(null);
  const [address, setAddress] = useState("");
  const [gpsError, setGpsError] = useState("");

  async function useLocation() {
    if (!navigator.geolocation) { setGpsError("Location not supported on this device."); return; }
    setLoading(true); setGpsError("");
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const res = await fetch("/api/delivery-check", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lat: coords.latitude, lng: coords.longitude }) });
        const data: DeliveryCheckResult = await res.json();
        setResult(data); onResult(data, address); setLoading(false);
      },
      (err) => {
        setGpsError(err.code === 1 ? "Location permission denied. Please allow access or enter address manually." : "Could not get location. Please enter address manually.");
        setLoading(false);
      },
      { timeout: 10000 }
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* GPS button */}
      <button onClick={useLocation} disabled={loading}
        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: loading ? "#f7f3ee" : "var(--navy)", color: loading ? "var(--muted)" : "#fff", padding: "13px", borderRadius: 12, fontSize: 14, fontWeight: 600, transition: "all 0.15s", opacity: loading ? 0.7 : 1 }}>
        {loading ? (
          <span style={{ width: 16, height: 16, border: "2px solid #ccc", borderTopColor: "var(--navy)", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} />
        ) : (
          <svg width="16" height="16" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
          </svg>
        )}
        {loading ? "Getting your location…" : "Use my current location (GPS)"}
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        <span style={{ fontSize: 12, color: "var(--muted)" }}>or</span>
        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
      </div>

      {/* Address input */}
      <textarea
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder={`Your full address near ${config.shopAddress.split(",")[0]}`}
        rows={2}
        style={{ width: "100%", background: "#f7f3ee", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 14px", fontSize: 14, outline: "none", resize: "none", color: "var(--navy)" }}
      />
      <p style={{ fontSize: 11, color: "var(--muted)", marginTop: -6 }}>
        Delivery available within {config.deliveryRadiusKm} km of our shop. GPS is more accurate.
      </p>

      {gpsError && (
        <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#92400e" }}>{gpsError}</div>
      )}

      {result && (
        <div style={{ background: result.isEligible ? "#f0fdf4" : "#fef2f2", border: `1px solid ${result.isEligible ? "#bbf7d0" : "#fecaca"}`, borderRadius: 12, padding: "14px 16px" }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: result.isEligible ? "var(--green)" : "var(--red)", marginBottom: 4 }}>
            {result.isEligible ? "✓ Delivery available!" : "✗ Outside delivery area"}
          </p>
          <p style={{ fontSize: 13, color: "#4b5563" }}>{result.message}</p>
          {result.isEligible && (
            <p style={{ fontSize: 14, fontWeight: 700, color: "var(--navy)", marginTop: 6 }}>Delivery charge: ₹{result.deliveryCharge}</p>
          )}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}