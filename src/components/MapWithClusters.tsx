"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { TileLayer, MapContainer } from "react-leaflet";

// Leaflet CSS imports (These must remain here or in a global style file)
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

// Interface Imports
import { Location, ClusterWithLocation } from "./interfaces";

// Component Imports
import { Sidebar } from "./sidebar/Sidebar";
import { DataFetcher } from "./maps/DataFetcher";
import { MapFlyTo } from "./maps/MapFlyTo";
import { LocationInfo } from "./info-panels/LocationInfo";
import { ClusterInfo } from "./info-panels/ClusterInfo";
import { Markers } from "./maps/Markers";

// Leaflet components must be dynamically imported with SSR disabled
// to prevent window/document undefined errors, which is typical for Next.js.
const DynamicMapContainer = dynamic(() => Promise.resolve(MapContainer), {
  ssr: false,
});

/**
 * Main component for the map application. Manages application state and coordinates sub-components.
 */
const MapWithClusters = () => {
  // --- State Management ---
  const [locations, setLocations] = useState<Location[]>([]);
  const [clusters, setClusters] = useState<ClusterWithLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null
  );
  const [selectedCluster, setSelectedCluster] =
    useState<ClusterWithLocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [jobTypeFilter, setJobTypeFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"locations" | "clusters">(
    "locations"
  );

  // --- Handlers ---
  const handleLocationClick = (location: Location) => {
    setSelectedLocation(location);
    setSelectedCluster(null);
  };

  const handleClusterClick = (cluster: ClusterWithLocation) => {
    setSelectedCluster(cluster);
    setSelectedLocation(null);
  };

  // --- Render ---
  return (
    <div className="flex h-screen w-screen absolute top-0 left-0">
      {/* Sidebar */}
      <Sidebar
        locations={locations}
        clusters={clusters}
        onLocationClick={handleLocationClick}
        onClusterClick={handleClusterClick}
        jobTypeFilter={jobTypeFilter}
        onJobTypeChange={setJobTypeFilter}
        isLoading={isLoading}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Map Container */}
      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1000] bg-white/90 px-8 py-4 rounded-xl shadow-2xl border border-gray-200">
            <p className="text-gray-700 font-medium flex items-center gap-2">
              <svg
                className="animate-spin h-5 w-5 text-blue-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Loading Map Data...
            </p>
          </div>
        )}

        <DynamicMapContainer
          center={[37.0902, -95.7129]}
          zoom={4}
          className="w-full h-full z-0"
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Map Components */}
          <DataFetcher
            setLocations={setLocations}
            setClusters={setClusters}
            setIsLoading={setIsLoading}
            jobTypeFilter={jobTypeFilter}
            activeTab={activeTab}
          />
          <Markers
            activeTab={activeTab}
            locations={locations}
            clusters={clusters}
            onLocationClick={handleLocationClick}
            onClusterClick={handleClusterClick}
          />
          <MapFlyTo location={selectedLocation} cluster={selectedCluster} />
        </DynamicMapContainer>

        {/* Info Panels */}
        <LocationInfo
          location={selectedLocation}
          onClose={() => setSelectedLocation(null)}
        />
        <ClusterInfo
          cluster={selectedCluster}
          onClose={() => setSelectedCluster(null)}
        />
      </div>
    </div>
  );
};

export default MapWithClusters;
