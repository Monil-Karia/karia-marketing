// ============================================================
//  API: /api/notify-low-stock
//  POST → checks for products with qty ≤ LOW_STOCK_THRESHOLD
//         sends a WhatsApp alert to admin if any found
//  Called automatically after every order is placed.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const LOW_STOCK_THRESHOLD = 2; // Alert when 3 or fewer units left

export async function POST(req: NextRequest) {
  try {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_WHATSAPP_FROM;
    const to = process.env.ADMIN_WHATSAPP;

    if (!sid || !token || !from || !to) {
      return NextResponse.json({ skipped: true, reason: "WhatsApp not configured" });
    }

    // Find products running low
    const { data: lowStockItems } = await supabaseAdmin
      .from("products")
      .select("name, quantity, category")
      .lte("quantity", LOW_STOCK_THRESHOLD)
      .gt("quantity", 0)   // Don't re-alert for already out-of-stock
      .eq("is_active", true)
      .order("quantity");

    if (!lowStockItems || lowStockItems.length === 0) {
      return NextResponse.json({ skipped: true, reason: "No low stock items" });
    }

    const itemsList = lowStockItems
      .map((p) => `  • ${p.name} — only *${p.quantity}* left`)
      .join("\n");

    const message =
      `⚠️ *Low Stock Alert — Karia Marketing*\n\n` +
      `The following products are running low:\n\n` +
      `${itemsList}\n\n` +
      `Please restock soon to avoid missing orders.\n` +
      `View inventory: ${req.nextUrl.origin}/admin/inventory`;

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
    const body = new URLSearchParams({ From: from, To: to, Body: message });

    await fetch(twilioUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    return NextResponse.json({
      success: true,
      alerted: lowStockItems.length,
    });
  } catch (err) {
    console.error("Low stock alert error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}