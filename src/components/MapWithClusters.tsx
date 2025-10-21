"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Tooltip,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";

import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

// --- Data Types ---
interface Location {
  id: number;
  lat: number;
  lng: number;
  name: string;
  description: string;
  record_id: string;
  job_type: string;
  dumpster_priority: "low" | "mid" | "high";
  permit_last_updated: string;
  keywords: string[];
  permit_status: string;
}

interface Cluster {
  job_type: string;
  cluster_id: number;
  total_points: number;
  center_lat: number;
  center_lng: number;
  keywords: string[];
  location_ids?: number[];
  location_coords?: Array<{ lat: number; lng: number }>;
}

interface ClusterWithLocation extends Cluster {
  area_name?: string;
  city?: string;
  cities?: string[];
  state?: string;
  county?: string;
  counties?: string[];
  neighborhood?: string;
  neighborhoods?: string[];
  postal_code?: string;
  postal_codes?: string[];
}

// --- Custom Marker Icons ---
const getPriorityIcon = (priority: "low" | "mid" | "high") => {
  const color = {
    low: "#22c55e",
    mid: "#f59e0b",
    high: "#ef4444",
  }[priority || "low"];

  const iconHtml = `
        <svg viewBox="0 0 32 32" fill="${color}" width="32px" height="32px" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
          <path d="M16 0 C10.48 0 6 4.48 6 10 C6 17.5 16 32 16 32 S26 17.5 26 10 C26 4.48 21.52 0 16 0 Z M16 14 C13.79 14 12 12.21 12 10 S13.79 6 16 6 S20 7.79 20 10 S18.21 14 16 14 Z" />
          <circle cx="16" cy="10" r="4" fill="white" />
        </svg>
    `;

  return new L.DivIcon({
    html: iconHtml,
    className: "bg-transparent border-0",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    tooltipAnchor: [0, -34],
  });
};

const ClusterIcon = ({ cluster }: { cluster: ClusterWithLocation }) => {
  const size = 30 + cluster.total_points * 2;
  const color =
    cluster.job_type === "Residential Roofing" ? "#3b82f6" : "#8b5cf6";

  const iconHtml = `
    <div style="
        width: ${size}px;
        height: ${size}px;
        background-color: ${color};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 14px;
        border: 2px solid white;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        cursor: pointer;
    ">
        ${cluster.total_points}
    </div>
    `;
  return new L.DivIcon({
    html: iconHtml,
    className: "bg-transparent border-0",
    iconSize: [size, size],
  });
};

// --- Reverse Geocoding Function ---
const reverseGeocode = async (lat: number, lng: number) => {
  try {
    // Use our backend API proxy instead of calling Nominatim directly
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

// --- Data Fetching Component ---
const DataFetcher = ({
  setLocations,
  setClusters,
  setIsLoading,
  jobTypeFilter,
  activeTab,
}: {
  setLocations: (locations: Location[]) => void;
  setClusters: (clusters: ClusterWithLocation[]) => void;
  setIsLoading: (loading: boolean) => void;
  jobTypeFilter: string;
  activeTab: "locations" | "clusters";
}) => {
  const map = useMap();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const bounds = map.getBounds();
    const params = new URLSearchParams({
      min_lat: bounds.getSouth().toString(),
      min_lng: bounds.getWest().toString(),
      max_lat: bounds.getNorth().toString(),
      max_lng: bounds.getEast().toString(),
    });

    try {
      if (activeTab === "locations") {
        if (jobTypeFilter !== "all") {
          params.append("job_type", jobTypeFilter);
        }
        const response = await fetch(`/api/locations?${params.toString()}`);
        if (!response.ok) throw new Error("Failed to fetch locations");
        const data: Location[] = await response.json();
        setLocations(data);
        setClusters([]);
      } else {
        const response = await fetch(`/api/clusters?${params.toString()}`);
        if (!response.ok) throw new Error("Failed to fetch clusters");
        const data: Cluster[] = await response.json();

        // Now we have actual location coordinates from each cluster!
        const clustersWithLocations = await Promise.all(
          data.map(async (cluster) => {
            let neighborhoods = new Set<string>();
            let cities = new Set<string>();
            let states = new Set<string>();
            let counties = new Set<string>();
            let postal_codes = new Set<string>();

            // Use the actual location coordinates returned from the cluster
            if (cluster.location_coords && cluster.location_coords.length > 0) {
              // Sample up to 10 points from the actual cluster locations
              const sampleSize = Math.min(10, cluster.location_coords.length);
              const sampledPoints = cluster.location_coords
                .sort(() => 0.5 - Math.random())
                .slice(0, sampleSize);

              // Geocode each sampled point from the actual cluster
              for (const point of sampledPoints) {
                const locationData = await reverseGeocode(point.lat, point.lng);
                if (locationData) {
                  if (locationData.neighborhood)
                    neighborhoods.add(locationData.neighborhood);
                  if (locationData.city) cities.add(locationData.city);
                  if (locationData.county) counties.add(locationData.county);
                  if (locationData.state) states.add(locationData.state);
                  if (locationData.postal_code)
                    postal_codes.add(locationData.postal_code);
                }
                // Add small delay to respect API rate limits
                await new Promise((resolve) => setTimeout(resolve, 100));
              }
            } else {
              // Fallback: geocode the center point if no location_coords available
              const centerData = await reverseGeocode(
                cluster.center_lat,
                cluster.center_lng
              );
              if (centerData) {
                if (centerData.neighborhood)
                  neighborhoods.add(centerData.neighborhood);
                if (centerData.city) cities.add(centerData.city);
                if (centerData.county) counties.add(centerData.county);
                if (centerData.state) states.add(centerData.state);
                if (centerData.postal_code)
                  postal_codes.add(centerData.postal_code);
              }
            }

            // Create a friendly area name
            const neighborhoodList = Array.from(neighborhoods);
            const cityList = Array.from(cities);
            const countyList = Array.from(counties);

            let area_name = "Unknown Area";
            if (neighborhoodList.length > 0) {
              // Show first 2 neighborhoods if multiple
              const displayNeighborhoods = neighborhoodList
                .slice(0, 2)
                .join(", ");
              const moreCount = neighborhoodList.length - 2;
              area_name =
                moreCount > 0
                  ? `${displayNeighborhoods} +${moreCount} more`
                  : displayNeighborhoods;

              if (cityList.length > 0) {
                area_name += ` (${cityList[0]})`;
              }
            } else if (cityList.length > 0) {
              area_name = cityList.join(", ");
            }

            return {
              ...cluster,
              area_name,
              neighborhood:
                neighborhoodList.length > 0
                  ? neighborhoodList.join(", ")
                  : undefined,
              neighborhoods: neighborhoodList,
              city: cityList.length > 0 ? cityList[0] : undefined,
              cities: cityList,
              county: countyList.length > 0 ? countyList[0] : undefined,
              counties: countyList,
              state: Array.from(states)[0],
              postal_code: Array.from(postal_codes)[0],
              postal_codes: Array.from(postal_codes),
            };
          })
        );

        setClusters(clustersWithLocations);
        setLocations([]);
      }
    } catch (error) {
      console.error(`Error fetching ${activeTab}:`, error);
    } finally {
      setIsLoading(false);
    }
  }, [map, setLocations, setClusters, setIsLoading, jobTypeFilter, activeTab]);

  useEffect(() => {
    fetchData();
    map.on("moveend", fetchData);
    map.on("zoomend", fetchData);
    return () => {
      map.off("moveend", fetchData);
      map.off("zoomend", fetchData);
    };
  }, [map, fetchData]);

  return null;
};

// --- Map Navigation Component ---
const MapFlyTo = ({
  location,
  cluster,
}: {
  location: Location | null;
  cluster: ClusterWithLocation | null;
}) => {
  const map = useMap();
  useEffect(() => {
    if (location) {
      map.flyTo([location.lat, location.lng], 15, {
        animate: true,
        duration: 1.5,
      });
    }
    if (cluster) {
      map.flyTo([cluster.center_lat, cluster.center_lng], 13, {
        animate: true,
        duration: 1.5,
      });
    }
  }, [location, cluster, map]);
  return null;
};

// --- Location Info Panel ---
const LocationInfo = ({
  location,
  onClose,
}: {
  location: Location | null;
  onClose: () => void;
}) => {
  if (!location) return null;

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const priorityStyles = {
    low: "bg-green-100 text-green-800 border-green-300",
    mid: "bg-amber-100 text-amber-800 border-amber-300",
    high: "bg-red-100 text-red-800 border-red-300",
  };

  const statusStyles: { [key: string]: string } = {
    approved: "bg-blue-100 text-blue-800 border-blue-300",
    pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
    rejected: "bg-pink-100 text-pink-800 border-pink-300",
  };
  const defaultStatusStyle = "bg-gray-100 text-gray-800 border-gray-300";

  return (
    <div className="absolute top-24 right-4 z-[1000] w-full max-w-sm p-6 bg-white rounded-2xl shadow-lg border border-gray-200 backdrop-blur-sm bg-white/80">
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 transition-colors"
        aria-label="Close"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
      <div className="flex flex-col space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{location.name}</h2>
          <p className="text-gray-600 text-sm mt-1">{location.description}</p>
        </div>
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-xs uppercase font-semibold text-gray-400 mb-3">
            Details
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-500">Priority:</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize border ${
                  priorityStyles[location.dumpster_priority]
                }`}
              >
                {location.dumpster_priority}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-500">
                Permit Status:
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize border ${
                  statusStyles[location.permit_status?.toLowerCase()] ||
                  defaultStatusStyle
                }`}
              >
                {location.permit_status || "N/A"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-gray-500">Record ID:</span>
              <span className="text-gray-800 font-mono text-xs">
                {location.record_id}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-gray-500">Job Type:</span>
              <span className="text-gray-800">{location.job_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-gray-500">
                Permit Updated:
              </span>
              <span className="text-gray-800">
                {formatDate(location.permit_last_updated)}
              </span>
            </div>
          </div>
        </div>

        {location.keywords && location.keywords.length > 0 && (
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-xs uppercase font-semibold text-gray-400 mb-2">
              Keywords
            </h3>
            <div className="flex flex-wrap gap-2">
              {location.keywords.map((keyword, index) => (
                <span
                  key={index}
                  className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md text-xs border border-gray-200"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Cluster Info Panel ---
const ClusterInfo = ({
  cluster,
  onClose,
}: {
  cluster: ClusterWithLocation | null;
  onClose: () => void;
}) => {
  if (!cluster) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getMarketingAreas = () => {
    const areas: { type: string; name: string; icon: string }[] = [];

    // Add all unique neighborhoods
    if (cluster.neighborhoods && cluster.neighborhoods.length > 0) {
      cluster.neighborhoods.forEach((neighborhood) => {
        areas.push({
          type: "neighborhood",
          name: neighborhood,
          icon: "🏘️",
        });
      });
    }

    // Add all unique cities
    if (cluster.cities && cluster.cities.length > 0) {
      cluster.cities.forEach((city) => {
        areas.push({
          type: "city",
          name: city,
          icon: "🏙️",
        });
      });
    }

    // Add counties
    if (cluster.counties && cluster.counties.length > 0) {
      cluster.counties.forEach((county) => {
        areas.push({
          type: "county",
          name: county,
          icon: "🗺️",
        });
      });
    }

    // Add postal codes
    if (cluster.postal_codes && cluster.postal_codes.length > 0) {
      cluster.postal_codes.forEach((code) => {
        areas.push({
          type: "zip",
          name: code,
          icon: "📮",
        });
      });
    }

    return areas;
  };

  const marketingAreas = getMarketingAreas();

  return (
    <div className="absolute top-24 right-4 z-[1000] w-full max-w-md p-6 bg-white rounded-2xl shadow-lg border border-gray-200 backdrop-blur-sm bg-white/80">
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 transition-colors"
        aria-label="Close"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      <div className="flex flex-col space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-2xl font-bold text-gray-800">
              {cluster.job_type}
            </h2>
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
              {cluster.total_points} permits
            </span>
          </div>
          <p className="text-gray-600 text-sm">
            {cluster.area_name || "Location data loading..."}
          </p>
        </div>

        {/* Marketing Target Areas */}
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-xs uppercase font-semibold text-gray-400 mb-3 flex items-center gap-2">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Target Areas for Advertising
          </h3>

          {marketingAreas.length > 0 ? (
            <div className="space-y-2">
              {marketingAreas.map((area, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                    area.type === "neighborhood"
                      ? "bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 hover:border-purple-300"
                      : area.type === "city"
                      ? "bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200 hover:border-blue-300"
                      : area.type === "county"
                      ? "bg-gradient-to-r from-green-50 to-teal-50 border-green-200 hover:border-green-300"
                      : "bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200 hover:border-orange-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{area.icon}</span>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-800">
                        {area.name}
                      </span>
                      <span className="text-xs text-gray-500 capitalize">
                        {area.type}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(area.name)}
                    className="p-1.5 hover:bg-white rounded-md transition-colors"
                    title="Copy to clipboard"
                  >
                    <svg
                      className="w-4 h-4 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </button>
                </div>
              ))}

              {cluster.state && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🏛️</span>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-800">
                        {cluster.state}
                      </span>
                      <span className="text-xs text-gray-500">State</span>
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(cluster.state || "")}
                    className="p-1.5 hover:bg-white rounded-md transition-colors"
                    title="Copy to clipboard"
                  >
                    <svg
                      className="w-4 h-4 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-3"></div>
                <p className="text-sm text-gray-500">
                  Loading neighborhood data...
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Analyzing {cluster.total_points} locations
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Ad Platform Quick Links */}
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-xs uppercase font-semibold text-gray-400 mb-3">
            Create Ads on These Platforms
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <a
              href="https://ads.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
            >
              <svg
                className="w-5 h-5 text-blue-600"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
              </svg>
              <span className="text-sm font-medium text-blue-700">
                Google Ads
              </span>
            </a>
            <a
              href="https://www.facebook.com/business/ads"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors"
            >
              <svg
                className="w-5 h-5 text-indigo-600"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span className="text-sm font-medium text-indigo-700">
                Facebook
              </span>
            </a>
            <a
              href="https://business.nextdoor.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors"
            >
              <svg
                className="w-5 h-5 text-green-600"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 18c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7z" />
              </svg>
              <span className="text-sm font-medium text-green-700">
                Nextdoor
              </span>
            </a>
            <a
              href="https://www.yelp.com/advertise"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors"
            >
              <svg
                className="w-5 h-5 text-red-600"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
              <span className="text-sm font-medium text-red-700">Yelp Ads</span>
            </a>
          </div>
        </div>

        {/* Cluster Details */}
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-xs uppercase font-semibold text-gray-400 mb-3">
            Cluster Details
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="font-semibold text-gray-500">Cluster ID:</span>
              <span className="text-gray-800 font-mono">
                {cluster.cluster_id}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-gray-500">
                Total Permits:
              </span>
              <span className="text-gray-800 font-semibold">
                {cluster.total_points}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-gray-500">Coordinates:</span>
              <span className="text-gray-800 text-xs">
                {cluster.center_lat.toFixed(4)}, {cluster.center_lng.toFixed(4)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ClustersPanel = ({
  clusters,
  onClusterClick,
  isLoading,
}: {
  clusters: ClusterWithLocation[];
  onClusterClick: (cluster: ClusterWithLocation) => void;
  isLoading: boolean;
}) => {
  return (
    <div className="flex-1 overflow-y-auto">
      {clusters.length === 0 && !isLoading ? (
        <div className="p-4 text-center text-gray-500">
          No clusters found in this area.
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {clusters.map((cluster) => (
            <div
              key={`${cluster.job_type}-${cluster.cluster_id}`}
              onClick={() => onClusterClick(cluster)}
              className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800 text-sm line-clamp-1">
                    {cluster.job_type}
                  </h4>
                  <p className="text-xs text-purple-600 mt-1 font-medium">
                    📍 {cluster.area_name || "Loading location..."}
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 ml-2">
                  {cluster.total_points} permits
                </span>
              </div>
              {cluster.city && cluster.state && (
                <div className="mt-2 text-xs text-gray-500">
                  {cluster.city}, {cluster.state}
                  {cluster.postal_code && ` ${cluster.postal_code}`}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Sidebar Component ---
const Sidebar = ({
  locations,
  clusters,
  onLocationClick,
  onClusterClick,
  jobTypeFilter,
  onJobTypeChange,
  isLoading,
  activeTab,
  setActiveTab,
}: {
  locations: Location[];
  clusters: ClusterWithLocation[];
  onLocationClick: (location: Location) => void;
  onClusterClick: (cluster: ClusterWithLocation) => void;
  jobTypeFilter: string;
  onJobTypeChange: (jobType: string) => void;
  isLoading: boolean;
  activeTab: "locations" | "clusters";
  setActiveTab: (tab: "locations" | "clusters") => void;
}) => {
  const priorityStyles = {
    low: "bg-green-100 text-green-700",
    mid: "bg-amber-100 text-amber-700",
    high: "bg-red-100 text-red-700",
  };

  return (
    <div className="w-96 h-full bg-white border-r border-gray-200 flex flex-col shadow-lg">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab("locations")}
          className={`flex-1 p-3 text-sm font-medium transition-colors ${
            activeTab === "locations"
              ? "bg-white text-blue-600 border-b-2 border-blue-600"
              : "bg-gray-50 text-gray-500 hover:bg-gray-100"
          }`}
        >
          Locations
        </button>
        <button
          onClick={() => setActiveTab("clusters")}
          className={`flex-1 p-3 text-sm font-medium transition-colors ${
            activeTab === "clusters"
              ? "bg-white text-blue-600 border-b-2 border-blue-600"
              : "bg-gray-50 text-gray-500 hover:bg-gray-100"
          }`}
        >
          Clusters
        </button>
      </div>

      {/* Filter Section */}
      {activeTab === "locations" && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Filter by Job Type
          </h3>
          <select
            value={jobTypeFilter}
            onChange={(e) => onJobTypeChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
          >
            <option value="all">All Job Types</option>
            <option value="Commercial Demolition">Commercial Demolition</option>
            <option value="Residential Roofing">Residential Roofing</option>
            <option value="Commercial New Construction">
              Commercial New Construction
            </option>
            <option value="Residential New Construction">
              Residential New Construction
            </option>
            <option value="Commercial Roofing Permit">
              Commercial Roofing Permit
            </option>
          </select>
        </div>
      )}

      {/* Count */}
      <div className="px-4 py-3 bg-blue-50 border-b border-blue-100">
        <p className="text-sm text-blue-800 font-medium">
          {isLoading
            ? "Loading..."
            : `${
                activeTab === "locations" ? locations.length : clusters.length
              } ${activeTab} found`}
        </p>
      </div>

      {/* Content */}
      {activeTab === "locations" ? (
        <div className="flex-1 overflow-y-auto">
          {locations.length === 0 && !isLoading ? (
            <div className="p-4 text-center text-gray-500">
              No locations found in this area
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {locations.map((location) => (
                <div
                  key={location.id}
                  onClick={() => onLocationClick(location)}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-800 text-sm line-clamp-1">
                      {location.name}
                    </h4>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                        priorityStyles[location.dumpster_priority]
                      }`}
                    >
                      {location.dumpster_priority}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                    {location.description}
                  </p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 font-medium">
                      {location.job_type}
                    </span>
                    <span className="text-gray-400">
                      ID: {location.record_id}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <ClustersPanel
          clusters={clusters}
          onClusterClick={onClusterClick}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};

// --- Main Map Component ---
const MapWithClusters = () => {
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

  const handleLocationClick = (location: Location) => {
    setSelectedLocation(location);
    setSelectedCluster(null);
  };

  const handleClusterClick = (cluster: ClusterWithLocation) => {
    setSelectedCluster(cluster);
    setSelectedLocation(null);
  };

  return (
    <div className="flex h-full w-full">
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
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1000] bg-white/80 px-6 py-4 rounded-lg shadow-md">
            <p className="text-gray-700">Loading...</p>
          </div>
        )}
        <MapContainer
          center={[37.0902, -95.7129]}
          zoom={4}
          className="w-full h-full z-0"
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <DataFetcher
            setLocations={setLocations}
            setClusters={setClusters}
            setIsLoading={setIsLoading}
            jobTypeFilter={jobTypeFilter}
            activeTab={activeTab}
          />

          {activeTab === "locations" && (
            <MarkerClusterGroup>
              {locations.map((location) => (
                <Marker
                  key={location.id}
                  position={[location.lat, location.lng]}
                  icon={getPriorityIcon(location.dumpster_priority)}
                  eventHandlers={{ click: () => handleLocationClick(location) }}
                >
                  <Tooltip>{location.name}</Tooltip>
                </Marker>
              ))}
            </MarkerClusterGroup>
          )}

          {activeTab === "clusters" &&
            clusters.map((cluster) => (
              <Marker
                key={`${cluster.job_type}-${cluster.cluster_id}`}
                position={[cluster.center_lat, cluster.center_lng]}
                icon={ClusterIcon({ cluster })}
                eventHandlers={{ click: () => handleClusterClick(cluster) }}
              >
                <Tooltip>
                  <div>
                    <strong>{cluster.job_type}</strong>
                    <br />
                    {cluster.total_points} permits in this cluster
                    {cluster.area_name && (
                      <>
                        <br />
                        📍 {cluster.area_name}
                      </>
                    )}
                  </div>
                </Tooltip>
              </Marker>
            ))}

          <MapFlyTo location={selectedLocation} cluster={selectedCluster} />
        </MapContainer>
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
