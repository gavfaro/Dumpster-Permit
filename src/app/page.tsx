"use client";

import React from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

// Dynamically import the map component using a relative path.
// Note: We no longer pass locations as a prop here, as the map now fetches its own data.
const MapWithClusters = dynamic(() => import("../components/MapWithClusters"), {
  ssr: false, // This is crucial for Leaflet to work with Next.js
  loading: () => (
    <div className="flex items-center justify-center h-screen">
      <p className="text-center text-gray-500 text-lg">Initializing Map...</p>
    </div>
  ),
});

// The main page component is now much simpler.
const HeatmapPage = () => {
  return (
    <main className="relative w-screen h-screen">
      {/* The map component handles all of its own data fetching and state management. */}
      <MapWithClusters />
    </main>
  );
};

export default HeatmapPage;
