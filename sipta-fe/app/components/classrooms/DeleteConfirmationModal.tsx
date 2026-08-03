"use client";

import React from 'react';
import { XMarkIcon, TrashIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  type: string;
  name: string;
  canDelete: boolean;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  type,
  name,
  canDelete
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="mt-3 text-lg font-medium text-gray-900">
            Hapus {type === 'classroom' ? 'Kelas' : 'Siswa'}
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Apakah Anda yakin ingin menghapus {type === 'classroom' ? 'kelas' : 'siswa'} <strong>{name}</strong>? Tindakan ini tidak dapat dibatalkan.
          </p>
        </div>
        <div className="mt-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <XMarkIcon className="w-4 h-4" />
            Batal
          </button>
          {canDelete && (
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <TrashIcon className="w-4 h-4" />
              Hapus
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;