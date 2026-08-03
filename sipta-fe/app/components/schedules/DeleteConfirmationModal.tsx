import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";


export const DeleteConfirmationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  scheduleName: string;
  isLoading?: boolean;
}> = ({ isOpen, onClose, onConfirm, scheduleName, isLoading = false }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="flex items-center gap-4 p-6 border-b border-gray-200">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">
              Hapus Jadwal
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Apakah Anda yakin ingin menghapus jadwal ini?
            </p>
          </div>
        </div>

        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800 font-medium">{scheduleName}</p>
            <p className="text-xs text-red-600 mt-1">
              Tindakan ini tidak dapat dibatalkan
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Menghapus...
              </>
            ) : (
              "Hapus Jadwal"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};