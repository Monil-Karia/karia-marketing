// ============================================================
//  API: /api/orders/[id]
//  GET   → single order details
//  PATCH → admin updates status, delivery date, return handling
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { CartItem } from "@/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await req.json();

    // ── If cancelling → restore stock ─────────────────────────
    if (body.status === "Cancelled") {
      const { data: existingOrder, error: fetchError } = await supabaseAdmin
        .from("orders")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError) {
        return NextResponse.json({ error: fetchError.message }, { status: 404 });
      }

      if (existingOrder.status !== "Cancelled") {
        const items: CartItem[] = existingOrder.items || [];

        for (const item of items) {
          const { data: product } = await supabaseAdmin
            .from("products")
            .select("quantity")
            .eq("id", item.product.id)
            .single();

          if (product) {
            const restoredQty = product.quantity + item.quantity;
            await supabaseAdmin
              .from("products")
              .update({ quantity: restoredQty, is_active: true })
              .eq("id", item.product.id);
          }
        }
      }
    }

    // ── Apply allowed field updates ───────────────────────────
    const allowed = [
      "status",
      "delivery_date",
      "return_requested",
      "return_reason",
      "return_status",
      "payment_status",
      "razorpay_order_id",
      "razorpay_payment_id",
    ];

    const updatePayload: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) updatePayload[key] = body[key];
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("orders")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Sync inventory CSV in background
    fetch(`${req.nextUrl.origin}/api/sync-inventory`, { method: "POST" }).catch(() => {});

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}