// ============================================================
//  API: /api/sync-inventory  (CSV version — Mac compatible)
//  POST → refreshes inventory.csv from current DB state
// ============================================================
import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { supabaseAdmin } from "@/lib/supabase-admin";

const CSV_PATH = path.join(process.cwd(), "inventory.csv");

function csvCell(val: string | number | boolean) {
  const str = String(val ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function POST() {
  try {
    const { data: products, error } = await supabaseAdmin
      .from("products")
      .select("*")
      .order("category")
      .order("name");

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const header = "product_id,name,category,price,quantity,is_returnable,status,last_updated";

    const rows = (products || []).map((p) =>
      [
        csvCell(p.id),
        csvCell(p.name),
        csvCell(p.category),
        csvCell(p.price),
        csvCell(p.quantity),
        csvCell(p.is_returnable ? "YES" : "NO"),
        csvCell(p.quantity === 0 ? "OUT OF STOCK" : "IN STOCK"),
        csvCell(new Date().toLocaleString("en-IN")),
      ].join(",")
    );

    fs.writeFileSync(CSV_PATH, [header, ...rows].join("\n"), "utf-8");

    return NextResponse.json({
      success: true,
      message: `inventory.csv updated with ${products?.length} products`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}