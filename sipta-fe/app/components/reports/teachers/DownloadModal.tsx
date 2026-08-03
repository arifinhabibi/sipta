

// =============================================================================
// DOWNLOAD MODAL COMPONENT
// =============================================================================

import { ModalBody, ModalFooter, ModalHeader } from "@heroui/react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { DocumentArrowDownIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

export const DownloadModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onDownload: (type: 'daily' | 'monthly' | 'custom', dateRange?: { start: string; end: string }) => void;
  academicYear: string;
  isLoading?: boolean;
}> = ({ isOpen, onClose, onDownload, academicYear, isLoading = false }) => {
  const [downloadType, setDownloadType] = useState<'daily' | 'monthly' | 'custom'>('daily');
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const handleDownload = () => {
    onDownload(downloadType, downloadType === 'custom' ? dateRange : undefined);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalHeader>
        <h3 className="text-lg font-semibold text-gray-900">Unduh Laporan</h3>
      </ModalHeader>
      <ModalBody>
        <div className="space-y-4">
          {/* Download Type Select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jenis Laporan
            </label>
            <select
              value={downloadType}
              onChange={(e) => setDownloadType(e.target.value as 'daily' | 'monthly' | 'custom')}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
            >
              <option value="daily">Laporan Harian</option>
              <option value="monthly">Laporan Bulanan</option>
              <option value="custom">Periode Kustom</option>
            </select>
          </div>

          {downloadType === 'custom' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tanggal Mulai
                </label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tanggal Selesai
                </label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                />
              </div>
            </div>
          )}

          <div className="text-sm text-gray-500 mt-4 p-3 bg-gray-50 rounded-lg">
            Tahun Akademik: <strong>{academicYear}</strong>
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <div className="flex gap-3 justify-end">
          <Button
            variant="light"
            onClick={onClose}
            disabled={isLoading}
          >
            Batal
          </Button>
          <Button
            onClick={handleDownload}
            isLoading={isLoading}
            startContent={!isLoading ? <DocumentArrowDownIcon className="w-4 h-4" /> : undefined}
          >
            {isLoading ? 'Mengunduh...' : 'Unduh'}
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
};
