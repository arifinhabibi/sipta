// =============================================================================
// REUSABLE COMPONENTS - CUSTOM IMPLEMENTATION
// =============================================================================

import { ATTENDANCE_STATUS_CONFIG, ATTENDANCE_TYPE_CONFIG } from "@/src/domain/Attendance";
import { UserGroupIcon } from "@heroicons/react/24/outline";
import React from "react";

export const StatusChip = React.memo(({ status }: { status: keyof typeof ATTENDANCE_STATUS_CONFIG }) => {
  const config = ATTENDANCE_STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor} border ${config.borderColor}`}>
      <span className="text-sm">{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
});

StatusChip.displayName = 'StatusChip';

export const TypeChip = React.memo(({ type }: { type: 'check_in' | 'check_out' }) => {
  const config = ATTENDANCE_TYPE_CONFIG[type];
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}>
      {config.label}
    </span>
  );
});

TypeChip.displayName = 'TypeChip';

interface LoadingStateProps {
  message?: string;
}

export const LoadingState = React.memo(({ message = "Memuat data absensi..." }: LoadingStateProps) => (
  <div className="flex flex-col justify-center items-center py-16 space-y-4">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    <div className="text-center space-y-2">
      <div className="text-gray-700 font-medium">{message}</div>
      <div className="text-sm text-gray-500">Silakan tunggu sebentar</div>
    </div>
  </div>
));

LoadingState.displayName = 'LoadingState';

export const EmptyState = React.memo(({ 
  title, 
  description, 
  icon: Icon = UserGroupIcon,
  action
}: { 
  title: string; 
  description: string; 
  icon?: React.ComponentType<any>;
  action?: React.ReactNode;
}) => (
  <div className="text-center py-12 px-4">
    <div className="flex justify-center mb-4">
      <div className="p-4 bg-gray-100 rounded-full">
        <Icon className="w-12 h-12 text-gray-400" />
      </div>
    </div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-sm text-gray-600 max-w-sm mx-auto mb-4">{description}</p>
    {action}
  </div>
));

EmptyState.displayName = 'EmptyState';

export const MobileCard = React.memo(({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-4 ${className}`}>
    {children}
  </div>
));

MobileCard.displayName = 'MobileCard';