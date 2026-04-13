// ============================================================
//  API: /api/delivery-check
//  POST { lat, lng } → returns delivery eligibility + charge
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { checkDeliveryEligibility } from "@/lib/distance";

export async function POST(req: NextRequest) {
  try {
    const { lat, lng } = await req.json();

    if (typeof lat !== "number" || typeof lng !== "number") {
      return NextResponse.json(
        { error: "lat and lng must be numbers" },
        { status: 400 }
      );
    }

    const result = checkDeliveryEligibility(lat, lng);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
