"use client";

import React, { useState } from 'react';
import { PencilIcon, TrashIcon, ChevronDownIcon, ChevronUpIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { Student } from '@/src/domain/StudentEntity';
import getStifin from '@/src/stifin';
import Image from 'next/image';

interface StudentCardProps {
  student: Student;
  stifin?: ReturnType<typeof getStifin>;
  onEdit: (student: Student) => void;
  onDelete: (student: Student) => void;
  canEdit: boolean;
}

const StudentCard: React.FC<StudentCardProps> = ({ 
  student,
  stifin,
  onEdit,
  onDelete,
  canEdit
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  // Get base URL from environment with fallback
  const baseUrl = process.env.NEXT_PUBLIC_ASSET || '';

  // Build photo URL safely untuk format path seperti "students/sumbull/mwKJo0wWn9Jgc5irCnjDdgZcWlOMTX0i6C6rhAPT.jpg"
  const getPhotoUrl = (photoPath: string | undefined | null): string | null => {
    // Jika photoPath tidak ada, return null
    if (!photoPath || photoPath.trim() === '' || photoPath === 'null') {
      return null;
    }
    
    // Jika photoPath sudah full URL, validasi dulu
    if (photoPath.startsWith('http')) {
      try {
        new URL(photoPath);
        return photoPath;
      } catch {
        return null; // Invalid URL
      }
    }
    
    // Jika photoPath relative path seperti "students/sumbull/mwKJo0wWn9Jgc5irCnjDdgZcWlOMTX0i6C6rhAPT.jpg"
    // Gabungkan dengan baseUrl dan pastikan format path benar
    if (baseUrl) {
      try {
        // Normalize path - hilangkan slash di depan jika ada, tambahkan di baseUrl
        const normalizedPath = photoPath.startsWith('/') ? photoPath.slice(1) : photoPath;
        const fullUrl = `${baseUrl}${baseUrl.endsWith('/') ? '' : '/'}${normalizedPath}`;
        new URL(fullUrl);
        return fullUrl;
      } catch {
        return null;
      }
    }
    
    return null;
  };

  // Cek apakah photo valid
  const photoUrl = getPhotoUrl(student.photo);

  const hasValidPhoto = !!photoUrl && !imageError;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 hover:border-gray-300 transition-colors duration-200">
      {/* Student Header with Photo */}
      <div className="flex justify-between items-start gap-3">
        {/* Photo Section - 2x3 */}
        <div className="flex-shrink-0">
          <div className="w-16 h-24 bg-gray-100 rounded border border-gray-300 flex items-center justify-center overflow-hidden">
            {hasValidPhoto && photoUrl ? (
              <Image
                src={photoUrl}
                alt={student.fullname}
                width={64}
                height={96}
                className="w-full h-full object-cover"
                onError={handleImageError}
                priority={false}
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-400 p-2">
                <UserCircleIcon className="w-8 h-8" />
                <span className="text-xs text-center mt-1">Foto<br />2x3</span>
              </div>
            )}
          </div>
        </div>

        {/* Student Info */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h5 className="font-medium text-gray-900 text-sm">{student.fullname}</h5>
              <p className="text-gray-600 text-xs mt-1">{student.phone}</p>
            </div>
            <div className="flex items-center space-x-1 ml-2">
              {canEdit && (
                <>
                  <button
                    onClick={() => onEdit(student)}
                    className="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors duration-200"
                    title="Edit Siswa"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(student)}
                    className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors duration-200"
                    title="Hapus Siswa"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </>
              )}
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                student.gender === 'male' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-pink-100 text-pink-800'
              }`}>
                {student.gender === 'male' ? 'L' : 'P'}
              </span>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                student.status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {student.status === 'active' ? 'Aktif' : 'Nonaktif'}
              </span>
            </div>
          </div>

          {/* Basic Info */}
          <div className="mt-2 text-xs text-gray-600">
            <div className="flex flex-wrap gap-2">
              <span>{student.birth_place}</span>
              <span>•</span>
              <span>{new Date(student.birth_date).toLocaleDateString('id-ID')}</span>
            </div>
            {stifin?.result !== undefined && (
              <div className="mt-2 flex items-center gap-2">
                <span className="font-medium text-gray-700">Stifin:</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  {stifin.result} - {stifin.typeName}
                </span>
              </div>
            )}
          </div>

          {/* Toggle Details Button */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="mt-2 text-blue-600 hover:text-blue-800 text-xs font-medium transition-colors duration-200 flex items-center gap-1"
          >
            {showDetails ? <ChevronUpIcon className="w-3 h-3" /> : <ChevronDownIcon className="w-3 h-3" />}
            {showDetails ? 'Sembunyikan Detail' : 'Lihat Detail'}
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      {showDetails && (
        <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
          <div className="text-xs">
            <span className="font-medium text-gray-700">Ayah:</span>
            <span className="text-gray-600 ml-1">{student.father_name}</span>
          </div>
          <div className="text-xs">
            <span className="font-medium text-gray-700">Ibu:</span>
            <span className="text-gray-600 ml-1">{student.mother_name}</span>
          </div>
          <div className="text-xs">
            <span className="font-medium text-gray-700">Alamat:</span>
            <span className="text-gray-600 ml-1 line-clamp-2">{student.address}</span>
          </div>
          {student.adverb && student.adverb !== '-' && (
            <div className="text-xs">
              <span className="font-medium text-gray-700">Keterangan:</span>
              <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                {student.adverb}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentCard;