import { NextRequest, NextResponse } from "next/server";

// Simple in-memory cache (use Redis in production!)
const geocodeCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

// Rate limiting per IP
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 50;

function getRateLimitKey(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  record.count++;
  return true;
}

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

  // Rate limiting
  const rateLimitKey = getRateLimitKey(request);
  if (!checkRateLimit(rateLimitKey)) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please try again later." },
      { status: 429 }
    );
  }

  // Create cache key (round to 4 decimals for ~11m precision)
  const cacheKey = `${parseFloat(lat).toFixed(4)},${parseFloat(lng).toFixed(
    4
  )}`;

  // Check cache first
  const cached = geocodeCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`✅ Cache HIT for ${cacheKey}`);
    return NextResponse.json(cached.data);
  }

  console.log(`❌ Cache MISS for ${cacheKey}, fetching from Nominatim...`);

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

    const addr = data.address || {};

    const neighborhoodOrArea =
      addr.neighbourhood ||
      addr.suburb ||
      addr.hamlet ||
      addr.quarter ||
      addr.city_district ||
      addr.city_division ||
      addr.locality ||
      addr.town ||
      addr.village;

    const result = {
      neighborhood: neighborhoodOrArea,
      city: addr.city || addr.town || addr.village,
      county: addr.county,
      state: addr.state,
      postal_code: addr.postcode,
      display_name: data.display_name,
    };

    // Store in cache
    geocodeCache.set(cacheKey, {
      data: result,
      timestamp: Date.now(),
    });

    // Clean old cache entries periodically (every 1000 requests)
    if (geocodeCache.size > 10000) {
      const now = Date.now();
      for (const [key, value] of geocodeCache.entries()) {
        if (now - value.timestamp > CACHE_TTL) {
          geocodeCache.delete(key);
        }
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Geocoding error:", error);
    return NextResponse.json(
      { error: "Failed to geocode location" },
      { status: 500 }
    );
  }
}
