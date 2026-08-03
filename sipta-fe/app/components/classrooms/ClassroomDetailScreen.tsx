"use client";

import React, { useMemo, useState } from 'react';
import {
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import { Classroom } from '@/src/domain/ClassroomEntity';
import StudentListRow from './StudentListRow';

interface ClassroomDetailScreenProps {
  classroom: Classroom;
  onBack: () => void;
}

const ClassroomDetailScreen: React.FC<ClassroomDetailScreenProps> = ({ classroom, onBack }) => {
  const [query, setQuery] = useState('');

  const filteredStudents = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return classroom.students;
    }

    return classroom.students.filter((student) => student.fullname.toLowerCase().includes(normalized));
  }, [classroom.students, query]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-medium text-slate-600"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Kembali ke daftar kelas
        </button>

        <div className="mt-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500">Kelas</p>
            <h2 className="text-xl font-semibold text-slate-900">{classroom.name}</h2>
            <p className="mt-1 text-sm text-slate-600">{classroom.room_number} • {classroom.teacher?.full_name || 'Pengajar belum ditentukan'}</p>
          </div>
          <div className="rounded-full bg-sky-50 px-3 py-1 text-sm font-semibold text-sky-700">
            {classroom.students.length} siswa
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-3">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Cari siswa"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none"
        />
      </div>

      <div className="space-y-3">
        {filteredStudents.map((student) => (
          <StudentListRow key={student.id} classroom_id={classroom.id} student={student} />
        ))}
      </div>

      {!filteredStudents.length && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Tidak ada siswa yang cocok dengan pencarian saat ini.
        </div>
      )}
    </div>
  );
};

export default ClassroomDetailScreen;
