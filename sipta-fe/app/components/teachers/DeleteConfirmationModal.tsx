"use client";
import React from "react";
import { XMarkIcon, TrashIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  name: string;
  canDelete: boolean;
}

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  name,
  canDelete,
}: DeleteConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="mt-3 text-lg font-medium text-gray-900">Hapus Guru</h3>
          <p className="mt-2 text-sm text-gray-500">
            Apakah Anda yakin ingin menghapus guru <strong>{name}</strong>?  
            Tindakan ini tidak dapat dibatalkan.
          </p>
        </div>
        <div className="mt-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg"
          >
            <XMarkIcon className="w-4 h-4 inline mr-1" /> Batal
          </button>
          {canDelete && (
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg"
            >
              <TrashIcon className="w-4 h-4 inline mr-1" /> Hapus
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
