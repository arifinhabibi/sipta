// teachers/PrintMonthlyModal.tsx
"use client";

import { useState, useEffect } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Button } from "./Button";

interface PrintMonthlyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPrint: (month: string, year: string) => Promise<void>;
  academicYear: any;
  isLoading: boolean;
}

export const PrintMonthlyModal: React.FC<PrintMonthlyModalProps> = ({
  isOpen,
  onClose,
  onPrint,
  academicYear,
  isLoading,
}) => {
  // State untuk bulan dan tahun
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isPrinting, setIsPrinting] = useState(false);

  // Format bulan dan tahun untuk display
  const getFormattedMonthYear = () => {
    return currentDate.toLocaleDateString("id-ID", {
      month: "long",
      year: "numeric",
    });
  };

  // Format untuk API (YYYY-MM)
  const getApiFormat = () => {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    return { month, year: year.toString() };
  };

  // Navigasi ke bulan sebelumnya
  const handlePrevMonth = () => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };

  // Navigasi ke bulan berikutnya
  const handleNextMonth = () => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };

  // Reset ke bulan saat ini
  const handleReset = () => {
    setCurrentDate(new Date());
  };

  // Handle print/download
  const handlePrint = async () => {
    try {
      setIsPrinting(true);
      const { month, year } = getApiFormat();
      await onPrint(month, year);
      onClose();
    } catch (error) {
      console.error("Print error:", error);
    } finally {
      setIsPrinting(false);
    }
  };

  // Reset date saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      setCurrentDate(new Date());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold leading-6 text-gray-900">
                Download Laporan Bulanan
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Pilih bulan untuk download laporan
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 rounded-md hover:text-gray-500 hover:bg-gray-100"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Tahun Akademik Info */}
          <div className="p-3 mb-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-700">
              Tahun Akademik:{" "}
              <span className="font-semibold">{academicYear.name}</span>
            </p>
            <p className="text-xs text-gray-500">{academicYear.periode}</p>
          </div>

          {/* Month Selector */}
          <div className="mb-6">
            <div className="flex items-center justify-center mb-4">
              <button
                onClick={handlePrevMonth}
                disabled={isLoading || isPrinting}
                className="p-2 text-gray-600 rounded-full hover:bg-gray-100 disabled:opacity-50"
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </button>

              <div className="flex-1 mx-4 text-center">
                <div className="text-xl font-bold text-gray-900">
                  {getFormattedMonthYear()}
                </div>
                <div className="text-sm text-gray-500">
                  {currentDate.toLocaleDateString("id-ID", {
                    month: "short",
                    year: "numeric",
                  })}
                </div>
              </div>

              <button
                onClick={handleNextMonth}
                disabled={isLoading || isPrinting}
                className="p-2 text-gray-600 rounded-full hover:bg-gray-100 disabled:opacity-50"
              >
                <ChevronRightIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Calendar grid preview (optional) */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {["M", "S", "S", "R", "K", "J", "S"].map((day) => (
                <div key={day} className="text-xs font-medium text-gray-500 py-1">
                  {day}
                </div>
              ))}
              {Array.from({ length: new Date(
                currentDate.getFullYear(),
                currentDate.getMonth() + 1,
                0
              ).getDate() }).map((_, i) => (
                <div
                  key={i}
                  className={`text-sm py-1 ${
                    i + 1 === new Date().getDate() &&
                    currentDate.getMonth() === new Date().getMonth() &&
                    currentDate.getFullYear() === new Date().getFullYear()
                      ? "bg-blue-100 text-blue-600 rounded-full font-bold"
                      : "text-gray-700"
                  }`}
                >
                  {i + 1}
                </div>
              ))}
            </div>

            {/* Reset to current month */}
            <div className="mt-4 text-center">
              <button
                onClick={handleReset}
                disabled={
                  currentDate.getMonth() === new Date().getMonth() &&
                  currentDate.getFullYear() === new Date().getFullYear()
                }
                className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                Kembali ke bulan ini
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              disabled={isPrinting}
              className="flex-1"
            >
              Batal
            </Button>
            <Button
              onClick={handlePrint}
              isLoading={isPrinting}
              disabled={isPrinting}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isPrinting ? "Mendownload..." : "Download"}
            </Button>
          </div>

          {/* Information */}
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
            <p className="text-xs text-yellow-700">
              ⚠️ File akan didownload dalam format Excel (.xlsx)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};