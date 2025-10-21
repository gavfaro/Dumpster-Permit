"use client";

import React from "react";
import { Location } from "../interfaces";

interface LocationInfoProps {
  location: Location | null;
  onClose: () => void;
}

/**
 * Displays detailed information about a single selected permit location.
 */
export const LocationInfo: React.FC<LocationInfoProps> = ({
  location,
  onClose,
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
    <div className="absolute top-4 right-4 z-[1000] w-full max-w-sm p-6 bg-white rounded-2xl shadow-xl border border-gray-200 backdrop-blur-sm bg-white/80 transition-transform duration-300 ease-out">
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 transition-colors p-1 rounded-full hover:bg-gray-100"
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
