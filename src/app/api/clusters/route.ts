import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseClient";

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { searchParams } = new URL(request.url);

  const min_lat = searchParams.get("min_lat");
  const min_lng = searchParams.get("min_lng");
  const max_lat = searchParams.get("max_lat");
  const max_lng = searchParams.get("max_lng");
  const eps_km = searchParams.get("eps_km");
  const min_points = searchParams.get("min_points");

  if (!min_lat || !min_lng || !max_lat || !max_lng) {
    return NextResponse.json(
      { error: "Missing bounding box parameters" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase.rpc("get_location_clusters", {
    min_lat: parseFloat(min_lat),
    min_lng: parseFloat(min_lng),
    max_lat: parseFloat(max_lat),
    max_lng: parseFloat(max_lng),
    eps_km: eps_km ? parseFloat(eps_km) : 10.0,
    min_points: min_points ? parseInt(min_points) : 2,
  });

  if (error) {
    console.error("❌ Supabase RPC error:", error);
    return NextResponse.json({ error }, { status: 500 });
  }

  // 👇 Add this diagnostic line
  console.log(
    "🔍 get_location_clusters response:",
    JSON.stringify(data, null, 2)
  );

  return NextResponse.json(data);
}
