"use client";

import React from 'react';
import {
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  UsersIcon,
  PlusIcon,
  ArrowUpIcon
} from '@heroicons/react/24/outline';
import { Classroom } from '@/src/domain/ClassroomEntity';
import { Student } from '@/src/domain/StudentEntity';

interface ClassroomTableProps {
  classrooms: Classroom[];
  expandedClassroom: string | null;
  onToggle: (id: string) => void;
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

const ClassroomTable: React.FC<ClassroomTableProps> = ({ 
  classrooms, 
  expandedClassroom, 
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
  
  // Check if upgrade button should be shown for a classroom
  const shouldShowUpgradeButton = (classroom: Classroom) => {
    return onUpgrade && 
           classroom.students.length > 0 && 
           canUpgradeClass && 
           isUpgradeEnabled;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Kelas
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
              Guru
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
              Kapasitas
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Siswa
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Aksi
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {classrooms.map((classroom) => {
            const occupancyPercentage = (classroom.students.length / classroom.capacity) * 100;
            const showUpgradeButton = shouldShowUpgradeButton(classroom);
            
            return (
              <React.Fragment key={classroom.id}>
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {classroom.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {classroom.room_number}
                      </div>
                      <div className="text-xs text-gray-400 mt-1 md:hidden">
                        {classroom.teacher.full_name}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 hidden md:table-cell">
                    <div className="text-sm text-gray-900">
                      {classroom.teacher.full_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {classroom.teacher.degree}
                    </div>
                  </td>
                  <td className="px-4 py-4 hidden sm:table-cell">
                    <div className="text-sm text-gray-900">
                      {classroom.students.length} / {classroom.capacity}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          occupancyPercentage >= 90 ? 'bg-red-500' :
                          occupancyPercentage >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                        }`} 
                        style={{ 
                          width: `${Math.min(occupancyPercentage, 100)}%` 
                        }}
                      ></div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">
                    <div className="flex items-center gap-1">
                      <UsersIcon className="w-4 h-4 text-gray-400" />
                      {classroom.students.length}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center space-x-2">
                      {canEditClassroom && (
                        <>
                          <button
                            onClick={() => onEdit(classroom)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded transition-colors duration-200"
                            title="Edit Kelas"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDelete(classroom)}
                            className="text-red-600 hover:text-red-900 p-1 rounded transition-colors duration-200"
                            title="Hapus Kelas"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      
                      {/* Upgrade Button */}
                      {showUpgradeButton && onUpgrade && (
                        <button
                          onClick={() => onUpgrade(classroom)}
                          className="text-green-600 hover:text-green-900 p-1 rounded transition-colors duration-200"
                          title="Naikkan Kelas"
                        >
                          <ArrowUpIcon className="w-4 h-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => onToggle(classroom.id)}
                        className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-1"
                      >
                        {expandedClassroom === classroom.id ? (
                          <EyeSlashIcon className="w-4 h-4" />
                        ) : (
                          <EyeIcon className="w-4 h-4" />
                        )}
                        {expandedClassroom === classroom.id ? 'Tutup' : 'Lihat'}
                      </button>
                    </div>
                  </td>
                </tr>
                
                {expandedClassroom === classroom.id && (
                  <tr>
                    <td colSpan={5} className="px-4 py-4 bg-gray-50">
                      <div className="bg-white rounded-lg border border-gray-200">
                        <div className="px-4 py-3 border-b border-gray-200 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                              <UsersIcon className="w-5 h-5" />
                              Daftar Siswa - {classroom.name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Total: {classroom.students.length} siswa
                            </p>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-3">
                            {/* Upgrade Button in Expanded View */}
                            {showUpgradeButton && onUpgrade && (
                              <button
                                onClick={() => onUpgrade(classroom)}
                                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2 shadow-sm"
                              >
                                <ArrowUpIcon className="w-4 h-4" />
                                Naikkan Siswa
                              </button>
                            )}
                            
                            {canEditStudent && (
                              <button
                                onClick={() => onAddStudent(classroom.id)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2"
                              >
                                <PlusIcon className="w-4 h-4" />
                                Tambah Siswa
                              </button>
                            )}
                          </div>
                        </div>
                        
                        {/* Upgrade Status Info */}
                        {showUpgradeButton && (
                          <div className="px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200">
                            <div className="flex items-center gap-2">
                              <ArrowUpIcon className="w-4 h-4 text-green-600" />
                              <span className="text-sm font-medium text-green-800">
                                Kelas ini siap untuk naik kelas
                              </span>
                            </div>
                            <p className="text-xs text-green-600 mt-1">
                              Klik tombol "Naikkan Siswa" untuk memulai proses kenaikan kelas
                            </p>
                          </div>
                        )}
                        
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                  Nama
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">
                                  Tempat/Tgl Lahir
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                  JK
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">
                                  Orang Tua
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                  Status
                                </th>
                                {canEditStudent && (
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                    Aksi
                                  </th>
                                )}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {classroom.students.map((student) => (
                                <tr key={student.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-3">
                                    <div className="text-sm font-medium text-gray-900">
                                      {student.fullname}
                                    </div>
                                    <div className="text-xs text-gray-500 lg:hidden">
                                      {student.birth_place}, {new Date(student.birth_date).toLocaleDateString('id-ID')}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-900 hidden lg:table-cell">
                                    <div>{student.birth_place}</div>
                                    <div className="text-gray-500">
                                      {new Date(student.birth_date).toLocaleDateString('id-ID')}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-900">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                      student.gender === 'male' 
                                        ? 'bg-blue-100 text-blue-800' 
                                        : 'bg-pink-100 text-pink-800'
                                    }`}>
                                      {student.gender === 'male' ? 'L' : 'P'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-900 hidden md:table-cell">
                                    <div className="text-sm">Ayah: {student.father_name}</div>
                                    <div className="text-xs text-gray-500">
                                      Ibu: {student.mother_name}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-900">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                      student.status === 'active'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                    }`}>
                                      {student.status === 'active' ? 'Aktif' : 'Nonaktif'}
                                    </span>
                                    {student.adverb && student.adverb !== '-' && (
                                      <span className="ml-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                        {student.adverb}
                                      </span>
                                    )}
                                  </td>
                                  {canEditStudent && (
                                    <td className="px-4 py-3">
                                      <div className="flex space-x-2">
                                        <button
                                          onClick={() => onEditStudent(student)}
                                          className="text-blue-600 hover:text-blue-900 p-1 rounded transition-colors duration-200"
                                          title="Edit Siswa"
                                        >
                                          <PencilIcon className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={() => onDeleteStudent(student)}
                                          className="text-red-600 hover:text-red-900 p-1 rounded transition-colors duration-200"
                                          title="Hapus Siswa"
                                        >
                                          <TrashIcon className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </td>
                                  )}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        
                        {/* Empty State for Students */}
                        {classroom.students.length === 0 && (
                          <div className="text-center py-8">
                            <UsersIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                            <p className="text-gray-500">Tidak ada siswa di kelas ini</p>
                            {canEditStudent && (
                              <button
                                onClick={() => onAddStudent(classroom.id)}
                                className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1 mx-auto"
                              >
                                <PlusIcon className="w-4 h-4" />
                                Tambah siswa pertama
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
      
      {/* Empty State for Classrooms */}
      {classrooms.length === 0 && (
        <div className="text-center py-12">
          <UsersIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Belum ada data kelas</p>
        </div>
      )}
    </div>
  );
};

export default ClassroomTable;