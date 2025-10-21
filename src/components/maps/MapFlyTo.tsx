"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import { Location, ClusterWithLocation } from "../interfaces";

interface MapFlyToProps {
  location: Location | null;
  cluster: ClusterWithLocation | null;
}

/**
 * Component that hooks into the Leaflet map instance to programmatically fly to a specific point.
 */
export const MapFlyTo: React.FC<MapFlyToProps> = ({ location, cluster }) => {
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
