import React, { useState, useMemo } from 'react';
import { ChevronDownIcon, ChevronUpIcon, DocumentArrowDownIcon, EyeIcon } from '@heroicons/react/24/outline';
import { RadarPrism } from './RadarPrism';
import moment from 'moment';
import { PrismAxes, Schedule, Student } from '@/src/domain/ReportEntity';
import { formatDateTimeDDMMYYYY } from '@/src/utils/date';

interface StudentPerformanceCardProps {
  student: Student;
  prism: PrismAxes;
  schedules?: Schedule[];
  onGenerateReport?: (studentId: string) => void;
  onViewDetails?: (studentId: string) => void; // Tambahan untuk melihat detail lebih lanjut
}

export const StudentPerformanceCard: React.FC<StudentPerformanceCardProps> = React.memo(({
  student,
  prism,
  schedules = [],
  onGenerateReport,
  onViewDetails,
}) => {
  const [open, setOpen] = useState(false);

  // Optimasi: Hitung averageScore hanya sekali menggunakan useMemo
  const averageScore = useMemo(() => {
    const { knowledge, skill, attitude, creativity, discipline } = prism;
    return Math.round((knowledge + skill + attitude + creativity + discipline) / 5);
  }, [prism]);

  // Optimasi: Sort schedules berdasarkan tanggal terbaru
  const sortedSchedules = useMemo(() => {
    return [...schedules].sort((a, b) => moment(b.start).valueOf() - moment(a.start).valueOf());
  }, [schedules]);

  // Fungsi untuk toggle expand
  const toggleOpen = () => setOpen(!open);

  const performanceLabels: Record<keyof PrismAxes, string> = {
    knowledge: 'Pemahaman',
    skill: 'Tugas',
    attitude: 'Sikap',
    creativity: 'Kreativitas',
    discipline: 'Disiplin',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* Header Section: Responsif untuk mobile dan desktop */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Avatar dan Info Siswa */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            {student.fullname.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold text-gray-900 truncate" title={student.fullname}>
              {student.fullname}
            </h3>
            {student.nis && (
              <p className="text-sm text-gray-600 truncate">NIS: {student.nis}</p>
            )}
            <p className="text-sm text-gray-500">
              {schedules.length} sesi pembelajaran
            </p>
          </div>
        </div>

        {/* Radar Chart, Skor, dan Tombol Aksi */}
        <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
          <div className="flex items-center gap-3">
            <RadarPrism values={prism} size={70} />
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900">{averageScore}%</div>
              <div className="text-xs text-gray-500">Rata-rata</div>
            </div>
          </div>

          {/* Tombol Aksi: Expand, View Details, Download */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleOpen}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 p-2 rounded-md hover:bg-blue-50 transition-colors"
              aria-label={open ? "Tutup detail" : "Buka detail"}
            >
              {open ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
              <span className="hidden sm:inline">{open ? "Tutup" : "Detail"}</span>
            </button>
            {onViewDetails && (
              <button
                onClick={() => onViewDetails(student.id)}
                className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 p-2 rounded-md hover:bg-indigo-50 transition-colors"
                title="Lihat Detail Lengkap"
                aria-label="Lihat detail lengkap siswa"
              >
                <EyeIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Lihat</span>
              </button>
            )}
            {onGenerateReport && (
              <button
                onClick={() => onGenerateReport(student.id)}
                className="flex items-center gap-1 text-sm text-green-600 hover:text-green-800 p-2 rounded-md hover:bg-green-50 transition-colors"
                title="Unduh Laporan PDF"
                aria-label="Unduh laporan PDF"
              >
                <DocumentArrowDownIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Unduh</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Section: Detail Prism dan Sesi */}
      {open && (
        <div className="mt-6 space-y-6 border-t border-gray-100 pt-4">
          {/* Detail Prism Axes */}
          <div>
            <h4 className="text-base font-semibold text-gray-800 mb-3">Detail Performa</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {Object.entries(prism).map(([key, value]) => (
                <div key={key} className="text-center p-3 bg-gray-50 rounded-lg border">
                  <div className="text-sm font-medium text-gray-700 mb-1">
                    {performanceLabels[key as keyof PrismAxes] ?? key}
                  </div>
                  <div className="text-lg font-bold text-blue-600">{value}%</div>
                  {/* Progress Bar Sederhana */}
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${value}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sesi Pembelajaran Terbaru */}
          {sortedSchedules.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-base font-semibold text-gray-800">Sesi Terbaru</h4>
                {sortedSchedules.length > 2 && (
                  <button
                    onClick={() => onViewDetails?.(student.id)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Lihat Semua ({sortedSchedules.length})
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {sortedSchedules.slice(0, 3).map((schedule) => (
                  <div key={schedule.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate" title={schedule.title}>
                        {schedule.title}
                      </div>
                      <div className="text-sm text-gray-600 truncate">
                        {formatDateTimeDDMMYYYY(schedule.start)}
                      </div>
                    </div>
                    <div className={`text-xs px-3 py-1 rounded-full font-medium flex-shrink-0 ml-3 ${
                      schedule.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {schedule.status === 'completed' ? 'Selesai' : 'Terjadwal'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Jika tidak ada sesi */}
          {sortedSchedules.length === 0 && (
            <div className="text-center text-gray-500 py-4">
              Tidak ada sesi pembelajaran yang tersedia.
            </div>
          )}
        </div>
      )}
    </div>
  );
});
