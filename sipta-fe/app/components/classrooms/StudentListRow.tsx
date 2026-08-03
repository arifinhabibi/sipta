"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRightIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { Student } from '@/src/domain/StudentEntity';
import getStifin from '@/src/stifin';

interface StudentListRowProps {
  student: Student;
  classroom_id: string;
}

const traitPalette = [
  'bg-violet-50 text-violet-700 border-violet-200',
  'bg-sky-50 text-sky-700 border-sky-200',
  'bg-emerald-50 text-emerald-700 border-emerald-200',
  'bg-amber-50 text-amber-700 border-amber-200',
];

const getInitials = (value: string) =>
  value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'S';

const formatAge = (birthDate: string) => {
  const parsed = new Date(birthDate);
  if (Number.isNaN(parsed.getTime())) {
    return 'Usia belum tersedia';
  }

  const diff = Date.now() - parsed.getTime();
  const ageDate = new Date(diff);
  const age = Math.abs(ageDate.getUTCFullYear() - 1970);
  return `${age} tahun`;
};

const StudentListRow: React.FC<StudentListRowProps> = ({ student }) => {
  const router = useRouter();
  const stifin = getStifin(student.birth_date);
  const trait = stifin.typeName || 'Profil kepribadian';
  const chipClass = traitPalette[student.id.length % traitPalette.length];

  return (
    <button
      type="button"
      onClick={() => router.push(`/classroom/student/${student.id}`)}
      className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
        {getInitials(student.fullname)}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold text-slate-900">{student.fullname}</p>
          <ChevronRightIcon className="h-4 w-4 text-slate-400" />
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span>{formatAge(student.birth_date)}</span>
          <span className="flex items-center gap-1">
            <MapPinIcon className="h-3.5 w-3.5" />
            {student.birth_place || 'Kota lahir belum ada'}
          </span>
        </div>
      </div>

      <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${chipClass}`}>
        {trait}
      </span>
    </button>
  );
};

export default StudentListRow;
