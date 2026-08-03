import React from "react";
import {
  XMarkIcon,
  DocumentDuplicateIcon,
  CheckIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import toast from "react-hot-toast";

interface CredentialModalProps {
  isOpen: boolean;
  onClose: () => void;
  credentials: {
    username: string;
    password: string;
  };
}

const CredentialModal: React.FC<CredentialModalProps> = ({
  isOpen,
  onClose,
  credentials,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      toast.success(
        `${field === "username" ? "Username" : "Password"} berhasil disalin!`
      );
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <DocumentDuplicateIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Login Credentials
              </h3>
              <p className="text-sm text-gray-500">
                Simpan informasi login ini
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 text-yellow-800">
              <ExclamationTriangleIcon className="h-5 w-5" />
              <p className="text-sm font-medium">
                Informasi ini hanya ditampilkan sekali!
              </p>
            </div>
            <p className="text-sm text-yellow-700 mt-2">
              Pastikan untuk menyimpan username dan password dengan aman.
            </p>
          </div>

          {/* Username Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={credentials.username}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 font-mono"
              />
              <button
                onClick={() =>
                  copyToClipboard(credentials.username, "username")
                }
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                {copiedField === "username" ? (
                  <CheckIcon className="h-4 w-4" />
                ) : (
                  <DocumentDuplicateIcon className="h-4 w-4" />
                )}
                <span>Salin</span>
              </button>
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={credentials.password}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 font-mono"
              />
              <button
                onClick={() =>
                  copyToClipboard(credentials.password, "password")
                }
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                {copiedField === "password" ? (
                  <CheckIcon className="h-4 w-4" />
                ) : (
                  <DocumentDuplicateIcon className="h-4 w-4" />
                )}
                <span>Salin</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default CredentialModal;
