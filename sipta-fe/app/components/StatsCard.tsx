"use client";
import { ReactElement } from "react";

interface StatsCardProps {
  icon: ReactElement;
  label: string;
  value: string | number;
  color: string;
  subtitle?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ 
  icon, 
  label, 
  value, 
  color, 
  subtitle 
}) => (
  <div className={`bg-white rounded-2xl p-4 shadow-lg border-l-4 ${color} hover:shadow-xl transition-all duration-300`}>
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-600">{label}</p>
        <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
      <div className="p-2 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
        {icon}
      </div>
    </div>
  </div>
);

export default StatsCard;