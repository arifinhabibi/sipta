"use client";

import React, { useMemo, useState } from 'react';
import {
  AcademicCapIcon,
  ChevronRightIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { Classroom } from '@/src/domain/ClassroomEntity';

type FilterMode = 'all' | 'at-risk' | 'healthy';

interface ClassroomListScreenProps {
  classrooms: Classroom[];
  canEditClassroom: boolean;
  canEditStudent: boolean;
  canAddClassroom: boolean;
  onSelectClassroom: (classroom: Classroom) => void;
  onEditClassroom: (classroom: Classroom) => void;
  onDeleteClassroom: (classroom: Classroom) => void;
  onAddStudent: (classroomId: string) => void;
  onOpenUpgradeModal?: (classroom: Classroom) => void;
  canUpgradeClass?: boolean;
  isUpgradeEnabled?: boolean;
}

const getInitials = (value: string) =>
  value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'K';

const getAttendancePercent = (classroom: Classroom) => {
  if (!classroom.students?.length) {
    return null;
  }

  const presentCount = classroom.students.filter((student) => student.attendances?.status === 'present').length;
  return Math.round((presentCount / classroom.students.length) * 100);
};

const getAttendanceTone = (value: number | null) => {
  if (value === null) {
    return {
      badge: 'bg-slate-100 text-slate-600',
      text: 'text-slate-600',
      label: 'Belum ada data',
    };
  }

  if (value >= 85) {
    return {
      badge: 'bg-emerald-100 text-emerald-700',
      text: 'text-emerald-700',
      label: `${value}% hadir`,
    };
  }

  if (value >= 60) {
    return {
      badge: 'bg-amber-100 text-amber-700',
      text: 'text-amber-700',
      label: `${value}% hadir`,
    };
  }

  return {
    badge: 'bg-rose-100 text-rose-700',
    text: 'text-rose-700',
    label: `${value}% hadir`,
  };
};

const ClassroomListScreen: React.FC<ClassroomListScreenProps> = ({
  classrooms,
  canEditClassroom,
  canEditStudent,
  canAddClassroom,
  onSelectClassroom,
  onEditClassroom,
  onDeleteClassroom,
  onAddStudent,
  onOpenUpgradeModal,
  canUpgradeClass = false,
  isUpgradeEnabled = false,
}) => {
  const [query, setQuery] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');

  const filteredClassrooms = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return classrooms.filter((classroom) => {
      const matchesQuery =
        !normalizedQuery ||
        classroom.name.toLowerCase().includes(normalizedQuery) ||
        classroom.room_number.toLowerCase().includes(normalizedQuery) ||
        classroom.teacher?.full_name?.toLowerCase().includes(normalizedQuery) ||
        classroom.students.some((student) => student.fullname.toLowerCase().includes(normalizedQuery));

      const attendancePercent = getAttendancePercent(classroom);
      const matchesFilter =
        filterMode === 'all' ||
        (filterMode === 'healthy' && attendancePercent !== null && attendancePercent >= 85) ||
        (filterMode === 'at-risk' && attendancePercent !== null && attendancePercent < 85);

      return matchesQuery && matchesFilter;
    });
  }, [classrooms, filterMode, query]);

  const totalStudents = classrooms.reduce((sum, classroom) => sum + classroom.students.length, 0);
  const averageAttendance = classrooms.length
    ? Math.round(
        classrooms.reduce((sum, classroom) => sum + (getAttendancePercent(classroom) ?? 0), 0) / classrooms.length,
      )
    : 0;

  return (
    <div className="space-y-4">
      {/* <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <AcademicCapIcon className="h-5 w-5 text-sky-600" />
          <span>Ringkasan data kelas</span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-600">Total siswa</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{totalStudents}</p>
            <p className="mt-1 text-sm text-slate-500">Seluruh kelas aktif</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-600">Rata-rata kehadiran</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{averageAttendance}%</p>
            <p className="mt-1 text-sm text-slate-500">Berdasarkan data kelas</p>
          </div>
        </div>
      </div> */}

      <div className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4">
        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <MagnifyingGlassIcon className="h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari kelas atau siswa"
              className="w-full bg-transparent text-sm text-slate-700 outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => setFilterMode((current) => (current === 'all' ? 'at-risk' : current === 'at-risk' ? 'healthy' : 'all'))}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600"
            aria-label="Filter kelas"
          >
            <FunnelIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
            <div>
          <span>{filteredClassrooms.length} kelas tampil</span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
            {filterMode === 'all' ? 'Semua' : filterMode === 'healthy' ? 'Kondusif' : 'Berisiko'}
          </span>
            </div>
          {canAddClassroom && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => onAddStudent(classrooms[0]?.id ?? '')}
            className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3.5 py-2 text-sm font-medium text-sky-700"
          >
            <PlusIcon className="h-4 w-4" />
            Tambah siswa
          </button>
        </div>
      )}
        </div>
        
      </div>

      

      <div className="space-y-3">
        {filteredClassrooms.map((classroom) => {
          const attendancePercent = getAttendancePercent(classroom);
          const attendanceTone = getAttendanceTone(attendancePercent);

          return (
            <div
              key={classroom.id}
              onClick={() => onSelectClassroom(classroom)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onSelectClassroom(classroom);
                }
              }}
              className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-sky-200 hover:shadow-none"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                    {getInitials(classroom.name)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-sm font-semibold text-slate-900">{classroom.name}</h3>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                        {classroom.room_number}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-sm text-slate-600">{classroom.teacher?.full_name || 'Pengajar belum ditentukan'} {classroom.teacher?.degree || 'Pengajar'}</p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                    {classroom.students.length} siswa
                  </span>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-3">
                <div></div>
                <div className="flex items-center gap-2">
                  {canEditClassroom && (
                    <>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onEditClassroom(classroom);
                        }}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600"
                        aria-label="Edit kelas"
                      >
                        <PencilSquareIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onDeleteClassroom(classroom);
                        }}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600"
                        aria-label="Hapus kelas"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </>
                  )}
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-50 text-sky-600">
                    <ChevronRightIcon className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {!filteredClassrooms.length && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Tidak ada kelas yang cocok dengan pencarian saat ini.
        </div>
      )}
    </div>
  );
};

export default ClassroomListScreen;
