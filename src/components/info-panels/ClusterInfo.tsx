"use client";

import React from "react";
import { ClusterWithLocation } from "../interfaces";

interface ClusterInfoProps {
  cluster: ClusterWithLocation | null;
  onClose: () => void;
}

export const ClusterInfo: React.FC<ClusterInfoProps> = ({
  cluster,
  onClose,
}) => {
  const [showAll, setShowAll] = React.useState(false);

  if (!cluster) return null;

  const copyToClipboard = (text: string) => {
    const tempInput = document.createElement("input");
    tempInput.value = text;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand("copy");
    document.body.removeChild(tempInput);
    console.log(`Copied to clipboard: ${text}`);
  };

  const getMarketingAreas = () => {
    const areas: { type: string; name: string; icon: string }[] = [];

    cluster.neighborhoods?.forEach((neighborhood) => {
      areas.push({ type: "neighborhood", name: neighborhood, icon: "🏘️" });
    });

    cluster.cities?.forEach((city) => {
      areas.push({ type: "city", name: city, icon: "🏙️" });
    });

    cluster.counties?.forEach((county) => {
      areas.push({ type: "county", name: county, icon: "🗺️" });
    });

    cluster.postal_codes?.forEach((code) => {
      areas.push({ type: "zip", name: code, icon: "📮" });
    });

    return areas;
  };

  const marketingAreas = getMarketingAreas();

  return (
    <div className="absolute top-4 right-4 z-[1000] w-full max-w-md p-6 bg-white rounded-2xl shadow-xl border border-gray-200 backdrop-blur-sm bg-white/80 transition-transform duration-300 ease-out max-h-[90vh] overflow-y-auto">
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
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-2xl font-bold text-gray-800">
              {cluster.job_type}
            </h2>
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
              {cluster.total_points} permits
            </span>
          </div>
          <p className="text-gray-600 text-sm">
            {cluster.area_name || "Location data loading..."}
          </p>
        </div>

        {/* Marketing Target Areas */}
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-xs uppercase font-semibold text-gray-400 mb-3 flex items-center gap-2">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Target Areas for Advertising
          </h3>

          {marketingAreas.length > 0 ? (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-2">
              {marketingAreas.map((area, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                    area.type === "neighborhood"
                      ? "bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 hover:border-purple-300"
                      : area.type === "city"
                      ? "bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200 hover:border-blue-300"
                      : area.type === "county"
                      ? "bg-gradient-to-r from-green-50 to-teal-50 border-green-200 hover:border-green-300"
                      : "bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200 hover:border-orange-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{area.icon}</span>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-800">
                        {area.name}
                      </span>
                      <span className="text-xs text-gray-500 capitalize">
                        {area.type}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(area.name)}
                    className="p-1.5 hover:bg-white rounded-md transition-colors"
                    title="Copy to clipboard"
                  >
                    <svg
                      className="w-4 h-4 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </button>
                </div>
              ))}
              {cluster.state && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🏛️</span>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-800">
                        {cluster.state}
                      </span>
                      <span className="text-xs text-gray-500">State</span>
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(cluster.state || "")}
                    className="p-1.5 hover:bg-white rounded-md transition-colors"
                    title="Copy to clipboard"
                  >
                    <svg
                      className="w-4 h-4 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-3"></div>
                <p className="text-sm text-gray-500">
                  Loading neighborhood data...
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Analyzing {cluster.total_points} locations
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Keywords Section - with Show More / Show Less toggle */}
        {cluster.keywords && cluster.keywords.length > 0 && (
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-xs uppercase font-semibold text-gray-400 mb-3 flex items-center gap-2">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
              Common Project Keywords ({cluster.keywords.length})
            </h3>

            {/* show more/less state */}
            <div className="flex flex-wrap gap-2">
              {(showAll ? cluster.keywords : cluster.keywords.slice(0, 15)).map(
                (keyword, index) => (
                  <span
                    key={index}
                    className="bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 px-2.5 py-1 rounded-md text-xs border border-blue-200 hover:border-blue-300 transition-colors"
                  >
                    {keyword}
                  </span>
                )
              )}

              {cluster.keywords.length > 15 && (
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="text-xs text-blue-600 hover:underline px-2 py-1"
                >
                  {showAll
                    ? "Show less"
                    : `+${cluster.keywords.length - 15} more`}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Ad Platform Quick Links */}
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-xs uppercase font-semibold text-gray-400 mb-3">
            Create Ads on These Platforms
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <a
              href="https://ads.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
            >
              <svg
                className="w-5 h-5 text-blue-600"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
              </svg>
              <span className="text-sm font-medium text-blue-700">
                Google Ads
              </span>
            </a>
            <a
              href="https://www.facebook.com/business/ads"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors"
            >
              <svg
                className="w-5 h-5 text-indigo-600"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span className="text-sm font-medium text-indigo-700">
                Facebook
              </span>
            </a>
            <a
              href="https://business.nextdoor.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors"
            >
              <svg
                className="w-5 h-5 text-green-600"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 18c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7z" />
              </svg>
              <span className="text-sm font-medium text-green-700">
                Nextdoor
              </span>
            </a>
            <a
              href="https://www.yelp.com/advertise"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors"
            >
              <svg
                className="w-5 h-5 text-red-600"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
              <span className="text-sm font-medium text-red-700">Yelp Ads</span>
            </a>
          </div>
        </div>

        {/* Cluster Details */}
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-xs uppercase font-semibold text-gray-400 mb-3">
            Cluster Details
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="font-semibold text-gray-500">Cluster ID:</span>
              <span className="text-gray-800 font-mono">
                {cluster.cluster_id}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-gray-500">
                Total Permits:
              </span>
              <span className="text-gray-800 font-semibold">
                {cluster.total_points}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-gray-500">Coordinates:</span>
              <span className="text-gray-800 text-xs">
                {cluster.center_lat.toFixed(4)}, {cluster.center_lng.toFixed(4)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
