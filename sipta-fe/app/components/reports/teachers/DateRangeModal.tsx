"use client";

import { useState, useEffect } from "react";
import { CalendarIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { formatDateDDMMYYYY } from "@/src/utils/date";

interface DateRangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (startDate: string, endDate: string) => void;
  initialStartDate: string;
  initialEndDate: string;
}

export const DateRangeModal: React.FC<DateRangeModalProps> = ({
  isOpen,
  onClose,
  onApply,
  initialStartDate,
  initialEndDate,
}) => {
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStartDate(initialStartDate);
      setEndDate(initialEndDate);
      setError(null);
    }
  }, [isOpen, initialStartDate, initialEndDate]);

  const handleApply = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      setError("Tanggal mulai tidak boleh lebih besar dari tanggal akhir");
      return;
    }

    // Validasi maksimal range (contoh: 31 hari)
    const maxDays = 31;
    const daysDiff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff > maxDays) {
      setError(`Maksimal range adalah ${maxDays} hari`);
      return;
    }

    onApply(startDate, endDate);
  };

  if (!isOpen) return null;

  const formatDisplayDate = (dateString: string) => {
    return formatDateDDMMYYYY(dateString);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CalendarIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Pilih Periode</h3>
              <p className="text-sm text-gray-500">Tentukan rentang tanggal yang diinginkan</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Mulai
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                max={endDate}
              />
              <p className="mt-1 text-xs text-gray-500">
                {formatDisplayDate(startDate)}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Akhir
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min={startDate}
              />
              <p className="mt-1 text-xs text-gray-500">
                {formatDisplayDate(endDate)}
              </p>
            </div>
          </div>

          {/* Preview Range */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-1">Preview Periode:</p>
            <p className="text-sm text-gray-600">
              {formatDisplayDate(startDate)} - {formatDisplayDate(endDate)}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleApply}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Terapkan
          </button>
        </div>
      </div>
    </div>
  );
};
