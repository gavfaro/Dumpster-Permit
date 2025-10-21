import { NextRequest, NextResponse } from "next/server";

// Define the API endpoint and key variables for the Gemini API call
const apiKey = ""; // API key is handled by the environment if left blank
const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

/**
 * Handles the GET request to reverse geocode coordinates using Google Search grounding.
 * @param request The incoming NextRequest containing lat and lng search parameters.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  if (!lat || !lng) {
    return NextResponse.json(
      { error: "Missing latitude or longitude parameters" },
      { status: 400 }
    );
  }

  // UPDATED: Query now asks for the top 2-3 relevant names
  const userQuery = `What are the top 2 or 3 most relevant geographical areas (neighborhoods, cities, or zip codes) associated with the coordinates: latitude ${lat}, longitude ${lng}? List them, separated by commas.`;

  // UPDATED: System instruction is modified to ask for a comma-separated list
  const systemPrompt =
    "You are a helpful reverse geocoder. Based on the search results, provide a concise, comma-separated list of the 2-3 most relevant geographical names (e.g., Neighborhood, City, State, or Zip Code) for the given coordinates. Example response format: 'Downtown Dallas, East Dallas, 75201' or 'Oakland, Berkeley, Emeryville'. Do not include any introductory phrases.";

  const payload = {
    contents: [{ parts: [{ text: userQuery }] }],
    // Crucially, enable Google Search grounding to perform the lookup
    tools: [{ google_search: {} }],
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
  };

  try {
    const fetchWithRetry = async (
      url: string,
      options: RequestInit,
      retries = 3
    ): Promise<Response> => {
      for (let i = 0; i < retries; i++) {
        const response = await fetch(url, options);
        if (response.status !== 429) {
          return response;
        }
        const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
      throw new Error("API request failed after multiple retries.");
    };

    const response = await fetchWithRetry(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      // Set to 'no-store' to ensure we always fetch new data for new coordinates
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API Error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    const generatedText =
      result.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Location names not found.";

    return NextResponse.json({ locationName: generatedText });
  } catch (error) {
    console.error("Reverse Geocoding failed:", error);
    return NextResponse.json(
      { error: "Failed to reverse geocode coordinates." },
      { status: 500 }
    );
  }
}
