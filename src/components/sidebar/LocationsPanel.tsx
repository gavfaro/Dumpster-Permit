"use client";

import React from "react";
import { Location } from "../interfaces";

interface LocationsPanelProps {
  locations: Location[];
  onLocationClick: (location: Location) => void;
  isLoading: boolean;
}

/**
 * Renders the list view of individual permit locations in the sidebar.
 */
export const LocationsPanel: React.FC<LocationsPanelProps> = ({
  locations,
  onLocationClick,
  isLoading,
}) => {
  const priorityStyles = {
    low: "bg-green-100 text-green-700",
    mid: "bg-amber-100 text-amber-700",
    high: "bg-red-100 text-red-700",
  };

  if (locations.length === 0 && !isLoading) {
    return (
      <div className="p-4 text-center text-gray-500">
        No locations found in this area
      </div>
    );
  }

  return (
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
              className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ml-2 ${
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
            <span className="text-gray-400">ID: {location.record_id}</span>
          </div>
        </div>
      ))}
    </div>
  );
};
