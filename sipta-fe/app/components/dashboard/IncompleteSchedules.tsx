"use client";
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  ClockIcon,
  PlayIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowRightIcon,
  ArrowPathIcon,
  PencilSquareIcon,
  CheckIcon,
  XMarkIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { useScheduleStore } from "@/src/state/ScheduleStore";
import { useRouter } from "next/navigation";
import AccomplishmentModal from "./AccomplishModal";
import toast from "react-hot-toast";
import UpdateScheduleModal from "./UpdateScheduleModal";
import { useAuthStore } from "@/src/state/AuthStore";
import { formatDateDDMMYYYY } from "@/src/utils/date";

const IncompleteSchedules: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
  const [updateType, setUpdateType] = useState<"attendance" | "accomplishment" | "review">("attendance");
  const router = useRouter();
  const [showAccomplishmentModal, setShowAccomplishmentModal] = useState(false);
  const [selectedScheduleForAccomplishment, setSelectedScheduleForAccomplishment] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';
  const isTeacher = user?.role === 'teacher';

  const schedules = useScheduleStore((s) => s.incompleSchedules);
  const loading = useScheduleStore((s) => s.loading);
  const fetchIncompleteSchedules = useScheduleStore((s) => s.fetchIncompleteSchedules);
  const createAccomplishments = useScheduleStore((s) => s.createAccomplish);

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    fetchIncompleteSchedules().catch((err: any) =>
      console.error("❌ Gagal fetch jadwal:", err)
    );
  }, [fetchIncompleteSchedules]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (mountedRef.current) setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await fetchIncompleteSchedules();
      toast.success("Jadwal berhasil diperbarui");
    } catch (err: any) {
      console.error("❌ Gagal refresh jadwal:", err);
      toast.error("Gagal memperbarui jadwal");
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchIncompleteSchedules]);

  const safeSchedules = useMemo(() => {
    return Array.isArray(schedules) ? schedules : [];
  }, [schedules]);

  const getScheduleStatus = useCallback((schedule: any) => {
    const attendances = schedule?.teacher_attendances ?? [];
    const hasCheckIn = attendances.some((a: any) => a.type === "check_in");
    const hasCheckOut = attendances.some((a: any) => a.type === "check_out");
    const isCompleted = schedule.is_completed;
    
    const start = new Date(`1970-01-01T${schedule?.start_time}`);
    const end = new Date(`1970-01-01T${schedule?.end_time}`);
    const now = new Date(`1970-01-01T${currentTime.toTimeString().slice(0, 8)}`);
    
    const diffToStart = (now.getTime() - start.getTime()) / 60000;
    const diffToEnd = (now.getTime() - end.getTime()) / 60000;

    return {
      hasCheckIn,
      hasCheckOut,
      isCompleted,
      diffToStart,
      diffToEnd,
      isAttendanceClosed: !hasCheckIn && diffToStart >= 0,
      canCheckIn: !hasCheckIn && diffToStart >= -120 && diffToStart < 0,
      canCheckOut: hasCheckIn && !hasCheckOut && diffToEnd >= 0,
      isInProgress: hasCheckIn && !hasCheckOut,
      hasAccomplishments: Array.isArray(schedule?.accomplishments) && schedule.accomplishments.length > 0
    };
  }, [currentTime]);

  // Fungsi untuk admin mendapatkan konfigurasi tombol
  const getAdminUpdateButtonConfig = useCallback((schedule: any) => {
    const status = getScheduleStatus(schedule);
    
    if (status.hasCheckOut && status.hasAccomplishments) {
      return {
        label: "Masuk Kelas",
        type: "review" as const,
        color: "bg-green-500 hover:bg-green-600",
        icon: <CheckCircleIcon className="h-4 w-4" />,
        disabled: false,
        actionType: "review"
      };
    }
    
    if (status.hasCheckOut && !status.hasAccomplishments) {
      return {
        label: "Isi Pencapaian",
        type: "accomplishment" as const,
        color: "bg-yellow-500 hover:bg-yellow-600",
        icon: <PencilSquareIcon className="h-4 w-4" />,
        disabled: false,
        actionType: "accomplishment"
      };
    }
    
    if (status.hasCheckIn && !status.hasCheckOut) {
      if (status.diffToEnd >= 0) {
        if (status.hasAccomplishments) {
          return {
            label: "Update",
            type: "attendance" as const,
            color: "bg-gray-500 hover:bg-gray-600",
            icon: <PencilSquareIcon className="h-4 w-4" />,
            disabled: false,
            actionType: "attendance"
          };
        } else {
          return {
            label: "Isi Pencapaian",
            type: "accomplishment" as const,
            color: "bg-yellow-500 hover:bg-yellow-600",
            icon: <PencilSquareIcon className="h-4 w-4" />,
            disabled: false,
            actionType: "accomplishment"
          };
        }
      } else {
        return {
          label: "Kelas Berlangsung",
          type: "attendance" as const,
          color: "bg-purple-500 hover:bg-purple-600",
          icon: <PlayIcon className="h-4 w-4" />,
          disabled: false,
          actionType: "attendance"
        };
      }
    }
    
    return {
      label: "Update",
      type: "attendance" as const,
      color: "bg-gray-500 hover:bg-gray-600",
      icon: <PencilSquareIcon className="h-4 w-4" />,
      disabled: false,
      actionType: "attendance"
    };
  }, [getScheduleStatus]);

  // Fungsi untuk teacher mendapatkan konfigurasi tombol
  const getTeacherButtonConfig = useCallback((schedule: any) => {
    const status = getScheduleStatus(schedule);
    const hasAccomplishments = Array.isArray(schedule?.accomplishments) && 
                             schedule.accomplishments.length > 0;
    
    if (status.hasCheckOut && !hasAccomplishments) {
      return {
        label: "Isi Pencapaian",
        type: "accomplishment" as const,
        color: "bg-yellow-500 hover:bg-yellow-600",
        icon: <PencilSquareIcon className="h-4 w-4" />,
        disabled: false,
        actionType: "accomplishment"
      };
    } else if (status.hasCheckOut && hasAccomplishments) {
      return {
        label: "Lihat Review",
        type: "review" as const,
        color: "bg-blue-500 hover:bg-blue-600",
        icon: <CheckCircleIcon className="h-4 w-4" />,
        disabled: false,
        actionType: "review"
      };
    } else if (!status.hasCheckIn) {
      if (status.isAttendanceClosed) {
        return {
          label: "Absensi Ditutup",
          type: "closed" as const,
          color: "bg-gray-400",
          icon: <XMarkIcon className="h-4 w-4" />,
          disabled: true,
          actionType: "attendance"
        };
      }

      return {
        label: "Mulai Kelas",
        type: "check_in" as const,
        color: "bg-green-500 hover:bg-green-600",
        icon: <PlayIcon className="h-4 w-4" />,
        disabled: !status.canCheckIn,
        actionType: "attendance"
      };
    } else if (status.hasCheckIn && !status.hasCheckOut) {
      if (status.diffToEnd >= 0) {
        return {
          label: "Selesaikan Kelas",
          type: "check_out" as const,
          color: "bg-purple-500 hover:bg-purple-600",
          icon: <CheckIcon className="h-4 w-4" />,
          disabled: false,
          actionType: "attendance"
        };
      } else {
        return {
          label: "Lanjutkan Kelas",
          type: "continue" as const,
          color: "bg-green-500 hover:bg-green-600",
          icon: <ArrowRightIcon className="h-4 w-4" />,
          disabled: false,
          actionType: "class"
        };
      }
    } else {
      return {
        label: "Masuk Kelas",
        type: "class" as const,
        color: "bg-green-500 hover:bg-green-600",
        icon: <ArrowRightIcon className="h-4 w-4" />,
        disabled: false,
        actionType: "class"
      };
    }
  }, [getScheduleStatus]);

  // Handler untuk admin
  const handleAdminUpdateClick = useCallback((schedule: any) => {
    const config = getAdminUpdateButtonConfig(schedule);
    
    if (config.disabled) return;
    
    setSelectedSchedule(schedule);
    setUpdateType(config.type);
    
    switch (config.actionType) {
      case "accomplishment":
        setSelectedScheduleForAccomplishment(schedule);
        setShowAccomplishmentModal(true);
        break;
        
      case "review":
        if (schedule.is_completed) {
          router.push(`/classroom/history/${schedule.id}`);
        } else {
          router.push(`/classroom/schedule/${schedule.id}`);
        }
        break;
        
      case "attendance":
        setShowUpdateModal(true);
        break;
    }
  }, [getAdminUpdateButtonConfig, router]);

  // Handler untuk teacher
  const handleTeacherAction = useCallback((schedule: any) => {
    const buttonConfig = getTeacherButtonConfig(schedule);
    
    if (buttonConfig.disabled) return;
    
    switch (buttonConfig.actionType) {
      case "accomplishment":
        setSelectedScheduleForAccomplishment(schedule);
        setShowAccomplishmentModal(true);
        break;
        
      case "review":
        router.push(`/classroom/history/${schedule.id}`);
        break;
        
      case "attendance":
        setSelectedSchedule(schedule);
        setUpdateType("attendance");
        setShowUpdateModal(true);
        break;
        
      case "class":
      default:
        setIsPending(true);
        router.push(`/classroom/schedule/${schedule.id}`);
        break;
    }
  }, [getTeacherButtonConfig, router]);

  // Fungsi untuk render skeleton loading
  const renderSkeleton = () => {
    return (
      <div className="space-y-4">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between mt-6">
          <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse"></div>
          <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
        </div>

        {/* Schedule List Skeletons */}
        <div className="space-y-3">
          {[1, 2, 3].map((index) => (
            <div
              key={index}
              className="bg-white rounded-lg border border-gray-100 overflow-hidden"
            >
              <div className="p-4">
                {/* Header Skeleton */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                    <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2"></div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded animate-pulse w-16 ml-2"></div>
                </div>

                {/* Time & Room Skeleton */}
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex items-center gap-1">
                    <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-20"></div>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-16"></div>
                  </div>
                </div>

                {/* Attendance Times Skeleton */}
                <div className="space-y-1 mb-2">
                  <div className="h-2.5 bg-gray-100 rounded animate-pulse w-32"></div>
                  <div className="h-2.5 bg-gray-100 rounded animate-pulse w-36"></div>
                </div>

                {/* Button Skeleton */}
                <div className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>

                {/* Additional Info Skeleton */}
                <div className="mt-2">
                  <div className="h-2.5 bg-gray-100 rounded animate-pulse w-full"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading && !isRefreshing) {
    return renderSkeleton();
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mt-6">
        <h2 className="text-lg font-semibold text-gray-800">Jadwal Belum Selesai</h2>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Refresh schedule"
          >
            <ArrowPathIcon 
              className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`}
            /> 
          </button>
        </div>
      </div>

      {/* Schedule List */}
      {safeSchedules.length === 0 ? (
        <div className="bg-white rounded-lg p-8 text-center border border-gray-100">
          <ClockIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">Tidak ada jadwal</p>
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition mx-auto disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Memuat...' : 'Refresh'}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {safeSchedules.map((schedule: any) => {
            const id = schedule?.id ?? Math.random().toString();
            const subjectName = schedule?.subject?.name ?? "Mata Pelajaran Tidak Dikenal";
            const classroomName = schedule?.classroom?.name ?? "Kelas Tidak Dikenal";
            const subjectDesc = schedule?.subject?.description ?? "Tidak ada deskripsi";
            
            const status = getScheduleStatus(schedule);
            const buttonConfig = isAdmin ? getAdminUpdateButtonConfig(schedule) : getTeacherButtonConfig(schedule);

            const attendances = schedule?.teacher_attendances ?? [];
            const checkInTime = attendances.find((a: any) => a.type === "check_in")?.created_at;
            const checkOutTime = attendances.find((a: any) => a.type === "check_out")?.created_at;

            return (
              <div
                key={id}
                className="bg-white rounded-lg border border-gray-100 overflow-hidden hover:shadow-sm transition"
              >
                <div className="p-4">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {subjectName} - {classroomName}
                      </h3>
                      <p className="text-sm text-gray-500">{subjectDesc}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ml-2 ${
                      status.isCompleted ? "text-green-600 bg-green-50" :
                      status.hasCheckOut ? "text-green-600 bg-green-50" :
                      status.hasCheckIn ? "text-yellow-600 bg-yellow-50" :
                      "text-gray-500 bg-gray-50"
                    }`}>
                      {formatDateDDMMYYYY(schedule.date)}
                    </span>
                  </div>

                  {/* Time & Room */}
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-1">
                      <ClockIcon className="h-4 w-4" />
                      <span>
                        {schedule?.start_time?.substring(0, 5)} -{" "}
                        {schedule?.end_time?.substring(0, 5)}
                      </span>
                    </div>
                    <div className="text-xs flex items-center gap-2"><UserIcon className="w-4 h-4" /> {schedule.teacher.full_name}</div>
                  </div>

                  {/* Attendance Times */}
                  {checkInTime && (
                    <div className="text-xs text-gray-500 mb-1">
                      Check-in: {new Date(checkInTime).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  )}
                  {checkOutTime && (
                    <div className="text-xs text-gray-500 mb-2">
                      Check-out: {new Date(checkOutTime).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  )}

                  {/* Update Button */}
                  <button
                    onClick={() => isAdmin ? handleAdminUpdateClick(schedule) : handleTeacherAction(schedule)}
                    disabled={buttonConfig.disabled || (isTeacher && isPending)}
                    className={`w-full ${buttonConfig.color} text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isPending && isTeacher ? (
                      <>
                        <ArrowPathIcon className="h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        {buttonConfig.icon}
                        {buttonConfig.label}
                      </>
                    )}
                  </button>

                  {/* Additional Info untuk Teacher */}
                  {isTeacher && buttonConfig.disabled && !status.hasCheckIn && (
                    <div className="mt-2 text-xs text-center text-yellow-600">
                      {status.isAttendanceClosed
                        ? "Absensi sudah ditutup karena jam pelajaran telah dimulai."
                        : "Check-in dapat dilakukan 120 menit sebelum kelas dimulai."}
                    </div>
                  )}

                  {/* Additional Actions */}
                  {status.hasCheckIn && !status.hasCheckOut && status.diffToEnd >= 0 && !status.hasAccomplishments && (
                    <div className="mt-2 text-xs text-center text-gray-500">
                      Isi pencapaian kelas sebelum menyelesaikan
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {(showUpdateModal && (isAdmin || isTeacher)) && (
        <UpdateScheduleModal
          isOpen={showUpdateModal}
          onClose={() => setShowUpdateModal(false)}
          schedule={selectedSchedule}
          onSuccess={() => {
            toast.success("Berhasil diperbarui");
            handleRefresh();
          }}
        />
      )}

      {(showAccomplishmentModal && (isAdmin || isTeacher)) && (
        <AccomplishmentModal
          isOpen={showAccomplishmentModal}
          subjectName={selectedScheduleForAccomplishment?.subject?.name}
          onClose={() => setShowAccomplishmentModal(false)}
          onConfirm={(accomplishments) => {
            createAccomplishments({
              schedule_id: selectedScheduleForAccomplishment?.id,
              accomplishments: accomplishments,
            })
              .then((resp: any) => {
                setShowAccomplishmentModal(false);
                toast.success(resp.message);
                handleRefresh();
              })
              .catch((err: any) => {
                toast.error(err.message);
              });
          }}
        />
      )}
    </div>
  );
};

export default React.memo(IncompleteSchedules);
