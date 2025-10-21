"use client";

import React, { useEffect, useCallback } from "react";
import { useMap } from "react-leaflet";
import { Location, Cluster, ClusterWithLocation } from "../interfaces";
import { reverseGeocode } from "../utils/api";

interface DataFetcherProps {
  setLocations: (locations: Location[]) => void;
  setClusters: (clusters: ClusterWithLocation[]) => void;
  setIsLoading: (loading: boolean) => void;
  jobTypeFilter: string;
  activeTab: "locations" | "clusters";
}

interface ReverseGeocodeData {
  neighborhood?: string;
  city?: string;
  county?: string;
  state?: string;
  postal_code?: string;
}

interface GeocodeResult {
  clusterId: number;
  jobType: string;
  data: ReverseGeocodeData;
}

/**
 * Component that fetches data (locations or clusters) based on map bounds,
 * filter settings, and the active tab. It handles efficient, concurrent
 * reverse geocoding for clusters.
 */
export const DataFetcher: React.FC<DataFetcherProps> = ({
  setLocations,
  setClusters,
  setIsLoading,
  jobTypeFilter,
  activeTab,
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
        // --- CLUSTER FETCHING OPTIMIZATION START ---

        const response = await fetch(`/api/clusters?${params.toString()}`);
        if (!response.ok) throw new Error("Failed to fetch clusters");
        const data: Cluster[] = await response.json();

        // 1. Prepare all geocoding promises concurrently across ALL clusters.
        const geocodingPromises = data.flatMap((cluster) => {
          // Determine which points to geocode: max 10 sampled points, or the centroid as fallback.
          const pointsToGeocode =
            cluster.location_coords && cluster.location_coords.length > 0
              ? cluster.location_coords.slice(
                  0,
                  Math.min(10, cluster.location_coords.length)
                )
              : [
                  {
                    lat: cluster.center_lat,
                    lng: cluster.center_lng,
                  },
                ];

          // Create a promise for each point.
          return pointsToGeocode.map((point) =>
            reverseGeocode(point.lat, point.lng).then(
              // Success handler: tag result with cluster info
              (result) =>
                ({
                  clusterId: cluster.cluster_id,
                  jobType: cluster.job_type,
                  data: result,
                } as GeocodeResult),
              // Error handler: return null for failed geocodes
              (error) => {
                console.error(
                  `Single geocode failed for cluster ${cluster.cluster_id}:`,
                  error
                );
                return null;
              }
            )
          );
        });

        // 2. Execute all geocoding promises in parallel. Massive performance gain here!
        const allGeocodedResults = (
          await Promise.all(geocodingPromises)
        ).filter((r) => r !== null) as GeocodeResult[];

        // 3. Process results and reconstruct clusters with area data.
        const clustersWithLocations = data.map((cluster) => {
          // Filter results relevant to the current cluster.
          const clusterResults = allGeocodedResults.filter(
            (r) =>
              r.clusterId === cluster.cluster_id &&
              r.jobType === cluster.job_type
          );

          const neighborhoods = new Set<string>();
          const cities = new Set<string>();
          const states = new Set<string>();
          const counties = new Set<string>();
          const postal_codes = new Set<string>();

          // Aggregate all unique location names found in the samples/centroid.
          clusterResults.forEach(({ data: locationData }) => {
            if (locationData) {
              if (locationData.neighborhood)
                neighborhoods.add(locationData.neighborhood);
              if (locationData.city) cities.add(locationData.city);
              if (locationData.county) counties.add(locationData.county);
              if (locationData.state) states.add(locationData.state);
              if (locationData.postal_code)
                postal_codes.add(locationData.postal_code);
            }
          });

          // 4. Create a friendly area name
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

          // 5. Return the enhanced cluster object
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
        });

        setClusters(clustersWithLocations);
        setLocations([]);
        // --- CLUSTER FETCHING OPTIMIZATION END ---
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
