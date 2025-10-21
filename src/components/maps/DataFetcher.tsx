"use client";

import React, { useEffect, useCallback, useRef, useState } from "react";
import { useMap } from "react-leaflet";
import { Location, Cluster, ClusterWithLocation } from "../interfaces";

interface DataFetcherProps {
  setLocations: React.Dispatch<React.SetStateAction<Location[]>>;
  setClusters: React.Dispatch<React.SetStateAction<ClusterWithLocation[]>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  jobTypeFilter: string;
  activeTab: "locations" | "clusters";
}

// In-memory cache for geocoded results
const geocodeCache = new Map<string, any>();

// Rate limiter for API calls
class RateLimiter {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private lastCallTime = 0;
  private minInterval = 1100; // Nominatim requires 1 req/sec, we use 1.1s to be safe

  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.process();
    });
  }

  private async process() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    while (this.queue.length > 0) {
      const now = Date.now();
      const timeSinceLastCall = now - this.lastCallTime;

      if (timeSinceLastCall < this.minInterval) {
        await new Promise((resolve) =>
          setTimeout(resolve, this.minInterval - timeSinceLastCall)
        );
      }

      const fn = this.queue.shift();
      if (fn) {
        this.lastCallTime = Date.now();
        await fn();
      }
    }

    this.processing = false;
  }
}

const rateLimiter = new RateLimiter();

// Cached reverse geocoding with rate limiting
async function reverseGeocodeWithCache(lat: number, lng: number) {
  // Round to 4 decimals for cache key (~11m precision)
  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;

  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey);
  }

  try {
    const result = await rateLimiter.add(async () => {
      const response = await fetch(`/api/geocode?lat=${lat}&lng=${lng}`);
      if (!response.ok) throw new Error("Geocoding failed");
      return response.json();
    });

    geocodeCache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error(`Geocode failed for ${lat},${lng}:`, error);
    return null;
  }
}

export const DataFetcher: React.FC<DataFetcherProps> = ({
  setLocations,
  setClusters,
  setIsLoading,
  jobTypeFilter,
  activeTab,
}) => {
  const map = useMap();
  const abortControllerRef = useRef<AbortController | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 50; // Load 50 clusters at a time

  const fetchData = useCallback(async () => {
    // Cancel any ongoing requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

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
        const response = await fetch(`/api/locations?${params.toString()}`, {
          signal: abortControllerRef.current.signal,
        });
        if (!response.ok) throw new Error("Failed to fetch locations");
        const data: Location[] = await response.json();
        setLocations(data);
        setClusters([]);
        setIsLoading(false); // ← ADD THIS!
      } else {
        // --- OPTIMIZED CLUSTER FETCHING ---
        const response = await fetch(`/api/clusters?${params.toString()}`, {
          signal: abortControllerRef.current.signal,
        });
        if (!response.ok) throw new Error("Failed to fetch clusters");
        const rawClusters: Cluster[] = await response.json();

        // Step 1: Show clusters immediately with basic info
        const basicClusters: ClusterWithLocation[] = rawClusters.map(
          (cluster) => ({
            ...cluster,
            area_name: "Loading location...",
            neighborhoods: [],
            cities: [],
            counties: [],
            postal_codes: [],
          })
        );
        setClusters(basicClusters);
        setIsLoading(false); // Map is now interactive!

        // Step 2: Geocode ONLY the centroid of each cluster (not 10 points!)
        // This reduces API calls by 90%
        const geocodingPromises = rawClusters.map(async (cluster) => {
          const geocodeResult = await reverseGeocodeWithCache(
            cluster.center_lat,
            cluster.center_lng
          );

          if (!geocodeResult) return null;

          return {
            clusterId: cluster.cluster_id,
            jobType: cluster.job_type,
            data: geocodeResult,
          };
        });

        // Step 3: Process results as they arrive (streaming updates)
        const clustersMap = new Map(
          rawClusters.map((c) => [`${c.job_type}-${c.cluster_id}`, c])
        );

        for (const promise of geocodingPromises) {
          promise.then((result) => {
            if (!result) return;

            const clusterKey = `${result.jobType}-${result.clusterId}`;
            const cluster = clustersMap.get(clusterKey);
            if (!cluster) return;

            const { data } = result;
            const neighborhoods = data.neighborhood ? [data.neighborhood] : [];
            const cities = data.city ? [data.city] : [];
            const counties = data.county ? [data.county] : [];
            const postal_codes = data.postal_code ? [data.postal_code] : [];

            // Create friendly area name
            let area_name = "Unknown Area";
            if (neighborhoods.length > 0) {
              area_name = neighborhoods[0];
              if (cities.length > 0) {
                area_name += ` (${cities[0]})`;
              }
            } else if (cities.length > 0) {
              area_name = cities[0];
            }

            const enhancedCluster: ClusterWithLocation = {
              ...cluster,
              area_name,
              neighborhood: neighborhoods[0],
              neighborhoods,
              city: cities[0],
              cities,
              county: counties[0],
              counties,
              state: data.state,
              postal_code: postal_codes[0],
              postal_codes,
            };

            // Update state incrementally
            setClusters((prev) => {
              const index = prev.findIndex(
                (c) =>
                  c.job_type === result.jobType &&
                  c.cluster_id === result.clusterId
              );
              if (index === -1) return prev;

              const newClusters = [...prev];
              newClusters[index] = enhancedCluster;
              return newClusters;
            });
          });
        }
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        console.log("Fetch aborted");
        return;
      }
      console.error(`Error fetching ${activeTab}:`, error);
    }
  }, [map, setLocations, setClusters, setIsLoading, jobTypeFilter, activeTab]);

  useEffect(() => {
    fetchData();
    map.on("moveend", fetchData);
    map.on("zoomend", fetchData);
    return () => {
      map.off("moveend", fetchData);
      map.off("zoomend", fetchData);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [map, fetchData]);

  return null;
};
