"use client";

import React from 'react';
import {
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  UsersIcon,
  UserGroupIcon,
  PlusIcon,
  ArrowUpIcon
} from '@heroicons/react/24/outline';
import { Classroom } from '@/src/domain/ClassroomEntity';
import { Student } from '@/src/domain/StudentEntity';
import getStifin from '@/src/stifin';
import StudentCard from './StudentCard';

interface ClassroomCardProps {
  classroom: Classroom;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: (classroom: Classroom) => void;
  onDelete: (classroom: Classroom) => void;
  onUpgrade?: (classroom: Classroom) => void;
  onAddStudent: (classroomId: string) => void;
  onEditStudent: (student: Student) => void;
  onDeleteStudent: (student: Student) => void;
  canEditClassroom: boolean;
  canEditStudent: boolean;
  canUpgradeClass?: boolean;
  isUpgradeEnabled?: boolean;
}

const ClassroomCard: React.FC<ClassroomCardProps> = ({
  classroom,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  onUpgrade,
  onAddStudent,
  onEditStudent,
  onDeleteStudent,
  canEditClassroom,
  canEditStudent,
  canUpgradeClass = false,
  isUpgradeEnabled = false
}) => {
  const occupancyPercentage = (classroom.students.length / classroom.capacity) * 100;
  
  // Check if upgrade button should be shown
  const shouldShowUpgradeButton = 
    onUpgrade && 
    classroom.students.length > 0 && 
    canUpgradeClass && 
    isUpgradeEnabled;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
      {/* Classroom Header */}
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-lg">{classroom.name}</h3>
            <p className="text-gray-600 text-sm mt-1">{classroom.room_number}</p>
            <p className="text-gray-500 text-xs mt-1">{classroom.description}</p>
          </div>
          <div className="flex items-center space-x-2 ml-4">
            {canEditClassroom && (
              <>
                <button
                  onClick={() => onEdit(classroom)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                  title="Edit Kelas"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(classroom)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                  title="Hapus Kelas"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </>
            )}
            
            {/* Upgrade Button */}
            {shouldShowUpgradeButton && (
              <button
                onClick={() => onUpgrade(classroom)}
                className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200"
                title="Naikkan Kelas"
              >
                <ArrowUpIcon className="w-4 h-4" />
              </button>
            )}
            
            <button
              onClick={onToggle}
              className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-1"
            >
              {isExpanded ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
              {isExpanded ? 'Tutup' : 'Lihat'}
            </button>
          </div>
        </div>

        {/* Teacher Info */}
        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="font-medium text-gray-900 text-sm">{classroom.teacher.full_name}</p>
              <p className="text-gray-600 text-xs">{classroom.teacher.degree}</p>
            </div>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              classroom.teacher.status === 'active' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {classroom.teacher.status === 'active' ? 'Aktif' : 'Nonaktif'}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 flex items-center justify-center gap-1">
              <UsersIcon className="w-5 h-5" />
              {classroom.students.length}
            </div>
            <div className="text-xs text-gray-500">Siswa</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-700 flex items-center justify-center gap-1">
              <UserGroupIcon className="w-5 h-5" />
              {classroom.capacity}
            </div>
            <div className="text-xs text-gray-500">Kapasitas</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Terisi</span>
            <span>{Math.round(occupancyPercentage)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                occupancyPercentage >= 90 ? 'bg-red-500' :
                occupancyPercentage >= 70 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(occupancyPercentage, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Expanded Students Section */}
      {isExpanded && (
        <div className="border-t border-gray-200">
          <div className="p-4 bg-gray-50">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 sm:px-6 py-4">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                  <UsersIcon className="w-5 h-5" />
                  Daftar Siswa
                </h4>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                  {classroom.students.length} siswa
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Upgrade Button in Expanded Section */}
                {shouldShowUpgradeButton && (
                  <button
                    onClick={() => onUpgrade(classroom)}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 text-xs shadow-sm"
                  >
                    <ArrowUpIcon className="w-4 h-4" />
                    Naikkan Kelas
                  </button>
                )}
                
                {/* Add Student Button */}
                {canEditStudent && (
                  <button
                    onClick={() => onAddStudent(classroom.id)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2 text-xs"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Tambah Siswa
                  </button>
                )}
              </div>
            </div>
            
            {classroom.students.length === 0 ? (
              <div className="text-center py-8 text-gray-500 bg-white rounded-lg border border-dashed border-gray-300">
                <UsersIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 mb-2">Tidak ada siswa di kelas ini</p>
                {canEditStudent && (
                  <button
                    onClick={() => onAddStudent(classroom.id)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1 mx-auto"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Tambah siswa pertama
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {classroom.students.map((student) => {
                  const stifin = getStifin(student.birth_date);

                  return (
                    <StudentCard
                      key={student.id}
                      student={student}
                      stifin={stifin}
                      onEdit={onEditStudent}
                      onDelete={onDeleteStudent}
                      canEdit={canEditStudent}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassroomCard;