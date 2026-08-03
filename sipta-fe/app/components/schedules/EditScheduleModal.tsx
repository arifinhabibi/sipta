// components/EditScheduleModal.tsx
import React, { useState, useEffect } from 'react';
import { XMarkIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useScheduleStore } from "@/src/state/ScheduleStore";
import { Subject, Classroom, Teacher, PayloadUpdateSchedules } from "@/src/domain/ScheduleEntity";
import toast from 'react-hot-toast';

interface EditScheduleModalProps {
  isOpen: boolean;
  schedule: any;
  subjects: Subject[];
  teachers: Teacher[]; // Tambahkan prop teachers
  onClose: () => void;
  onDelete: () => void;
}

export const EditScheduleModal: React.FC<EditScheduleModalProps> = ({
  isOpen,
  schedule,
  subjects,
  teachers, // Terima prop teachers
  onClose,
  onDelete
}) => {
  const { updateSchedule, fetchSchedules } = useScheduleStore();
  const [formData, setFormData] = useState<PayloadUpdateSchedules>({
    subject_id: '',
    classroom_id: '',
    teacher_id: '',
    date: '',
    start_time: '',
    end_time: '',
  });
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (schedule) {
      // Format waktu ke H:i (HH:mm)
      const formatTime = (time: string) => {
        if (!time) return '';
        const [hours, minutes] = time.split(':');
        return `${hours}:${minutes}`;
      };

      setFormData({
        subject_id: schedule.subject.id,
        classroom_id: schedule.classroom.id,
        teacher_id: schedule.teacher.id,
        date: schedule.date,
        start_time: formatTime(schedule.start_time),
        end_time: formatTime(schedule.end_time),
      });
      
      // Set classrooms dari schedule yang ada
      if (schedule.classroom) {
        setClassrooms([schedule.classroom]);
      }
    }
  }, [schedule]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedule) return;

    // Validasi form
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.subject_id) newErrors.subject_id = 'Mata pelajaran harus dipilih';
    if (!formData.teacher_id) newErrors.teacher_id = 'Guru pengajar harus dipilih';
    if (!formData.classroom_id) newErrors.classroom_id = 'Kelas harus dipilih';
    if (!formData.date) newErrors.date = 'Tanggal harus diisi';
    if (!formData.start_time) newErrors.start_time = 'Waktu mulai harus diisi';
    if (!formData.end_time) newErrors.end_time = 'Waktu selesai harus diisi';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Validasi waktu
    if (formData.start_time >= formData.end_time) {
      setErrors({ time: 'Waktu selesai harus setelah waktu mulai' });
      return;
    }

    setIsLoading(true);
    try {
      await updateSchedule(schedule.id, formData);
      fetchSchedules()
      toast.success("Data berhasil di ubah!")
      onClose();
    } catch (error) {
      console.error('Error updating schedule:', error);
      setErrors({ submit: 'Gagal mengupdate jadwal. Silakan coba lagi.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error ketika field diisi
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    // Jika subject berubah, reset teacher_id
    if (field === 'subject_id') {
      setFormData(prev => ({
        ...prev,
        teacher_id: ''
      }));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    handleChange(name, value);
  };

  if (!isOpen || !schedule) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Edit Jadwal</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Mata Pelajaran */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mata Pelajaran *
            </label>
            <select
              name="subject_id"
              value={formData.subject_id}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                errors.subject_id ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            >
              <option value="">Pilih Mata Pelajaran</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.code} - {subject.name}
                </option>
              ))}
            </select>
            {errors.subject_id && (
              <p className="mt-1 text-sm text-red-600">{errors.subject_id}</p>
            )}
          </div>

          {/* Guru Pengajar */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Guru Pengajar *
            </label>
            <select
              name="teacher_id"
              value={formData.teacher_id}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                errors.teacher_id ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            >
              <option value="">Pilih Guru</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.full_name} {teacher.degree && `(${teacher.degree})`}
                </option>
              ))}
            </select>
            {errors.teacher_id && (
              <p className="mt-1 text-sm text-red-600">{errors.teacher_id}</p>
            )}
          </div>

          {/* Kelas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kelas *
            </label>
            <select
              name="classroom_id"
              value={formData.classroom_id}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                errors.classroom_id ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            >
              <option value="">Pilih Kelas</option>
              {classrooms.map((classroom) => (
                <option key={classroom.id} value={classroom.id}>
                  {classroom.room_number} - {classroom.name}
                </option>
              ))}
            </select>
            {errors.classroom_id && (
              <p className="mt-1 text-sm text-red-600">{errors.classroom_id}</p>
            )}
          </div>

          {/* Tanggal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tanggal *
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                errors.date ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            />
            {errors.date && (
              <p className="mt-1 text-sm text-red-600">{errors.date}</p>
            )}
          </div>

          {/* Waktu */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Waktu Mulai *
              </label>
              <input
                type="time"
                name="start_time"
                value={formData.start_time}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                  errors.start_time || errors.time ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {errors.start_time && (
                <p className="mt-1 text-sm text-red-600">{errors.start_time}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Waktu Selesai *
              </label>
              <input
                type="time"
                name="end_time"
                value={formData.end_time}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                  errors.end_time || errors.time ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {errors.end_time && (
                <p className="mt-1 text-sm text-red-600">{errors.end_time}</p>
              )}
            </div>
          </div>
          
          {errors.time && (
            <p className="text-sm text-red-600">{errors.time}</p>
          )}

          {/* Error submit */}
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onDelete}
              className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors flex-1 justify-center"
              disabled={isLoading}
            >
              <TrashIcon className="h-4 w-4" />
              Hapus
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex-1 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};