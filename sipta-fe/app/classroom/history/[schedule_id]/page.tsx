"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ProtectedRoute } from "@/app/components/ProtectedRoute";
import HeaderComponent from "@/app/components/HeaderComponent";
import { useScheduleStore } from "@/src/state/ScheduleStore";
import toast from "react-hot-toast";
import {
  CheckBadgeIcon,
  UserGroupIcon,
  ClockIcon,
  CalendarIcon,
  MapPinIcon,
  AcademicCapIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";

// Interfaces berdasarkan struktur data response API
interface Subject {
  id: string;
  name: string;
  code: string;
  description: string;
}

interface Teacher {
  id: string;
  full_name: string;
  gender: string;
  degree: string;
  photo: string;
}

interface Attendance {
  id: string;
  student_id: string;
  schedule_id: string;
  status: string;
  note: string | null;
  created_at: string;
  updated_at: string;
}

interface StudentAccomplishment {
  id: string;
  student_id: string;
  accomplishment_id: string;
  is_capable: boolean | number;
  note: string | null;
  created_at: string;
  updated_at: string;
}

interface Student {
  id: string;
  classroom_id: string;
  fullname: string;
  birth_place: string;
  birth_date: string;
  gender: string;
  father_name: string;
  mother_name: string;
  address: string;
  phone: string;
  photo: string | null;
  birth_certificate: string | null;
  family_card: string | null;
  id_card_father: string | null;
  id_card_mother: string | null;
  adverb: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  attendances?: Attendance[];
  accomplishments?: StudentAccomplishment[];
}

interface Classroom {
  id: string;
  name: string;
  room_number: string;
  capacity: number;
  description: string;
  students: Student[];
}

interface TeacherAttendance {
  id: string;
  schedule_id: string;
  type: string;
}

interface Accomplishment {
  id: string;
  schedule_id: string;
  name: string;
  type: string;
}

interface Schedule {
  id: string;
  teacher_id: string;
  subject_id: string;
  classroom_id: string;
  academic_year_id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
  subject: Subject;
  teacher: Teacher;
  classroom: Classroom;
  teacher_attendances?: TeacherAttendance[];
  accomplishments?: Accomplishment[];
}

export default function ClassReviewPage() {
  const params = useParams<{ schedule_id: string }>();
  const router = useRouter();
  const id = params.schedule_id;
  const fetchSchedule = useScheduleStore((s) => s.fetchSchedule);
  const loading = useScheduleStore((s) => s.loading);
  const { schedule } = useScheduleStore();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!id) {
      toast.error("ID jadwal tidak ditemukan");
      return;
    }
    fetchSchedule(id).catch((error) => {
      console.error("Error fetching schedule:", error);
      toast.error("Gagal memuat data kelas");
    });
  }, [id, fetchSchedule]);

  // Calculate statistics
  const stats = React.useMemo(() => {
    if (!schedule?.classroom?.students) {
      return {
        totalStudents: 0,
        present: 0,
        absent: 0,
        sick: 0,
        permission: 0,
        attendanceRate: 0,
        accomplishmentStats: {} as Record<
          string,
          { capable: number; total: number }
        >,
      };
    }

    const students = schedule.classroom.students;
    const totalStudents = students.length;

    let present = 0,
      absent = 0,
      sick = 0,
      permission = 0;
    const accomplishmentStats: Record<
      string,
      { capable: number; total: number }
    > = {};

    students.forEach((student: any) => {
      // Cari attendance untuk schedule ini
      const scheduleAttendance = student.attendances?.find(
        (att: Attendance) => att.schedule_id === schedule.id
      );

      switch (scheduleAttendance?.status) {
        case "present":
          present++;
          break;
        case "absent":
          absent++;
          break;
        case "sick":
          sick++;
          break;
        case "permission":
          permission++;
          break;
        default:
          absent++; // Jika tidak ada attendance, dianggap absent
      }

      // Count accomplishments untuk schedule ini
      student.accomplishments?.forEach((acc: StudentAccomplishment) => {
        // Pastikan accomplishment ini milik schedule yang sedang dilihat
        const accomplishment = schedule.accomplishments?.find(
          (a: any) => a.id === acc.accomplishment_id
        );

        if (accomplishment) {
          if (!accomplishmentStats[acc.accomplishment_id]) {
            accomplishmentStats[acc.accomplishment_id] = {
              capable: 0,
              total: 0,
            };
          }
          accomplishmentStats[acc.accomplishment_id].total++;

          // Handle both boolean and number types for is_capable
          const isCapable =
            typeof acc.is_capable === "boolean"
              ? acc.is_capable
              : acc.is_capable === 1;

          if (isCapable) {
            accomplishmentStats[acc.accomplishment_id].capable++;
          }
        }
      });
    });

    const attendanceRate =
      totalStudents > 0 ? Math.round((present / totalStudents) * 100) : 0;

    return {
      totalStudents,
      present,
      absent,
      sick,
      permission,
      attendanceRate,
      accomplishmentStats,
    };
  }, [schedule]);

  const getAccomplishmentById = (id: string): any | undefined => {
    return schedule?.accomplishments?.find((acc: any) => acc.id === id);
  };

  const getAttendanceColor = (status: string): string => {
    switch (status) {
      case "present":
        return "bg-emerald-100 text-emerald-800";
      case "absent":
        return "bg-red-100 text-red-800";
      case "sick":
        return "bg-amber-100 text-amber-800";
      case "permission":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getAttendanceLabel = (status: string): string => {
    switch (status) {
      case "present":
        return "Hadir";
      case "absent":
        return "Alpa";
      case "sick":
        return "Sakit";
      case "permission":
        return "Izin";
      default:
        return "Tidak Hadir";
    }
  };

  const getStudentAttendance = (student: Student): string => {
    const scheduleAttendance = student.attendances?.find(
      (att: Attendance) => att.schedule_id === schedule?.id
    );
    return scheduleAttendance?.status || "absent";
  };

  const getStudentAccomplishments = (
    student: Student
  ): StudentAccomplishment[] => {
    if (!schedule?.accomplishments) return [];

    return (
      student.accomplishments?.filter((acc: StudentAccomplishment) =>
        schedule.accomplishments?.some(
          (a: any) => a.id === acc.accomplishment_id
        )
      ) || []
    );
  };

  // Handle gender display
  const getGenderDisplay = (gender: string): string => {
    return gender === "male" ? "Laki-laki" : "Perempuan";
  };

  // Loading state
  if (!mounted || loading) {
    return (
      <ProtectedRoute allowedRoles={["teacher", "admin"]}>
        <div className="min-h-screen bg-gray-50">
          <HeaderComponent />
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="h-96 bg-gray-200 rounded-lg"></div>
                <div className="h-96 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Error state
  if (!schedule) {
    return (
      <ProtectedRoute allowedRoles={["teacher", "admin"]}>
        <div className="min-h-screen bg-gray-50">
          <HeaderComponent />
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="text-center">
              <p className="text-gray-600 mb-4">Data jadwal tidak ditemukan</p>
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                Kembali
              </button>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["teacher", "admin"]}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <HeaderComponent />

        <main className="max-w-7xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="mb-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <button
                      onClick={() => router.back()}
                      className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      <ArrowLeftIcon className="h-5 w-5" />
                      <span>Kembali</span>
                    </button>
                  </div>

                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Review Kelas - {schedule.classroom.name}
                  </h1>
                  <p className="text-lg text-gray-600 mb-4">
                    {schedule.subject.name}
                  </p>

                  <div className="flex flex-wrap gap-6 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <AcademicCapIcon className="h-4 w-4" />
                      <span>{schedule.teacher.full_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPinIcon className="h-4 w-4" />
                      <span>{schedule.classroom.room_number}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      <span>
                        {new Date(schedule.date).toLocaleDateString("id-ID", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ClockIcon className="h-4 w-4" />
                      <span>
                        {schedule.start_time.substring(0, 5)} -{" "}
                        {schedule.end_time.substring(0, 5)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
                      schedule.is_completed
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    <CheckBadgeIcon className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {schedule.is_completed ? "Selesai" : "Dalam Proses"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Siswa
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalStudents}
                  </p>
                </div>
                <UserGroupIcon className="h-8 w-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Kehadiran</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.present}
                  </p>
                  <p className="text-xs text-gray-500">
                    {stats.attendanceRate}% dari total
                  </p>
                </div>
                <ChartBarIcon className="h-8 w-8 text-emerald-500" />
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Tidak Hadir
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.sick + stats.permission + stats.absent}
                  </p>
                  <p className="text-xs text-gray-500">
                    {stats.sick} Sakit, {stats.permission} Izin, {stats.absent}{" "}
                    Alpa
                  </p>
                </div>
                <DocumentTextIcon className="h-8 w-8 text-amber-500" />
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Pencapaian
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {schedule.accomplishments?.length || 0}
                  </p>
                  <p className="text-xs text-gray-500">Indikator penilaian</p>
                </div>
                <CheckBadgeIcon className="h-8 w-8 text-purple-500" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Students List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Daftar Siswa
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {stats.totalStudents} siswa • {stats.present} hadir
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-emerald-600">
                    {stats.attendanceRate}%
                  </div>
                  <div className="text-xs text-gray-500">tingkat kehadiran</div>
                </div>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {schedule.classroom.students.map(
                  (student: any, index: number) => {
                    const studentAccomplishments =
                      getStudentAccomplishments(student);
                    const capableCount = studentAccomplishments.filter(
                      (acc: StudentAccomplishment) => {
                        const isCapable =
                          typeof acc.is_capable === "boolean"
                            ? acc.is_capable
                            : acc.is_capable === 1;
                        return isCapable;
                      }
                    ).length;
                    const totalCount = schedule.accomplishments?.length || 1;
                    const progressPercentage =
                      totalCount > 0 ? (capableCount / totalCount) * 100 : 0;
                    const attendanceStatus = getStudentAttendance(student);

                    return (
                      <div
                        key={student.id}
                        className="p-4 rounded-xl border border-gray-200 hover:border-gray-300 transition-all duration-200"
                      >
                        <div className="flex items-start gap-4">
                          {/* Number Badge */}
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm">
                              {index + 1}
                            </div>
                          </div>

                          {/* Student Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 text-sm truncate">
                                  {student.fullname}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {getGenderDisplay(student.gender)}
                                </p>
                              </div>

                              {/* Attendance Status */}
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 ${getAttendanceColor(
                                  attendanceStatus
                                )}`}
                              >
                                {getAttendanceLabel(attendanceStatus)}
                              </span>
                            </div>

                            {/* Progress Bar */}
                            <div className="flex items-center gap-3 mb-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div
                                  className="h-2 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-500"
                                  style={{ width: `${progressPercentage}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                                {capableCount}/{totalCount}
                              </span>
                            </div>

                            {/* Accomplishment Dots */}
                            <div className="flex items-center justify-between">
                              <div className="flex gap-1.5">
                                {schedule.accomplishments?.map((acc: any) => {
                                  const studentAcc =
                                    studentAccomplishments.find(
                                      (a: StudentAccomplishment) =>
                                        a.accomplishment_id === acc.id
                                    );

                                  const isCapable = studentAcc
                                    ? typeof studentAcc.is_capable === "boolean"
                                      ? studentAcc.is_capable
                                      : studentAcc.is_capable === 1
                                    : false;

                                  return (
                                    <div
                                      key={acc.id}
                                      className={`w-3 h-3 rounded-full border-2 ${
                                        isCapable
                                          ? "bg-emerald-500 border-emerald-500"
                                          : "bg-white border-gray-300"
                                      }`}
                                      title={acc.name}
                                    />
                                  );
                                })}
                              </div>
                              <span className="text-sm text-gray-600 font-medium">
                                {Math.round(progressPercentage)}% tercapai
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>

            {/* Accomplishments Summary */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Ringkasan Pencapaian
              </h2>

              <div className="space-y-4 mb-8">
                {schedule.accomplishments?.map((accomplishment: any) => {
                  const stat = stats.accomplishmentStats[accomplishment.id];
                  const percentage =
                    stat && stat.total > 0
                      ? Math.round((stat.capable / stat.total) * 100)
                      : 0;

                  return (
                    <div
                      key={accomplishment.id}
                      className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-sm mb-1">
                            {accomplishment.name}
                          </p>
                          <p className="text-xs text-gray-500 capitalize">
                            {accomplishment.type === "knowledge"
                              ? "Pengetahuan"
                              : accomplishment.type === "skill"
                              ? "Keterampilan"
                              : accomplishment.type}
                          </p>
                        </div>
                        <span
                          className={`text-sm font-semibold ${
                            percentage >= 80
                              ? "text-emerald-600"
                              : percentage >= 60
                              ? "text-amber-600"
                              : "text-red-600"
                          }`}
                        >
                          {percentage}%
                        </span>
                      </div>

                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            percentage >= 80
                              ? "bg-emerald-500"
                              : percentage >= 60
                              ? "bg-amber-500"
                              : "bg-red-500"
                          }`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>

                      <div className="flex justify-between text-xs text-gray-500">
                        <span>
                          {stat?.capable || 0} dari {stat?.total || 0} siswa
                          mampu
                        </span>
                        <span>{percentage}% berhasil</span>
                      </div>
                    </div>
                  );
                })}

                {(!schedule.accomplishments ||
                  schedule.accomplishments.length === 0) && (
                  <div className="text-center py-8 text-gray-500">
                    <DocumentTextIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>Tidak ada indikator pencapaian</p>
                  </div>
                )}
              </div>

              {/* Attendance Summary */}
              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-md font-semibold text-gray-900 mb-4">
                  Ringkasan Kehadiran
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                    <p className="text-2xl font-bold text-emerald-700">
                      {stats.present}
                    </p>
                    <p className="text-sm text-emerald-600">Hadir</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-amber-50 border border-amber-200">
                    <p className="text-2xl font-bold text-amber-700">
                      {stats.sick}
                    </p>
                    <p className="text-sm text-amber-600">Sakit</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-blue-50 border border-blue-200">
                    <p className="text-2xl font-bold text-blue-700">
                      {stats.permission}
                    </p>
                    <p className="text-sm text-blue-600">Izin</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-red-50 border border-red-200">
                    <p className="text-2xl font-bold text-red-700">
                      {stats.absent}
                    </p>
                    <p className="text-sm text-red-600">Alpa</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
