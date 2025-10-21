// --- Data Types ---

/**
 * Defines the structure for an individual location/permit.
 */
export interface Location {
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

/**
 * Defines the base structure for a spatial cluster of locations.
 */
export interface Cluster {
  job_type: string;
  cluster_id: number;
  total_points: number;
  center_lat: number;
  center_lng: number;
  keywords: string[];
  location_ids?: number[];
  location_coords?: Array<{ lat: number; lng: number }>;
}

/**
 * Extends the Cluster interface with processed geocoding information for display.
 */
export interface ClusterWithLocation extends Cluster {
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
