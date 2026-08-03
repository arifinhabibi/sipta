"use client";
import React from "react";

export default function LoadingState() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
          <div className="flex justify-between">
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-3 bg-gray-200 rounded w-1/4"></div>
            </div>
            <div className="h-8 bg-gray-200 rounded w-16"></div>
          </div>
          <div className="mt-3 h-10 bg-gray-200 rounded"></div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
