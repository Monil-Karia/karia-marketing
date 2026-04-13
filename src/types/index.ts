// ============================================================
//  TYPES — Data shapes used across the whole app
//  Think of these as the "blueprint" for your data.
// ============================================================

export type Product = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  is_returnable: boolean;
  category: string;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
};

export type CartItem = {
  product: Product;
  quantity: number;
};

export type OrderType = "delivery" | "pickup";

export type OrderStatus =
  | "Placed"
  | "Accepted"
  | "Out for Delivery"
  | "Delivered"
  | "Cancelled";

export type Order = {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  customer_lat: number | null;
  customer_lng: number | null;
  items: CartItem[];
  subtotal: number;
  delivery_charge: number;
  total_amount: number;
  order_type: OrderType;
  status: OrderStatus;
  delivery_date: string | null;
  return_requested: boolean;
  return_reason: string | null;
  created_at: string;
};

export type DeliveryCheckResult = {
  isEligible: boolean;
  distanceKm: number;
  deliveryCharge: number;
  message: string;
};
