"use client";

import React, { useState, useEffect } from 'react';
import { XMarkIcon, AcademicCapIcon } from '@heroicons/react/24/outline';
import { Classroom } from '@/src/domain/ClassroomEntity';
import { Teacher } from '@/src/domain/TeacherEntity';
import toast from 'react-hot-toast';

interface ClassroomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  classroom?: Classroom;
  teachers: Teacher[];
  canEdit: boolean;
}

const ClassroomModal: React.FC<ClassroomModalProps> = ({
  isOpen,
  onClose,
  onSave,
  classroom,
  teachers,
  canEdit
}) => {
  const [formData, setFormData] = useState({
    name: '',
    room_number: '',
    capacity: 25,
    description: '',
    teacher_id: ''
  });

  useEffect(() => {
    if (classroom) {
      setFormData({
        name: classroom.name,
        room_number: classroom.room_number,
        capacity: classroom.capacity,
        description: classroom.description,
        teacher_id: classroom.teacher_id
      });
    } else {
      setFormData({
        name: '',
        room_number: '',
        capacity: 25,
        description: '',
        teacher_id: teachers[0]?.id || ''
      });
    }
  }, [classroom, teachers]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      toast.error("Anda tidak memiliki akses untuk mengedit kelas");
      return;
    }
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              {classroom ? 'Edit Kelas' : 'Tambah Kelas'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {!canEdit && classroom && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">
                Anda tidak memiliki akses untuk mengedit data kelas
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Kelas
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                placeholder="Contoh: Awaliyah Sore"
                disabled={classroom && !canEdit}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kode Ruangan
              </label>
              <input
                type="text"
                required
                value={formData.room_number}
                onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                placeholder="Contoh: AW-SR"
                disabled={classroom && !canEdit}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kapasitas
              </label>
              <input
                type="number"
                required
                min="1"
                max="50"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                disabled={classroom && !canEdit}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Guru Pengajar
              </label>
              <select
                required
                value={formData.teacher_id}
                onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                disabled={classroom && !canEdit}
              >
                <option value="">Pilih Guru</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.full_name} - {teacher.degree}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Deskripsi
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                placeholder="Deskripsi kelas..."
                disabled={classroom && !canEdit}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <XMarkIcon className="w-4 h-4" />
                Batal
              </button>
              {(canEdit || !classroom) && (
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <AcademicCapIcon className="w-4 h-4" />
                  {classroom ? 'Update' : 'Simpan'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ClassroomModal;