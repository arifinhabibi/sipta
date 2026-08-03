
// =============================================================================
// CUSTOM BUTTON COMPONENT
// =============================================================================

export const Button: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'solid' | 'outline' | 'light';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'default';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  startContent?: React.ReactNode;
}> = ({ 
  children, 
  onClick, 
  variant = 'solid', 
  color = 'primary', 
  size = 'md', 
  disabled = false,
  isLoading = false,
  className = '',
  type = 'button',
  startContent
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const colorClasses = {
    primary: {
      solid: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
      outline: 'border border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500',
      light: 'bg-blue-100 text-blue-700 hover:bg-blue-200 focus:ring-blue-500'
    },
    secondary: {
      solid: 'bg-purple-600 hover:bg-purple-700 text-white focus:ring-purple-500',
      outline: 'border border-purple-600 text-purple-600 hover:bg-purple-50 focus:ring-purple-500',
      light: 'bg-purple-100 text-purple-700 hover:bg-purple-200 focus:ring-purple-500'
    },
    success: {
      solid: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500',
      outline: 'border border-green-600 text-green-600 hover:bg-green-50 focus:ring-green-500',
      light: 'bg-green-100 text-green-700 hover:bg-green-200 focus:ring-green-500'
    },
    warning: {
      solid: 'bg-yellow-600 hover:bg-yellow-700 text-white focus:ring-yellow-500',
      outline: 'border border-yellow-600 text-yellow-600 hover:bg-yellow-50 focus:ring-yellow-500',
      light: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 focus:ring-yellow-500'
    },
    danger: {
      solid: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
      outline: 'border border-red-600 text-red-600 hover:bg-red-50 focus:ring-red-500',
      light: 'bg-red-100 text-red-700 hover:bg-red-200 focus:ring-red-500'
    },
    default: {
      solid: 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500',
      outline: 'border border-gray-600 text-gray-600 hover:bg-gray-50 focus:ring-gray-500',
      light: 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500'
    }
  };

  const disabledClasses = 'opacity-50 cursor-not-allowed';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`
        ${baseClasses}
        ${sizeClasses[size]}
        ${colorClasses[color][variant]}
        ${disabled || isLoading ? disabledClasses : ''}
        ${className}
      `}
    >
      {isLoading && (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
      )}
      {startContent && !isLoading && <span className="mr-2">{startContent}</span>}
      {children}
    </button>
  );
};
