// ============================================================
//  KARIA MARKETING — SHOP CONFIGURATION
//  Edit this file to change shop settings.
//  No coding needed — just update the values below.
// ============================================================

const config = {
  // ── Shop Details ──────────────────────────────────────────
  shopName: "Karia Marketing",
  shopAddress: "Alibag, Raigad, Maharashtra 402201",
  shopPhone: "+91 98765 43210", // Update with real number

  // ── Shop Location (Lat/Lng of your shop) ──────────────────
  // To find your coordinates: open Google Maps, right-click your
  // shop location, and copy the numbers shown.
  shopLat: 18.6414,
  shopLng: 72.8722,

  // ── Delivery Settings ─────────────────────────────────────
  deliveryRadiusKm: 5,       // Max km for home delivery
  chargePerKm: 10,           // ₹ per km charged to customer
  minDeliveryCharge: 20,     // Minimum delivery charge in ₹
  freeDeliveryAbove: 0,      // Set to e.g. 500 for free delivery on orders above ₹500 (0 = disabled)

  // ── Image Settings ────────────────────────────────────────
  imageWidth: 80,            // Product image width in px
  imageHeight: 80,           // Product image height in px

  // ── Order Settings ────────────────────────────────────────
  maxOrderQuantity: 50,      // Max units per product per order
  orderStatuses: [
    "Placed",
    "Accepted",
    "Out for Delivery",
    "Delivered",
    "Cancelled",
  ],

  // ── Product Categories ────────────────────────────────────
  categories: [
    "All",
    "Electronics",
    "Massagers",
    "Accessories",
    "Other",
  ],
};

export default config;
