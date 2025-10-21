// --- Reverse Geocoding Function ---

/**
 * Performs reverse geocoding to find location details (city, neighborhood, etc.)
 * from coordinates using a mock backend proxy.
 * @param lat Latitude
 * @param lng Longitude
 * @returns Geocoding data or null
 */
export const reverseGeocode = async (lat: number, lng: number) => {
  try {
    // Note: In a real Next.js app, this API route would handle the Nominatim/OpenCage/Google Maps API call.
    const response = await fetch(`/api/geocode?lat=${lat}&lng=${lng}`);

    if (!response.ok) {
      throw new Error("Geocoding request failed");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
};
