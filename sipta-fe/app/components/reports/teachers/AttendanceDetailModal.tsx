
// =============================================================================
// ATTENDANCE DETAIL MODAL - IMPROVED VERSION WITH SCROLL
// =============================================================================

import { ClockIcon, MapPinIcon, PhotoIcon, TableCellsIcon, UserGroupIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Button } from "./Button";
import { LocationMap } from "./LocationMap";
import { Attendance } from "@/src/domain/Attendance";
import { StatusChip, TypeChip } from "./ReuseComponent";
import { formatDate } from "../TeacherAttendancePanel";
import { useMemo } from "react";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "./Modal";

export const AttendanceDetailModal: React.FC<{
  attendance: Attendance | null;
  isOpen: boolean;
  onClose: () => void;
}> = ({ attendance, isOpen, onClose }) => {
  const MapComponent = useMemo(() => {
    if (!attendance?.latitude || !attendance?.longitude) return null;
    
    return (
      <LocationMap
        latitude={attendance.latitude} 
        longitude={attendance.longitude} 
      />
    );
  }, [attendance?.latitude, attendance?.longitude]);

  const getPhotoUrl = (photoPath: string) => {
    if (!photoPath) return null;
    const assetDomain = process.env.NEXT_PUBLIC_ASSET || '';
    
    if (photoPath.startsWith('http')) {
      return photoPath;
    }
    
    if (photoPath.startsWith('/')) {
      return `${assetDomain}${photoPath}`;
    }
    
    return `${assetDomain}/${photoPath}`;
  };

  const photoUrl = attendance?.real_time_photo ? getPhotoUrl(attendance.real_time_photo) : null;

  if (!attendance) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <div className="max-h-[80vh] overflow-y-auto">
        <ModalHeader className="sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Detail Kehadiran</h3>
              <div className="text-sm font-normal text-gray-600 mt-1">
                {attendance.teacher_name}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </ModalHeader>
        <ModalBody>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Informasi Dasar */}
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <UserGroupIcon className="w-5 h-5" />
                  Informasi Kehadiran
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Status:</span>
                    <StatusChip status={attendance.status} />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Tipe:</span>
                    <TypeChip type={attendance.type} />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tanggal:</span>
                    <span className="font-medium text-gray-900">{formatDate(attendance.schedule_date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Waktu Jadwal:</span>
                    <span className="font-medium text-gray-900">{attendance.schedule_time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Jam Masuk:</span>
                    <span className="font-medium text-gray-900">{new Date(attendance.created_at).toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>

              {/* Informasi Mengajar */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <TableCellsIcon className="w-5 h-5" />
                  Informasi Mengajar
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mata Pelajaran:</span>
                    <span className="font-medium text-gray-900 text-right max-w-[150px] truncate" title={attendance.subject_name}>
                      {attendance.subject_name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Kelas:</span>
                    <span className="font-medium text-gray-900">{attendance.classroom_name}</span>
                  </div>
                  
                </div>
              </div>

            </div>

            {/* Foto dan Lokasi */}
            <div className="space-y-6">
              {photoUrl && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <PhotoIcon className="w-5 h-5" />
                    Foto Real-time
                  </h4>
                  <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                    <div className="h-48 flex items-center justify-center">
                      <img
                        src={photoUrl}
                        alt={`Foto absensi ${attendance.teacher_name}`}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className="hidden flex-col items-center justify-center text-gray-400 p-4">
                        <PhotoIcon className="w-12 h-12 mb-2" />
                        <span className="text-sm text-center">Gagal memuat foto</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {(attendance.latitude && attendance.longitude) && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <MapPinIcon className="w-5 h-5" />
                    Lokasi Absensi
                  </h4>
                  {MapComponent}
                  {attendance.gmaps && (
                    <a
                      href={attendance.gmaps}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                      <MapPinIcon className="w-4 h-4 mr-2" />
                      Buka di Google Maps
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </ModalBody>
        <ModalFooter className="sticky bottom-0 bg-white">
          <div className="flex justify-end">
            <Button variant="light" onClick={onClose}>
              Tutup
            </Button>
          </div>
        </ModalFooter>
      </div>
    </Modal>
  );
};
