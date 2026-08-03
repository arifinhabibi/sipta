import React from 'react'

function ScheduleSkeleton() {
  return (
   <div className="animate-pulse space-y-4 px-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="p-3 bg-gray-100 rounded-xl border border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-300 rounded w-32 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-20"></div>
            </div>
            <div className="h-6 w-20 bg-gray-300 rounded"></div>
          </div>
          <div className="h-8 bg-gray-200 rounded mb-2"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-48"></div>
            <div className="h-4 bg-gray-200 rounded w-40"></div>
            <div className="h-4 bg-gray-200 rounded w-36"></div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default ScheduleSkeleton