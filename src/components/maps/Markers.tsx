"use client";

import React from "react";
import { Marker, Tooltip } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { Location, ClusterWithLocation } from "../interfaces";
import { getPriorityIcon, ClusterIcon } from "../utils/map-icons";

interface MarkersProps {
  activeTab: "locations" | "clusters";
  locations: Location[];
  clusters: ClusterWithLocation[];
  onLocationClick: (location: Location) => void;
  onClusterClick: (cluster: ClusterWithLocation) => void;
}

/**
 * Renders either individual location markers (with clustering) or custom cluster markers.
 */
export const Markers: React.FC<MarkersProps> = ({
  activeTab,
  locations,
  clusters,
  onLocationClick,
  onClusterClick,
}) => {
  if (activeTab === "locations") {
    // Render individual locations with Leaflet's MarkerClusterGroup for standard clustering
    return (
      <MarkerClusterGroup>
        {locations.map((location) => (
          <Marker
            key={location.id}
            position={[location.lat, location.lng]}
            icon={getPriorityIcon(location.dumpster_priority)}
            eventHandlers={{ click: () => onLocationClick(location) }}
          >
            <Tooltip>{location.name}</Tooltip>
          </Marker>
        ))}
      </MarkerClusterGroup>
    );
  }

  // Render custom cluster markers (when activeTab is "clusters")
  return (
    <>
      {clusters.map((cluster) => (
        <Marker
          key={`${cluster.job_type}-${cluster.cluster_id}`}
          position={[cluster.center_lat, cluster.center_lng]}
          icon={ClusterIcon({ cluster })}
          eventHandlers={{ click: () => onClusterClick(cluster) }}
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
    </>
  );
};
