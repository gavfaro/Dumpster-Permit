"use client";

import React from "react";
import { ClusterWithLocation } from "../interfaces";

interface ClustersPanelProps {
  clusters: ClusterWithLocation[];
  onClusterClick: (cluster: ClusterWithLocation) => void;
  isLoading: boolean;
}

/**
 * Renders the list view of aggregated clusters in the sidebar.
 */
export const ClustersPanel: React.FC<ClustersPanelProps> = ({
  clusters,
  onClusterClick,
  isLoading,
}) => {
  if (clusters.length === 0 && !isLoading) {
    return (
      <div className="p-4 text-center text-gray-500">
        No clusters found in this area.
      </div>
    );
  }

  return (
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
  );
};
