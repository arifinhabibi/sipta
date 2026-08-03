

// =============================================================================
// MOBILE FILTER DRAWER
// =============================================================================

import { ATTENDANCE_STATUS_CONFIG, ATTENDANCE_TYPE_CONFIG } from "@/src/domain/Attendance";
import { XMarkIcon } from "@heroicons/react/24/outline";

export const MobileFilterDrawer: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
}> = ({ isOpen, onClose, statusFilter, onStatusFilterChange, typeFilter, onTypeFilterChange }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        {/* Background overlay - transparan */}
        <div 
          className="absolute inset-0 bg-black bg-opacity-30 transition-opacity"
          onClick={onClose}
        ></div>

        {/* Drawer panel */}
        <div className="absolute inset-x-0 bottom-0 max-w-full flex">
          <div className="relative w-full max-h-[80vh] bg-white rounded-t-xl shadow-xl overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Filter Data</h3>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Status Kehadiran
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['all', 'present', 'absent', 'sick', 'permission'].map((status) => (
                    <button
                      key={status}
                      onClick={() => onStatusFilterChange(status)}
                      className={`
                        p-3 rounded-lg text-sm font-medium transition-all duration-200 text-left
                        ${statusFilter === status 
                          ? 'bg-blue-600 text-white shadow-sm' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }
                      `}
                    >
                      {status === 'all' ? 'Semua Status' : ATTENDANCE_STATUS_CONFIG[status as keyof typeof ATTENDANCE_STATUS_CONFIG]?.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Tipe Absensi
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['all', 'check_in', 'check_out'].map((type) => (
                    <button
                      key={type}
                      onClick={() => onTypeFilterChange(type)}
                      className={`
                        p-3 rounded-lg text-sm font-medium transition-all duration-200 text-left
                        ${typeFilter === type 
                          ? 'bg-blue-600 text-white shadow-sm' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }
                      `}
                    >
                      {type === 'all' ? 'Semua Tipe' : ATTENDANCE_TYPE_CONFIG[type as keyof typeof ATTENDANCE_TYPE_CONFIG]?.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    onStatusFilterChange('all');
                    onTypeFilterChange('all');
                  }}
                  className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Reset Filter
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Terapkan
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};