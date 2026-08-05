'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  CalendarIcon,
  XMarkIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

// =============================================================================
// TYPES
// =============================================================================

export interface Attendance {
  id: string;
  teacher_id: string;
  teacher_name: string;
  schedule_id: string;
  schedule_date: string;
  subject_name: string;
  classroom_name: string;
  schedule_time: string;
  type: 'check_in' | 'check_out';
  status: 'present' | 'absent' | 'late' | 'sick' | 'permission';
  longitude: string;
  latitude: string;
  real_time_photo: string;
  gmaps: string | null;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const formatDate = (dateString: string): string => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateString);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : 'Tanggal tidak valid';
};

// =============================================================================
// BADGE COMPONENT
// =============================================================================

const Badge: React.FC<{ 
  color?: 'default' | 'primary' | 'success' | 'danger' | 'warning'; 
  variant?: 'solid' | 'outline'; 
  size?: 'sm' | 'md' | 'lg'; 
  children: React.ReactNode;
  className?: string;
}> = ({ color = 'default', variant = 'solid', size = 'md', children, className = '' }) => {
  const baseStyles = 'inline-flex items-center font-medium rounded-full';
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  };
  const colorStyles = {
    default: variant === 'solid' ? 'bg-gray-100 text-gray-800' : 'border border-gray-300 text-gray-600',
    primary: variant === 'solid' ? 'bg-blue-100 text-blue-800' : 'border border-blue-300 text-blue-600',
    success: variant === 'solid' ? 'bg-green-100 text-green-800' : 'border border-green-300 text-green-600',
    danger: variant === 'solid' ? 'bg-red-100 text-red-800' : 'border border-red-300 text-red-600',
    warning: variant === 'solid' ? 'bg-yellow-100 text-yellow-800' : 'border border-yellow-300 text-yellow-600',
  };
  
  return (
    <span className={`${baseStyles} ${sizeStyles[size]} ${colorStyles[color]} ${className}`}>
      {children}
    </span>
  );
};

// =============================================================================
// EMPTY STATE COMPONENT
// =============================================================================

const EmptyState: React.FC<{ 
  title: string; 
  description: string; 
  icon: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
}> = ({ title, description, icon: Icon, action }) => {
  return (
    <div className="text-center py-12">
      <Icon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 mb-4">{description}</p>
      {action}
    </div>
  );
};

// =============================================================================
// BUTTON COMPONENT
// =============================================================================

const Button: React.FC<{ 
  children: React.ReactNode; 
  color?: 'primary' | 'secondary' | 'danger';
  variant?: 'solid' | 'light';
  onClick?: () => void;
  className?: string;
}> = ({ children, color = 'primary', variant = 'solid', onClick, className = '' }) => {
  const baseStyles = 'px-4 py-2 rounded-lg font-medium transition-colors';
  const colorStyles = {
    primary: variant === 'solid' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'text-blue-600 hover:bg-blue-50',
    secondary: variant === 'solid' ? 'bg-gray-600 text-white hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-50',
    danger: variant === 'solid' ? 'bg-red-600 text-white hover:bg-red-700' : 'text-red-600 hover:bg-red-50',
  };
  
  return (
    <button onClick={onClick} className={`${baseStyles} ${colorStyles[color]} ${className}`}>
      {children}
    </button>
  );
};

// =============================================================================
// STATUS CHIP COMPONENT
// =============================================================================

const StatusChip: React.FC<{ status: Attendance['status'] }> = ({ status }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'present':
        return { color: 'success' as const, label: 'Hadir', icon: CheckCircleIcon };
      case 'absent':
        return { color: 'danger' as const, label: 'Absen', icon: XCircleIcon };
      case 'late':
        return { color: 'warning' as const, label: 'Terlambat', icon: ClockIcon };
      case 'sick':
        return { color: 'warning' as const, label: 'Sakit', icon: ClockIcon };
      case 'permission':
        return { color: 'primary' as const, label: 'Izin', icon: CalendarIcon };
      default:
        return { color: 'default' as const, label: status, icon: null };
    }
  };
  
  const config = getStatusConfig();
  const Icon = config.icon;
  
  return (
    <Badge color={config.color} variant="solid" size="sm" className="gap-1">
      {Icon && <Icon className="w-3 h-3" />}
      {config.label}
    </Badge>
  );
};

// =============================================================================
// TYPE CHIP COMPONENT
// =============================================================================

const TypeChip: React.FC<{ type: Attendance['type'] }> = ({ type }) => {
  const getTypeConfig = () => {
    switch (type) {
      case 'check_in':
        return { color: 'success' as const, label: 'Check In' };
      case 'check_out':
        return { color: 'primary' as const, label: 'Check Out' };
      default:
        return { color: 'default' as const, label: type };
    }
  };
  
  const config = getTypeConfig();
  
  return (
    <Badge color={config.color} variant="outline" size="sm">
      {config.label}
    </Badge>
  );
};

// =============================================================================
// ATTENDANCE LIST COMPONENT - MAIN COMPONENT
// =============================================================================

export const AttendanceList: React.FC<{
  attendances: Attendance[];
  searchQuery: string;
  statusFilter: string;
  typeFilter: string;
  onAttendanceClick: (attendance: Attendance) => void;
  onResetFilters: () => void;
}> = ({ attendances, searchQuery, statusFilter, typeFilter, onAttendanceClick, onResetFilters }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const filteredAttendances = useMemo(() => {
    return attendances.filter(attendance => {
      const matchesSearch = !searchQuery || 
        attendance.teacher_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        attendance.subject_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        attendance.classroom_name.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || attendance.status === statusFilter;
      const matchesType = typeFilter === 'all' || attendance.type === typeFilter;
      
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [attendances, searchQuery, statusFilter, typeFilter]);

  const paginatedAttendances = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAttendances.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAttendances, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredAttendances.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, typeFilter, attendances.length]);

  const handleViewDetail = (attendance: Attendance) => {
    onAttendanceClick(attendance);
  };

  const getStatusBadgeColor = (status: Attendance['status']) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800';
      case 'absent': return 'bg-red-100 text-red-800';
      case 'late': return 'bg-yellow-100 text-yellow-800';
      case 'sick': return 'bg-yellow-100 text-yellow-800';
      case 'permission': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: Attendance['status']) => {
    switch (status) {
      case 'present': return 'Hadir';
      case 'absent': return 'Absen';
      case 'late': return 'Terlambat';
      case 'sick': return 'Sakit';
      case 'permission': return 'Izin';
      default: return status;
    }
  };

  const getTypeBadgeColor = (type: Attendance['type']) => {
    switch (type) {
      case 'check_in': return 'bg-green-100 text-green-800';
      case 'check_out': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: Attendance['type']) => {
    switch (type) {
      case 'check_in': return 'Check In';
      case 'check_out': return 'Check Out';
      default: return type;
    }
  };

  if (filteredAttendances.length === 0) {
    return (
      <EmptyState
        title="Tidak ada data kehadiran"
        description="Tidak ada catatan kehadiran yang sesuai dengan filter yang dipilih."
        icon={CalendarIcon}
        action={
          <Button color="primary" variant="light" onClick={onResetFilters}>
            Reset Filter
          </Button>
        }
      />
    );
  }

  return (
      <div className="space-y-4">
        {/* Info Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 text-blue-600">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-xs sm:text-sm font-medium text-blue-900">
                Menampilkan {filteredAttendances.length} dari {attendances.length} kehadiran
              </span>
            </div>
            {filteredAttendances.length !== attendances.length && (
              <Badge color="primary" variant="solid" size="sm">
                Difilter
              </Badge>
            )}
          </div>
        </div>

        {/* Table View - Desktop */}
        <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Guru & Mapel
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kelas
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tanggal & Waktu
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipe
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Action</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedAttendances.map((attendance) => {
                const isToday = attendance.schedule_date === new Date().toISOString().split('T')[0];
                
                return (
                  <tr key={attendance.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {attendance.teacher_name}
                            {isToday && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                Hari Ini
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">{attendance.subject_name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{attendance.classroom_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(attendance.schedule_date)}</div>
                      <div className="text-sm text-gray-500">{attendance.schedule_time}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(attendance.status)}`}>
                        {getStatusLabel(attendance.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeBadgeColor(attendance.type)}`}>
                        {getTypeLabel(attendance.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        type="button"
                        onClick={() => handleViewDetail(attendance)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                        title="Lihat detail"
                        aria-label={`Lihat detail absensi ${attendance.teacher_name}`}
                      >
                        <EyeIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className="md:hidden space-y-3">
          {paginatedAttendances.map((attendance) => {
            const isToday = attendance.schedule_date === new Date().toISOString().split('T')[0];

            return (
              <button
                type="button"
                key={attendance.id}
                className="w-full bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all duration-200 cursor-pointer text-left"
                onClick={() => handleViewDetail(attendance)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <div className="font-semibold text-gray-900 truncate text-sm">
                          {attendance.teacher_name}
                        </div>
                        {isToday && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            Hari Ini
                          </span>
                        )}
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded-md text-xs truncate max-w-[120px]">
                            {attendance.subject_name}
                          </span>
                          <span className="text-gray-400 hidden sm:inline">•</span>
                          <span className="text-gray-600 text-xs">{attendance.classroom_name}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 flex-wrap text-xs">
                          <span className="text-gray-600 bg-gray-50 px-2 py-1 rounded">
                            {formatDate(attendance.schedule_date)}
                          </span>
                          <span className="text-gray-500 font-medium">{attendance.schedule_time}</span>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap mt-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(attendance.status)}`}>
                            {getStatusLabel(attendance.status)}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeBadgeColor(attendance.type)}`}>
                            {getTypeLabel(attendance.type)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex-shrink-0 ml-2">
                    <EyeIcon className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Pagination */}
        {filteredAttendances.length > itemsPerPage && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 hidden sm:block">Items per page:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
            </div>
            
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    type="button"
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
            
            <div className="text-sm text-gray-600 text-center sm:text-left">
              Menampilkan {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredAttendances.length)} dari {filteredAttendances.length}
            </div>
          </div>
        )}
      </div>
  );
};
