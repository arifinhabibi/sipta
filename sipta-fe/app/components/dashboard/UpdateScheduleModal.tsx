// components/schedules/UpdateStatusModal.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  CheckCircleIcon,
  XCircleIcon,
  HeartIcon,
  DocumentTextIcon,
  UserIcon,
  BuildingLibraryIcon,
  ClockIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useScheduleStore } from '@/src/state/ScheduleStore';

interface UpdateStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: any;
  onSuccess: () => void;
}

const UpdateStatusModal: React.FC<UpdateStatusModalProps> = ({
  isOpen,
  onClose,
  schedule,
  onSuccess
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('present');
  const [notes, setNotes] = useState('');
  const [currentStatus, setCurrentStatus] = useState<string>('pending');
  const {updateAttendanceStatus} = useScheduleStore();

  useEffect(() => {
    if (schedule) {
      // Get current status from schedule
      const attendances = schedule?.teacher_attendances ?? [];
      const lastAttendance = attendances[attendances.length - 1];
      if (lastAttendance) {
        setCurrentStatus(lastAttendance.status);
        setSelectedStatus(lastAttendance.status);
        setNotes(lastAttendance.notes || '');
      }
    }
  }, [schedule]);

  if (!isOpen || !schedule) return null;

  const statusOptions = [
    {
      value: 'present',
      label: 'Hadir',
      description: 'Guru hadir sesuai jadwal',
      icon: CheckCircleIcon,
      color: 'bg-green-100 text-green-700 border-green-300',
      activeColor: 'bg-green-500 text-white border-green-600'
    },
    {
      value: 'absent',
      label: 'Tidak Hadir',
      description: 'Guru tidak hadir tanpa keterangan',
      icon: XCircleIcon,
      color: 'bg-red-100 text-red-700 border-red-300',
      activeColor: 'bg-red-500 text-white border-red-600'
    },
    {
      value: 'sick',
      label: 'Sakit',
      description: 'Guru tidak hadir karena sakit',
      icon: HeartIcon,
      color: 'bg-purple-100 text-purple-700 border-purple-300',
      activeColor: 'bg-purple-500 text-white border-purple-600'
    },
    {
      value: 'permission',
      label: 'Izin',
      description: 'Guru tidak hadir dengan izin',
      icon: DocumentTextIcon,
      color: 'bg-blue-100 text-blue-700 border-blue-300',
      activeColor: 'bg-blue-500 text-white border-blue-600'
    }
  ];

  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      // Call API to update status
      // Anda perlu menambahkan fungsi ini di store
      await updateAttendanceStatus({
        schedule_id: schedule.id,
        status: selectedStatus,
        notes: notes.trim() || null
      });
      
      toast.success(`Status berhasil diubah menjadi ${statusOptions.find(opt => opt.value === selectedStatus)?.label}`);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error(error.message || 'Gagal mengupdate status');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedOption = statusOptions.find(opt => opt.value === selectedStatus);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <DocumentTextIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Update Status Kehadiran</h3>
                <p className="text-sm text-gray-600">Pilih status kehadiran untuk jadwal ini</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Schedule Info */}
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Detail Jadwal</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  <span>
                    {new Date(schedule.date).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-4 w-4" />
                  <span>{schedule.start_time?.substring(0, 5)} - {schedule.end_time?.substring(0, 5)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4" />
                  <span>{schedule.teacher?.full_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <BuildingLibraryIcon className="h-4 w-4" />
                  <span>{schedule.classroom?.name}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Status Saat Ini</h4>
              {currentStatus === 'pending' ? (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-800 rounded-full text-sm">
                  <ClockIcon className="h-4 w-4" />
                  Belum Diupdate
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg">
                  {React.createElement(statusOptions.find(opt => opt.value === currentStatus)?.icon || CheckCircleIcon, { className: "h-5 w-5" })}
                  <div>
                    <div className="font-medium text-gray-900">
                      {statusOptions.find(opt => opt.value === currentStatus)?.label || currentStatus}
                    </div>
                    <div className="text-xs text-gray-500">
                      Terakhir diupdate
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status Selection */}
        <div className="p-6 border-b border-gray-200">
          <h4 className="font-medium text-gray-900 mb-4">Pilih Status Baru</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {statusOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = selectedStatus === option.value;
              
              return (
                <button
                  key={option.value}
                  onClick={() => setSelectedStatus(option.value)}
                  className={`p-4 rounded-lg border-2 flex flex-col items-center justify-center transition-all ${
                    isSelected ? option.activeColor : `${option.color} hover:opacity-90`
                  }`}
                >
                  <Icon className={`h-6 w-6 mb-2 ${isSelected ? 'text-white' : ''}`} />
                  <span className={`font-medium ${isSelected ? 'text-white' : ''}`}>
                    {option.label}
                  </span>
                  <span className={`text-xs mt-1 text-center ${isSelected ? 'text-white' : 'text-gray-600'}`}>
                    {option.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Notes */}
        <div className="p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Catatan (Opsional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            placeholder="Tambahkan catatan atau keterangan tentang status kehadiran..."
          />
          
          <div className="mt-2 text-xs text-gray-500">
            Contoh: "Izin keluarga", "Sakit demam", "Mendadak ada keperluan", dll.
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6">
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium disabled:opacity-50"
            >
              Batal
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`px-4 py-2 ${selectedOption?.activeColor} text-white rounded-lg transition-colors font-medium disabled:opacity-50 flex items-center gap-2`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Memproses...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-4 w-4" />
                  Update Status
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateStatusModal;