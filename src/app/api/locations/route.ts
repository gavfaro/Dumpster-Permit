import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseClient";

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { searchParams } = new URL(request.url);

  const min_lat = searchParams.get("min_lat");
  const min_lng = searchParams.get("min_lng");
  const max_lat = searchParams.get("max_lat");
  const max_lng = searchParams.get("max_lng");
  const job_type = searchParams.get("job_type");

  if (!min_lat || !min_lng || !max_lat || !max_lng) {
    return NextResponse.json(
      { error: "Missing bounding box parameters" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase.rpc("get_locations_in_bounds", {
    min_lat: parseFloat(min_lat),
    min_lng: parseFloat(min_lng),
    max_lat: parseFloat(max_lat),
    max_lng: parseFloat(max_lng),
    filter_job_type: job_type || null,
  });

  if (error) {
    console.error("Supabase RPC error:", error);
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json(data);
}
