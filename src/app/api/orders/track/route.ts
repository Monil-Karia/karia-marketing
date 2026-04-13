// ============================================================
//  API: /api/orders/track
//  GET ?phone=9876543210 → returns all orders for that number
//  Used by the customer-facing order tracking page.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  const phone = req.nextUrl.searchParams.get("phone");

  if (!phone || phone.length < 10) {
    return NextResponse.json({ error: "Valid phone number required" }, { status: 400 });
  }

  // Match the last 10 digits to handle +91 prefix variations
  const last10 = phone.slice(-10);

  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("*")
    .like("customer_phone", `%${last10}`)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}