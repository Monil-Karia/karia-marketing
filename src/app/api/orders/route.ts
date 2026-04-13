// ============================================================
//  API: /api/orders  (FINAL VERSION)
//  POST → place order → reduce stock → WhatsApp admin
//                     → check low stock → sync Excel
//  GET  → list all orders (admin)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { CartItem } from "@/types";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customer_name,
      customer_phone,
      customer_address,
      customer_lat,
      customer_lng,
      items,
      subtotal,
      delivery_charge,
      total_amount,
      order_type,
    } = body;

    if (!customer_name || !customer_phone || !items?.length) {
      return NextResponse.json(
        { error: "Name, phone and items are required" },
        { status: 400 }
      );
    }

    // ── Check stock for every item ────────────────────────────
    for (const item of items as CartItem[]) {
      const { data: product } = await supabaseAdmin
        .from("products")
        .select("quantity, name")
        .eq("id", item.product.id)
        .single();

      if (!product || product.quantity < item.quantity) {
        return NextResponse.json(
          {
            error: `Not enough stock for "${item.product.name}". Only ${
              product?.quantity ?? 0
            } left.`,
          },
          { status: 409 }
        );
      }
    }

    // ── Create the order ──────────────────────────────────────
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        customer_name,
        customer_phone,
        customer_address: customer_address ?? "",
        customer_lat: customer_lat ?? null,
        customer_lng: customer_lng ?? null,
        items,
        subtotal,
        delivery_charge,
        total_amount,
        order_type,
        status: "Placed",
        delivery_date: null,
        return_requested: false,
        return_reason: null,
      })
      .select()
      .single();

    if (orderError) {
      return NextResponse.json({ error: orderError.message }, { status: 500 });
    }

    // ── Reduce stock ──────────────────────────────────────────
    for (const item of items as CartItem[]) {
      const { data: product } = await supabaseAdmin
        .from("products")
        .select("quantity")
        .eq("id", item.product.id)
        .single();

      if (product) {
        const newQty = product.quantity - item.quantity;
        await supabaseAdmin
          .from("products")
          .update({ quantity: newQty, is_active: newQty > 0 })
          .eq("id", item.product.id);
      }
    }

    // ── Fire background tasks (non-blocking) ─────────────────
    const origin = req.nextUrl.origin;

    // 1. WhatsApp order notification to admin
    fetch(`${origin}/api/whatsapp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order),
    }).catch(() => {});

    // 2. Low stock check + alert
    fetch(`${origin}/api/notify-low-stock`, {
      method: "POST",
    }).catch(() => {});

    // 3. Sync Excel inventory file
    fetch(`${origin}/api/sync-inventory`, {
      method: "POST",
    }).catch(() => {});

    return NextResponse.json(order, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}