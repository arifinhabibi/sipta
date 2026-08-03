
// =============================================================================
// CUSTOM MODAL COMPONENTS - IMPROVED VERSION
// =============================================================================

export const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}> = ({ isOpen, onClose, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Background overlay - transparan */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-30 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal panel - di-center */}
      <div className={`relative w-full ${sizeClasses[size]} bg-white rounded-xl shadow-2xl transform transition-all`}>
        {children}
      </div>
    </div>
  );
};

export const ModalHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`border-b border-gray-200 p-6 ${className}`}>
    {children}
  </div>
);

export const ModalBody: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`p-6 ${className}`}>
    {children}
  </div>
);

export const ModalFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`border-t border-gray-200 p-6 ${className}`}>
    {children}
  </div>
);
