// ============================================================
//  API: /api/sync-inventory  (CSV version — Mac compatible)
//  POST → refreshes inventory.csv from current DB state
// ============================================================

import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { supabaseAdmin } from "@/lib/supabase";

const CSV_PATH = path.join(process.cwd(), "inventory.csv");

export async function POST() {
  try {
    const { data: products, error } = await supabaseAdmin
      .from("products")
      .select("*")
      .order("category")
      .order("name");

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const header = "product_id,name,category,price,quantity,is_returnable,status,last_updated";
    const rows = (products || []).map((p) => {
      const status = p.quantity === 0 ? "OUT OF STOCK" : "IN STOCK";
      const updated = new Date()?.toLocaleString("en-IN") ?? "0";
      return `${p.id},"${p.name}",${p.category},${p.price},${p.quantity},${p.is_returnable ? "YES" : "NO"},${status},"${updated}"`;
    });

    fs.writeFileSync(CSV_PATH, [header, ...rows].join("\n"));

    return NextResponse.json({ success: true, message: `inventory.csv updated with ${products?.length} products` });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}