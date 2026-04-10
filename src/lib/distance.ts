// ============================================================
//  DISTANCE CALCULATOR
//  Calculates real-world km between two GPS coordinates.
//  Uses the Haversine formula — no API key needed.
// ============================================================

import config from "./config";

/**
 * Calculate distance in km between two lat/lng points.
 */
export function calculateDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // Round to 1 decimal
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Check if a customer location is within delivery range.
 * Returns distance and delivery charge.
 */
export function checkDeliveryEligibility(customerLat: number, customerLng: number): {
  isEligible: boolean;
  distanceKm: number;
  deliveryCharge: number;
  message: string;
} {
  const distanceKm = calculateDistanceKm(
    config.shopLat,
    config.shopLng,
    customerLat,
    customerLng
  );

  if (distanceKm > config.deliveryRadiusKm) {
    return {
      isEligible: false,
      distanceKm,
      deliveryCharge: 0,
      message: `You are ${distanceKm} km away. Delivery is only available within ${config.deliveryRadiusKm} km of our shop. Please visit us at ${config.shopAddress}.`,
    };
  }

  let deliveryCharge = Math.ceil(distanceKm) * config.chargePerKm;

  // Apply minimum charge
  if (deliveryCharge < config.minDeliveryCharge) {
    deliveryCharge = config.minDeliveryCharge;
  }

  // Apply free delivery threshold if configured
  if (config.freeDeliveryAbove > 0) {
    deliveryCharge = 0; // This will be rechecked against order total in order page
  }

  return {
    isEligible: true,
    distanceKm,
    deliveryCharge,
    message: `Delivery available! Distance: ${distanceKm} km. Delivery charge: ₹${deliveryCharge}`,
  };
}
