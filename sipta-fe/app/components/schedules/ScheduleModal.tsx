// components/ScheduleModal.tsx
import React, { useState, useEffect } from 'react'
import { 
  XMarkIcon, 
  TrashIcon, 
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline'

interface Classroom {
  id: string
  name: string
  room_number: string
  teacher: {
    full_name: string
    phone: string
  }
}

interface Schedule {
  id?: string
  subject: string
  classroom: Classroom
  day: string
  startTime: string
  endTime: string
  notes?: string
}

interface ScheduleModalProps {
  schedule?: Schedule | null
  classrooms: Classroom[]
  subjects: string[]
  onSave: (schedule: Omit<Schedule, 'id'>) => void
  onDelete: (scheduleId: string) => void
  onClose: () => void
}

const days = [
  { value: 'Monday', label: 'Senin' },
  { value: 'Tuesday', label: 'Selasa' },
  { value: 'Wednesday', label: 'Rabu' },
  { value: 'Thursday', label: 'Kamis' },
  { value: 'Friday', label: 'Jumat' }
]

export default function ScheduleModal({ 
  schedule, 
  classrooms, 
  subjects, 
  onSave, 
  onDelete, 
  onClose 
}: ScheduleModalProps) {
  const [formData, setFormData] = useState({
    subject: '',
    classroomId: '',
    day: 'Monday',
    startTime: '15:00',
    endTime: '16:30',
    notes: ''
  })
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (schedule) {
      setFormData({
        subject: schedule.subject,
        classroomId: schedule.classroom.id,
        day: schedule.day,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        notes: schedule.notes || ''
      })
    }
  }, [schedule])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const selectedClassroom = classrooms.find(c => c.id === formData.classroomId)
    if (!selectedClassroom) return

    const scheduleData = {
      subject: formData.subject,
      classroom: selectedClassroom,
      day: formData.day,
      startTime: formData.startTime,
      endTime: formData.endTime,
      notes: formData.notes
    }

    onSave(scheduleData)
  }

  const handleDelete = () => {
    if (schedule?.id) {
      onDelete(schedule.id)
    }
  }

  const selectedClassroom = classrooms.find(c => c.id === formData.classroomId)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {schedule ? 'Edit Jadwal' : 'Tambah Jadwal'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mata Pelajaran *
            </label>
            <select
              required
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Pilih Mata Pelajaran</option>
              {subjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>

          {/* Classroom */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kelas *
            </label>
            <select
              required
              value={formData.classroomId}
              onChange={(e) => setFormData(prev => ({ ...prev, classroomId: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Pilih Kelas</option>
              {classrooms.map(classroom => (
                <option key={classroom.id} value={classroom.id}>
                  {classroom.name} - {classroom.room_number}
                </option>
              ))}
            </select>
          </div>

          {/* Teacher Info */}
          {selectedClassroom && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Guru Pengampu:</strong> {selectedClassroom.teacher.full_name}
              </p>
              <p className="text-sm text-blue-800">
                <strong>Kontak:</strong> {selectedClassroom.teacher.phone}
              </p>
            </div>
          )}

          {/* Day */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hari *
            </label>
            <select
              required
              value={formData.day}
              onChange={(e) => setFormData(prev => ({ ...prev, day: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {days.map(day => (
                <option key={day.value} value={day.value}>{day.label}</option>
              ))}
            </select>
          </div>

          {/* Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jam Mulai *
              </label>
              <input
                type="time"
                required
                value={formData.startTime}
                onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jam Selesai *
              </label>
              <input
                type="time"
                required
                value={formData.endTime}
                onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Catatan (Opsional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Contoh: Ujian minggu depan..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            {schedule && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <TrashIcon className="h-4 w-4" />
                Hapus
              </button>
            )}
            <button
              type="submit"
              className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg transition-colors"
            >
              {schedule ? 'Simpan Perubahan' : 'Tambah Jadwal'}
            </button>
          </div>
        </form>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-60">
          <div className="bg-white rounded-lg max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Hapus Jadwal</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Yakin ingin menghapus jadwal {schedule?.subject} untuk {schedule?.classroom.name} pada {days.find(d => d.value === schedule?.day)?.label}, {schedule?.startTime}?
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}