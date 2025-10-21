import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  if (!lat || !lng) {
    return NextResponse.json(
      { error: "Missing lat or lng parameters" },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          "User-Agent": "PermitClusterApp/1.0",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Geocoding API request failed");
    }

    const data = await response.json();

    console.log("Raw Nominatim response:", data);

    const addr = data.address || {};

    const neighborhoodOrArea =
      addr.neighbourhood ||
      addr.suburb ||
      addr.hamlet ||
      addr.quarter || // <-- add this
      addr.city_district ||
      addr.city_division ||
      addr.locality ||
      addr.town ||
      addr.village;

    console.log("Extracted smallest area:", neighborhoodOrArea);
    console.log("City:", addr.city || addr.town || addr.village);
    console.log("County:", addr.county);
    console.log("State:", addr.state);
    console.log("Postal Code:", addr.postcode);

    return NextResponse.json({
      neighborhood: neighborhoodOrArea,
      city: addr.city || addr.town || addr.village,
      county: addr.county,
      state: addr.state,
      postal_code: addr.postcode,
      display_name: data.display_name,
    });
  } catch (error) {
    console.error("Geocoding error:", error);
    return NextResponse.json(
      { error: "Failed to geocode location" },
      { status: 500 }
    );
  }
}
