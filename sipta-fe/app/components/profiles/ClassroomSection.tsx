// components/profiles/ClassroomSection.tsx
import { Classroom } from "@/src/domain/UserEntity";
import React from "react";

interface ClassroomSectionProps {
  classrooms: Classroom[];
}

const ClassroomSection: React.FC<ClassroomSectionProps> = ({ classrooms }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 mt-6 border border-gray-100">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">
        Kelas yang Diajar ({classrooms.length})
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {classrooms.map((classroom) => (
          <div
            key={classroom.id}
            className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
          >
            <h3 className="font-semibold text-gray-900 text-sm">
              {classroom.name}
            </h3>
            <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-600">
              <span>Ruangan: {classroom.room_number}</span>
              <span>Kapasitas: {classroom.capacity} siswa</span>
            </div>
            {classroom.description && (
              <p className="text-xs text-gray-500 mt-2">
                {classroom.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClassroomSection;
