// ============================================================
//  API: /api/products
//  GET  → returns all active products
//  POST → creates a new product (admin only via service key)
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  // Return ALL active products including out-of-stock ones
  // is_active=false means admin manually hid it, not just zero stock
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)   // Still hide manually-hidden products
    .order("quantity", { ascending: false }) // In-stock first
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { data, error } = await supabaseAdmin
      .from("products")
      .insert({
        name:         body.name,
        price:        body.price,
        quantity:     body.quantity,
        is_returnable:body.is_returnable ?? false,
        category:     body.category ?? "Other",
        image_url:    body.image_url ?? null,
        is_active:    true,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}