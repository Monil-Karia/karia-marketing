"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { DeliveryCheckResult } from "@/types";
import config from "@/lib/config";

type Props = {
  onAddressChange: (val: string) => void;
  onResult: (result: DeliveryCheckResult) => void;
};

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    google: any;
    initGoogleMaps: () => void;
  }
}

export default function DeliveryChecker({ onAddressChange, onResult }: Props) {
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState<DeliveryCheckResult | null>(null);
  const [gpsError, setGpsError]   = useState("");
  const [mapsReady, setMapsReady] = useState(false);
  const containerRef              = useRef<HTMLDivElement>(null);
  const inputRef                  = useRef<HTMLInputElement>(null);

  // ── Load Google Maps script ───────────────────────────────────
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
    if (!key) return; // No key → use plain fallback input

    if (window.google?.maps?.places) { setMapsReady(true); return; }

    window.initGoogleMaps = () => setMapsReady(true);

    if (!document.querySelector("#gmaps-script")) {
      const s   = document.createElement("script");
      s.id      = "gmaps-script";
      s.src     = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&callback=initGoogleMaps&loading=async`;
      s.async   = true;
      s.defer   = true;
      document.head.appendChild(s);
    }
  }, []);

  // ── Check delivery eligibility by coords ─────────────────────
  const checkCoords = useCallback(async (lat: number, lng: number) => {
    setLoading(true);
    setGpsError("");
    try {
      const res  = await fetch("/api/delivery-check", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ lat, lng }),
      });
      const data: DeliveryCheckResult = await res.json();
      setResult(data);
      onResult(data);
    } catch {
      setGpsError("Could not check delivery distance. Please try again.");
    }
    setLoading(false);
  }, [onResult]);

  // ── Mount PlaceAutocompleteElement ────────────────────────────
  useEffect(() => {
    if (!mapsReady || !containerRef.current) return;
    containerRef.current.innerHTML = "";

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pac = new (window.google.maps.places as any).PlaceAutocompleteElement({
        componentRestrictions: { country: "in" },
        locationBias: {
          center: { lat: config.shopLat, lng: config.shopLng },
          radius: 25000,
        },
      });

      pac.style.width   = "100%";
      pac.style.display = "block";
      containerRef.current.appendChild(pac);

      // ── This fires when user taps a suggestion ────────────────
      pac.addEventListener("gmp-placeselect", async (e: Event) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const place = (e as any).place;

        // MUST await fetchFields before accessing location
        await place.fetchFields({
          fields: ["displayName", "formattedAddress", "location"],
        });

        const addr = place.formattedAddress || place.displayName || "";
        onAddressChange(addr);

        // Now get the actual lat/lng and check distance
        if (place.location) {
          const lat = place.location.lat();
          const lng = place.location.lng();
          await checkCoords(lat, lng); // ← triggers real-time distance check
        } else {
          setGpsError("Could not get coordinates for this address. Please use GPS or try a different address.");
        }
      });
    } catch (err) {
      console.warn("PlaceAutocompleteElement failed, using fallback input", err);
      setMapsReady(false);
    }
  }, [mapsReady, checkCoords, onAddressChange]);

  // ── GPS: use device location ──────────────────────────────────
  async function useGPS() {
    if (!navigator.geolocation) {
      setGpsError("Your browser does not support location. Please type your address.");
      return;
    }

    // Check if we're on HTTP (GPS requires HTTPS or localhost)
    if (window.location.protocol !== "https:" && window.location.hostname !== "localhost") {
      setGpsError("GPS requires HTTPS. Please use the live site or type your address.");
      return;
    }

    setLoading(true);
    setGpsError("");
    setResult(null);

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const { latitude: lat, longitude: lng } = coords;

        // Reverse geocode to show address text
        if (window.google?.maps?.Geocoder) {
          try {
            const gc = new window.google.maps.Geocoder();
            gc.geocode(
              { location: { lat, lng } },
              (results: { formatted_address: string }[], status: string) => {
                if (status === "OK" && results[0]) {
                  const addr = results[0].formatted_address;
                  onAddressChange(addr);
                  if (inputRef.current) inputRef.current.value = addr;
                }
              }
            );
          } catch {
            // Geocoding failed silently — we still have coords for distance check
          }
        }

        await checkCoords(lat, lng);
        setLoading(false);
      },
      (err) => {
        setLoading(false);
        if (err.code === 1) {
          setGpsError(
            "Location access was denied. On iPhone: go to Settings → Safari → Location → Allow. Then reload this page."
          );
        } else if (err.code === 2) {
          setGpsError("Location unavailable. Please type your address instead.");
        } else {
          setGpsError("Location request timed out. Please type your address instead.");
        }
      },
      { timeout: 12000, maximumAge: 60000, enableHighAccuracy: false }
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* GPS Button */}
      <button type="button" onClick={useGPS} disabled={loading}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          width: "100%",
          background: loading ? "#f7f3ee" : "var(--navy)",
          color: loading ? "var(--muted)" : "#fff",
          padding: "13px", borderRadius: 12, fontSize: 14, fontWeight: 600,
          border: "none", cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.8 : 1, transition: "all 0.15s",
        }}
      >
        {loading ? (
          <>
            <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: loading ? "var(--navy)" : "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} />
            Checking your location…
          </>
        ) : (
          <>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
            </svg>
            Use my current location (GPS)
          </>
        )}
      </button>

      {/* Divider */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        <span style={{ fontSize: 12, color: "var(--muted)" }}>or type your address</span>
        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
      </div>

      {/* Google PlaceAutocompleteElement renders here */}
      {mapsReady && <div ref={containerRef} style={{ width: "100%" }} />}

      {/* Fallback plain input when Maps key not set */}
      {!mapsReady && (
        <input
          ref={inputRef}
          type="text"
          onChange={(e) => onAddressChange(e.target.value)}
          placeholder="e.g. Near Alibag Beach, Alibag, Maharashtra"
          autoComplete="street-address"
          style={{
            width: "100%", background: "#f7f3ee",
            border: "1px solid var(--border)", borderRadius: 12,
            padding: "12px 14px", fontSize: 14, outline: "none",
            color: "var(--navy)", fontFamily: "inherit", boxSizing: "border-box",
          }}
        />
      )}

      <p style={{ fontSize: 11, color: "var(--muted)", marginTop: -4 }}>
        {mapsReady
          ? "Pick from suggestions — distance checks automatically"
          : `Delivery within ${config.deliveryRadiusKm} km of our Alibag shop`}
      </p>

      {/* Loading indicator */}
      {loading && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f7f3ee", borderRadius: 10, padding: "10px 14px" }}>
          <span style={{ width: 14, height: 14, border: "2px solid var(--border)", borderTopColor: "var(--saffron)", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: "var(--muted)" }}>Checking if delivery is available to your location…</span>
        </div>
      )}

      {/* Error */}
      {gpsError && (
        <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#92400e", lineHeight: 1.5 }}>
          {gpsError}
        </div>
      )}

      {/* Result */}
      {result && !loading && (
        <div style={{ background: result.isEligible ? "#f0fdf4" : "#fef2f2", border: `1px solid ${result.isEligible ? "#bbf7d0" : "#fecaca"}`, borderRadius: 12, padding: "14px 16px" }}>
          <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, color: result.isEligible ? "var(--green)" : "var(--red)" }}>
            {result.isEligible ? "✓ Delivery available!" : "✗ Outside delivery area"}
          </p>
          <p style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.5 }}>{result.message}</p>
          {result.isEligible && (
            <div style={{ marginTop: 10, background: "rgba(22,163,74,0.08)", borderRadius: 8, padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "var(--green)" }}>{result.distanceKm} km away</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--navy)" }}>Delivery: ₹{result.deliveryCharge}</span>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .pac-container { border-radius: 12px !important; border: 1px solid #e5e7eb !important; box-shadow: 0 4px 20px rgba(15,31,61,0.1) !important; font-family: 'Noto Sans', sans-serif !important; z-index: 9999 !important; margin-top: 4px !important; }
        .pac-item { padding: 10px 14px !important; font-size: 13px !important; cursor: pointer !important; }
        .pac-item:hover { background: #f7f3ee !important; }
      `}</style>
    </div>
  );
}