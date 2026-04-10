// ============================================================
//  API: /api/whatsapp
//  POST → sends a WhatsApp message to the admin's number
//  Uses Twilio's WhatsApp API (free sandbox for testing)
//
//  SETUP (one time, 5 minutes):
//  1. Go to twilio.com → sign up free
//  2. Go to Messaging → Try it out → Send a WhatsApp message
//  3. Follow the sandbox instructions (send a join code once from your phone)
//  4. Copy your Account SID and Auth Token from the Twilio dashboard
//  5. Add to .env.local:
//       TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxx
//       TWILIO_AUTH_TOKEN=your_auth_token
//       TWILIO_WHATSAPP_FROM=whatsapp:+14155238886   (Twilio sandbox number)
//       ADMIN_WHATSAPP=whatsapp:+919876543210        (your WhatsApp number with country code)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { Order } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const order: Order = await req.json();

    // Skip if Twilio not configured yet
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_WHATSAPP_FROM;
    const to = process.env.ADMIN_WHATSAPP;

    if (!sid || !token || !from || !to) {
      console.log("WhatsApp not configured — skipping notification");
      return NextResponse.json({ skipped: true, reason: "not configured" });
    }

    // Build the message text
    const itemsList = order.items
      .map((i) => `  • ${i.product.name} × ${i.quantity}`)
      .join("\n");

    const message =
      `🛒 *New Order — Karia Marketing*\n\n` +
      `*Customer:* ${order.customer_name}\n` +
      `*Phone:* ${order.customer_phone}\n` +
      `*Type:* ${order.order_type === "delivery" ? "🏠 Home Delivery" : "🏪 Shop Pickup"}\n` +
      (order.order_type === "delivery"
        ? `*Address:* ${order.customer_address}\n`
        : "") +
      `\n*Items:*\n${itemsList}\n\n` +
      `*Subtotal:* ₹${order.subtotal?.toLocaleString("en-IN") ?? "0"}\n` +
      (order.delivery_charge > 0
        ? `*Delivery:* ₹${order.delivery_charge}\n`
        : "") +
      `*Total:* ₹${order.total_amount?.toLocaleString("en-IN") ?? "0"}\n\n` +
      `Open admin panel: ${req.nextUrl.origin}/admin/orders`;

    // Call Twilio API
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
    const body = new URLSearchParams({ From: from, To: to, Body: message });

    const response = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Twilio error:", err);
      return NextResponse.json({ error: "WhatsApp send failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("WhatsApp API error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}