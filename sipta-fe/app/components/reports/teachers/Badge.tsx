
// =============================================================================
// CUSTOM BADGE COMPONENT
// =============================================================================

import React from "react";

export const Badge: React.FC<{
  children: React.ReactNode;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'default';
  variant?: 'solid' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
}> = ({ 
  children, 
  color = 'default', 
  variant = 'solid',
  size = 'md',
  className = ''
}) => {
  const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
  
  const colorClasses = {
    primary: {
      solid: 'bg-blue-100 text-blue-800',
      outline: 'border border-blue-200 text-blue-700'
    },
    secondary: {
      solid: 'bg-purple-100 text-purple-800',
      outline: 'border border-purple-200 text-purple-700'
    },
    success: {
      solid: 'bg-green-100 text-green-800',
      outline: 'border border-green-200 text-green-700'
    },
    warning: {
      solid: 'bg-yellow-100 text-yellow-800',
      outline: 'border border-yellow-200 text-yellow-700'
    },
    danger: {
      solid: 'bg-red-100 text-red-800',
      outline: 'border border-red-200 text-red-700'
    },
    default: {
      solid: 'bg-gray-100 text-gray-800',
      outline: 'border border-gray-200 text-gray-700'
    }
  };

  return (
    <span className={`
      ${baseClasses}
      ${colorClasses[color][variant]}
      ${className}
    `}>
      {children}
    </span>
  );
};