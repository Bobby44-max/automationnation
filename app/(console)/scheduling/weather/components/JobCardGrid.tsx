"use client";

import { useState } from "react";
import { JobCard } from "./JobCard";

interface JobCardGridProps {
  jobs: any[];
}

type SortOption = "time" | "status" | "client";
type FilterOption = "all" | "green" | "yellow" | "red";

const STATUS_ORDER = { red: 0, yellow: 1, green: 2 };

export function JobCardGrid({ jobs }: JobCardGridProps) {
  const [sortBy, setSortBy] = useState<SortOption>("status");
  const [filterBy, setFilterBy] = useState<FilterOption>("all");

  // Filter
  const filtered =
    filterBy === "all"
      ? jobs
      : jobs.filter(
          (j) => (j.weatherStatus?.status || "green") === filterBy
        );

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case "status": {
        const aStatus = a.weatherStatus?.status || "green";
        const bStatus = b.weatherStatus?.status || "green";
        return (
          (STATUS_ORDER[aStatus as keyof typeof STATUS_ORDER] ?? 2) -
          (STATUS_ORDER[bStatus as keyof typeof STATUS_ORDER] ?? 2)
        );
      }
      case "time":
        return (a.startTime || "").localeCompare(b.startTime || "");
      case "client":
        return (a.client?.name || "").localeCompare(b.client?.name || "");
      default:
        return 0;
    }
  });

  return (
    <div>
      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Filter:</span>
          {(["all", "red", "yellow", "green"] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => setFilterBy(opt)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filterBy === opt
                  ? "bg-gray-700 text-white"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {opt === "all" ? "All" : opt.charAt(0).toUpperCase() + opt.slice(1)}
              {opt !== "all" && (
                <span className="ml-1 opacity-60">
                  (
                  {
                    jobs.filter(
                      (j) => (j.weatherStatus?.status || "green") === opt
                    ).length
                  }
                  )
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Sort:</span>
          {(["status", "time", "client"] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => setSortBy(opt)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                sortBy === opt
                  ? "bg-gray-700 text-white"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {opt.charAt(0).toUpperCase() + opt.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {sorted.map((job) => (
          <JobCard key={job._id} job={job} />
        ))}
      </div>

      {sorted.length === 0 && (
        <p className="text-center text-gray-600 py-10">
          No jobs match this filter.
        </p>
      )}
    </div>
  );
}
