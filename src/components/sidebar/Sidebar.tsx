"use client";

import React from "react";
import { Location, ClusterWithLocation } from "../interfaces";
import { LocationsPanel } from "./LocationsPanel";
import { ClustersPanel } from "./ClustersPanel";

interface SidebarProps {
  locations: Location[];
  clusters: ClusterWithLocation[];
  onLocationClick: (location: Location) => void;
  onClusterClick: (cluster: ClusterWithLocation) => void;
  jobTypeFilter: string;
  onJobTypeChange: (jobType: string) => void;
  isLoading: boolean;
  activeTab: "locations" | "clusters";
  setActiveTab: (tab: "locations" | "clusters") => void;
}

/**
 * The main container for the map's interactive sidebar, handling tabs, filters, and list views.
 */
export const Sidebar: React.FC<SidebarProps> = ({
  locations,
  clusters,
  onLocationClick,
  onClusterClick,
  jobTypeFilter,
  onJobTypeChange,
  isLoading,
  activeTab,
  setActiveTab,
}) => {
  return (
    <div className="w-96 h-full bg-white border-r border-gray-200 flex flex-col shadow-lg flex-shrink-0">
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

      {/* Filter Section (only visible for Locations tab) */}
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
      <div className="flex-1 overflow-y-auto">
        {activeTab === "locations" ? (
          <LocationsPanel
            locations={locations}
            onLocationClick={onLocationClick}
            isLoading={isLoading}
          />
        ) : (
          <ClustersPanel
            clusters={clusters}
            onClusterClick={onClusterClick}
            isLoading={isLoading}
          />
        )}
        {isLoading && (
          <div className="p-4 text-center text-gray-400">
            <div className="animate-pulse">Fetching data...</div>
          </div>
        )}
      </div>
    </div>
  );
};
