import L from "leaflet";
import { ClusterWithLocation } from "../interfaces";

/**
 * Creates a custom Leaflet DivIcon based on the location's priority.
 * @param priority The priority level ("low", "mid", "high").
 * @returns A new L.DivIcon instance.
 */
export const getPriorityIcon = (
  priority: "low" | "mid" | "high"
): L.DivIcon => {
  const color = {
    low: "#22c55e",
    mid: "#f59e0b",
    high: "#ef4444",
  }[priority || "low"];

  // Custom SVG map marker for visual distinction based on priority
  const iconHtml = `
      <svg viewBox="0 0 32 32" fill="${color}" width="32px" height="32px" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
        <path d="M16 0 C10.48 0 6 4.48 6 10 C6 17.5 16 32 16 32 S26 17.5 26 10 C26 4.48 21.52 0 16 0 Z M16 14 C13.79 14 12 12.21 12 10 S13.79 6 16 6 S20 7.79 20 10 S18.21 14 16 14 Z" />
        <circle cx="16" cy="10" r="4" fill="white" />
      </svg>
  `;

  return new L.DivIcon({
    html: iconHtml,
    className: "bg-transparent border-0", // Tailwind to remove default L.DivIcon styling
    iconSize: [32, 32],
    iconAnchor: [16, 32], // Anchor to the bottom tip of the teardrop
    tooltipAnchor: [0, -34],
  });
};

/**
 * Creates a custom Leaflet DivIcon for a cluster marker.
 * @param cluster The cluster data.
 * @returns A new L.DivIcon instance.
 */
export const ClusterIcon = ({
  cluster,
}: {
  cluster: ClusterWithLocation;
}): L.DivIcon => {
  // Scale size based on the number of points in the cluster
  const size = 30 + Math.min(cluster.total_points, 100) * 0.5; // Cap scaling for large clusters
  const color =
    cluster.job_type === "Residential Roofing" ? "#3b82f6" : "#8b5cf6"; // Different colors based on job type

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
