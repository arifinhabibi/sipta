"use client";
import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { Bars3Icon } from '@heroicons/react/24/outline';
import { useSearchParams, useRouter } from 'next/navigation';
import HeaderComponent from "../components/HeaderComponent";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { useAuthStore } from "@/src/state/AuthStore";
import { useTeacherStore } from "@/src/state/TeacherStore";
import { useClassroomStore } from "@/src/state/ClassroomStore";
import { useScheduleStore } from "@/src/state/ScheduleStore";
import { useReportStore } from "@/src/state/ReportStore";
import LoadingComponent from '../components/LoadingComponent';
import { ActiveTab, Classroom, PrismAxes, Schedule, Teacher } from '@/src/domain/ReportEntity';
import { StudentTab } from '../components/reports/students/StudentTab';
import TeacherAttendancePanel from '../components/reports/TeacherAttendancePanel';

// Komponen terpisah yang menggunakan useSearchParams
function ReportContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { me } = useAuthStore();
  const { teachers, fetchTeachers, loading: teachersLoading } = useTeacherStore();
  const { classrooms, fetchClassrooms, loading: classroomsLoading } = useClassroomStore();
  const { schedules, fetchSchedules, loading: schedulesLoading } = useScheduleStore();
  const { generateStudentReport, generateBulkReport, loading: reportLoading } = useReportStore();
  
  const [activeTab, setActiveTab] = useState<ActiveTab>('teachers');
  const [selectedClassroom, setSelectedClassroom] = useState<string>('all');
  const [menuOpen, setMenuOpen] = useState(false);
  
  const isAdmin = me?.role === 'admin';

  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchTeachers();
      } catch (error) {
        console.error("Gagal ambil guru:", error);
      }
    };
    fetchData();
  }, [fetchTeachers]);

  useEffect(() => {
    if (teachers.length > 0) {
      fetchClassrooms();
      fetchSchedules();
    }
  }, [teachers, fetchClassrooms, fetchSchedules]);

  useEffect(() => {
    const tabFromQuery = searchParams.get('tab') as ActiveTab;
    if (tabFromQuery && ['teachers', 'students'].includes(tabFromQuery)) {
      setActiveTab(tabFromQuery);
    }
  }, [searchParams]);

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const makePrism = (seed = 50): PrismAxes => ({
    knowledge: Math.max(20, Math.min(95, seed + Math.round(Math.random() * 20 - 10))),
    skill: Math.max(20, Math.min(95, seed + Math.round(Math.random() * 20 - 10))),
    attitude: Math.max(20, Math.min(95, seed + Math.round(Math.random() * 20 - 10))),
    creativity: Math.max(20, Math.min(95, seed + Math.round(Math.random() * 20 - 10))),
    discipline: Math.max(20, Math.min(95, seed + Math.round(Math.random() * 20 - 10))),
  });

  const transformedClassrooms: any = useMemo(() => {
    return classrooms.map((classroom) => ({
      id: classroom.id,
      name: classroom.name,
      room_number: classroom.room_number,
      capacity: classroom.capacity,   
      description: classroom.description,
      teacher: classroom.teacher
        ? {
            id: classroom.teacher.id,
            full_name: classroom.teacher.full_name,
            photo: classroom.teacher.photo,
            gender: classroom.teacher.gender,
            degree: classroom.teacher.degree,
            status: classroom.teacher.status
          }
        : null,
      students: classroom.students?.map((student) => ({
        id: student.id,
        fullname: student.fullname,
        birth_place: student.birth_place,
        birth_date: student.birth_date,
        gender: student.gender,
        photo: student.photo,
        status: student.status
      }))
    }));
  }, [classrooms]);

  const transformedTeachers = useMemo(() => {
    return teachers.map(teacher => ({
      id: teacher.id,
      full_name: teacher.full_name,
      photo: teacher.photo,
      gender: teacher.gender,
      degree: teacher.degree,
      status: teacher.status
    }));
  }, [teachers]);

  const mockSchedules = useMemo(() => {
    return Array.from({ length: 10 }, (_, i) => ({
      id: `schedule-${i}`,
      title: `Pelajaran ${i + 1}`,
      start: new Date(Date.now() + i * 24 * 60 * 60 * 1000),
      end: new Date(Date.now() + i * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
      status: i % 3 === 0 ? 'completed' : 'scheduled'
    }));
  }, []);

  const students = useMemo(() => {
    if (selectedClassroom === 'all') {
      return transformedClassrooms.flatMap((c: any) => c.students || []);
    }
    const classroom = transformedClassrooms.find((c: any) => c.id === selectedClassroom);
    return classroom?.students || [];
  }, [transformedClassrooms, selectedClassroom]);

  const handleGenerateStudentReport = async (studentId: string) => {
    try {
      await generateStudentReport(studentId);
    } catch (error) {
      console.error('Error generating student report:', error);
    }
  };

  const handleGenerateBulkReport = async () => {
    try {
      await generateBulkReport();
    } catch (error) {
      console.error('Error generating bulk report:', error);
    }
  };

  if (teachersLoading || classroomsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 pb-20">
        <HeaderComponent />
        <main className="mx-auto max-w-xl px-4 py-6">
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <div className="text-lg text-gray-600">Memuat data laporan...</div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 pb-20">
      <HeaderComponent />
      <main className="mx-auto max-w-xl px-3 py-4 sm:px-4 sm:py-6">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4">
          <div className="flex items-center justify-between w-full relative">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Data Laporan</h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Monitor performa siswa, kehadiran guru, dan jadwal pembelajaran
              </p>
            </div>
          </div>
        </div>

        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
          {(['teachers', 'students'] as ActiveTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab === 'teachers' && 'Absensi Guru'}
              {tab === 'students' && 'Laporan Siswa'}
            </button>
          ))}
        </div>

        {/* Students Tab */}
        {activeTab === 'students' && (
          <StudentTab
            onGenerateStudentReport={handleGenerateStudentReport}
            onGenerateBulkReport={handleGenerateBulkReport}
            isAdmin={isAdmin}
            currentUser={me}
          />
        )}

        {/* Teachers Tab */}
        {activeTab === 'teachers' && (
          <TeacherAttendancePanel />
        )}
      </main>
    </div>
  );
}

// Loading fallback untuk Suspense
function ReportPageLoading() {
  return (
    <ProtectedRoute allowedRoles={["teacher", "admin"]}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 pb-20">
        <HeaderComponent />
        <main className="mx-auto max-w-xl px-4 py-6">
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <div className="text-lg text-gray-600">Memuat laporan...</div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}

// Main component dengan Suspense boundary
export default function ReportPage() {
  return (
    <ProtectedRoute allowedRoles={["teacher", "admin"]}>
      <Suspense fallback={<ReportPageLoading />}>
        <ReportContent />
      </Suspense>
    </ProtectedRoute>
  );
}
