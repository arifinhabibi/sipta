import React, { useState } from 'react';
import { AcademicYear } from '@/src/domain/AcademicYearEntity';
import { CalendarDaysIcon, CheckIcon, ArrowUpIcon } from '@heroicons/react/24/outline';

interface AcademicYearModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSetActive: (id: string) => void;
  academicYears: AcademicYear[];
  activeAcademicYearId?: string;
  canManage: boolean;
}

const AcademicYearModal: React.FC<AcademicYearModalProps> = ({
  isOpen,
  onClose,
  onSetActive,
  academicYears,
  activeAcademicYearId,
  canManage
}) => {
  const [selectedYearId, setSelectedYearId] = useState<string | undefined>(activeAcademicYearId);

  if (!isOpen) return null;

  const handleSetActive = () => {
    if (selectedYearId) {
      onSetActive(selectedYearId);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <CalendarDaysIcon className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Pengaturan Tahun Akademik
                </h3>
                <p className="text-sm text-gray-600">
                  Pilih tahun akademik aktif untuk mengontrol fitur naik kelas
                </p>
              </div>
            </div>
          </div>

          {/* Information Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <ArrowUpIcon className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">Fitur Naik Kelas</h4>
                <p className="text-blue-700 text-sm mt-1">
                  Fitur naik kelas hanya akan aktif jika:
                </p>
                <ul className="text-blue-700 text-sm mt-2 list-disc list-inside space-y-1">
                  <li>Tahun akademik aktif memiliki periode "Genap"</li>
                  <li>Status tahun akademik aktif adalah "Aktif"</li>
                  <li>User memiliki role "Admin"</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Academic Years List */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Daftar Tahun Akademik
            </h4>
            
            {academicYears.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <CalendarDaysIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">Belum ada tahun akademik</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                {academicYears.map((year) => (
                  <div
                    key={year.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                      selectedYearId === year.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    } ${year.is_active ? 'ring-2 ring-green-200' : ''}`}
                    onClick={() => setSelectedYearId(year.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="font-semibold text-gray-900">{year.name}</h5>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            year.periode === 'genap'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {year.periode === 'genap' ? 'Genap' : 'Ganjil'}
                          </span>
                          {year.is_active && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              Aktif
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {formatDate(year.start_periode)} - {formatDate(year.end_periode)}
                        </p>
                      </div>
                      
                      <div className="ml-4">
                        {selectedYearId === year.id ? (
                          <CheckIcon className="w-5 h-5 text-blue-600" />
                        ) : (
                          <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                        )}
                      </div>
                    </div>
                    
                    {year.is_active && year.periode === 'genap' && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                          <ArrowUpIcon className="w-3 h-3 mr-1" />
                          Fitur Naik Kelas Tersedia
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Selected Year Info */}
          {selectedYearId && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-medium text-gray-900">Tahun Akademik Terpilih</h5>
                  <p className="text-sm text-gray-600">
                    {academicYears.find(y => y.id === selectedYearId)?.name} - 
                    Periode {academicYears.find(y => y.id === selectedYearId)?.periode}
                  </p>
                </div>
                {academicYears.find(y => y.id === selectedYearId)?.periode === 'genap' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    <ArrowUpIcon className="w-3 h-3 mr-1" />
                    Naik Kelas Tersedia
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSetActive}
              disabled={!selectedYearId || !canManage || selectedYearId === activeAcademicYearId}
              className={`flex-1 py-2.5 px-4 rounded-lg text-white transition-colors duration-200 ${
                selectedYearId && canManage && selectedYearId !== activeAcademicYearId
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              Aktifkan Tahun Ajaran
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcademicYearModal;