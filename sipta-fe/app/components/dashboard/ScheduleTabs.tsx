"use client";
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  useTransition,
} from "react";
import {
  ClockIcon,
  PlayIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowRightIcon,
  ArrowPathIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { useScheduleStore } from "@/src/state/ScheduleStore";
import AbsensiModal from "./AbsensiModal";
import { useRouter } from "next/navigation";
import AccomplishmentModal from "./AccomplishModal";
import toast from "react-hot-toast";

const ScheduleTabs: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showAbsenModal, setShowAbsenModal] = useState(false);
  const [selectedJadwal, setSelectedJadwal] = useState<any>(null);
  const [absenType, setAbsenType] = useState<"in" | "out">("in");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showAccomplishmentModal, setShowAccomplishmentModal] = useState(false);
  const [selectedScheduleForAccomplishment, setSelectedScheduleForAccomplishment] =
    useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const schedules = useScheduleStore((s) => s.schedules);
  const loading = useScheduleStore((s) => s.loading);
  const fetchSchedulesToday = useScheduleStore((s) => s.fetchSchedulesToday);
  const createAccomplishments = useScheduleStore((s) => s.createAccomplish);

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    fetchSchedulesToday().catch((err: any) =>
      console.error("❌ Gagal fetch jadwal:", err)
    );
  }, [fetchSchedulesToday]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (mountedRef.current) setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await fetchSchedulesToday();
      toast.success("Jadwal berhasil diperbarui");
    } catch (err: any) {
      console.error("❌ Gagal refresh jadwal:", err);
      toast.error("Gagal memperbarui jadwal");
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchSchedulesToday]);

  const safeSchedules = useMemo(() => {
    return Array.isArray(schedules) ? schedules : [];
  }, [schedules]);

  const stats = useMemo(() => {
    let completed = 0;
    let inProgress = 0;
    let upcoming = 0;

    safeSchedules.forEach((schedule: any) => {
      const attendances = schedule?.teacher_attendances ?? [];
      const hasCheckOut = attendances.some((a: any) => a.type === "check_out");
      const hasCheckIn = attendances.some((a: any) => a.type === "check_in");

      if (hasCheckOut) {
        completed++;
      } else if (hasCheckIn) {
        inProgress++;
      } else {
        upcoming++;
      }
    });

    return { completed, inProgress, upcoming };
  }, [safeSchedules]);

  const handleOpenAbsenModal = useCallback(
    (schedule: any, type: "in" | "out") => {
      setSelectedJadwal(schedule);
      setAbsenType(type);
      setShowAbsenModal(true);
    },
    []
  );

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

                {/* Check-in/out Times Skeleton */}
                <div className="space-y-1 mb-2">
                  <div className="h-2.5 bg-gray-100 rounded animate-pulse w-32"></div>
                  <div className="h-2.5 bg-gray-100 rounded animate-pulse w-36"></div>
                </div>

                {/* Status Indicators Skeleton */}
                <div className="flex gap-2 mb-3">
                  <div className="h-2 w-2 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="h-2 w-2 bg-gray-200 rounded-full animate-pulse"></div>
                </div>

                {/* Action Buttons Skeleton */}
                <div className="space-y-2">
                  <div className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                  <div className="h-6 bg-gray-100 rounded animate-pulse w-full"></div>
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
      {/* Today's Schedule Header */}
      <div className="flex items-center justify-between mt-6">
        <h2 className="text-lg font-semibold text-gray-800">Jadwal Hari Ini</h2>
        <div className="flex items-center gap-3">
          {/* Refresh Button */}
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
          <p className="text-gray-500">Tidak ada jadwal mengajar hari ini</p>
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

            const start = new Date(`1970-01-01T${schedule?.start_time}`);
            const end = new Date(`1970-01-01T${schedule?.end_time}`);
            const now = new Date(`1970-01-01T${currentTime.toTimeString().slice(0, 8)}`);

            const diffToStart = (now.getTime() - start.getTime()) / 60000;
            const diffToEnd = (now.getTime() - end.getTime()) / 60000;

            const attendances = schedule?.teacher_attendances ?? [];
            const isCompleted = schedule.is_completed;
            const hasCheckIn = attendances.some((a: any) => a.type === "check_in");
            const hasCheckOut = attendances.some((a: any) => a.type === "check_out");
            const checkInTime = attendances.find((a: any) => a.type === "check_in")?.created_at;
            const checkOutTime = attendances.find((a: any) => a.type === "check_out")?.created_at;

            let statusBadge = "Upcoming";
            let statusColor = "text-gray-500 bg-gray-50";
            let statusIndicators = [false, false];

            if (hasCheckOut) {
              statusBadge = "Completed";
              statusColor = "text-green-600 bg-green-50";
              statusIndicators = [true, true];
            } else if (hasCheckIn) {
              statusBadge = "In Progress";
              statusColor = "text-yellow-600 bg-yellow-50";
              statusIndicators = [true, false];
            }

            const isAttendanceClosed = !hasCheckIn && diffToStart >= -15;
            const canCheckIn = !hasCheckIn && diffToStart >= -120 && diffToStart < -15;
            const willCloseSoon = !hasCheckIn && diffToStart >= -120 && diffToStart < -15;
            const canStartClass = hasCheckIn;
            const canCheckOut = hasCheckIn && !hasCheckOut && diffToEnd >= 0;

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
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ml-2 ${statusColor}`}
                    >
                      {statusBadge}
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

                  {/* Check-in/out times */}
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

                  {/* Status Indicators */}
                  <div className="flex gap-2 mb-3">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        statusIndicators[0] ? "bg-green-500" : "bg-gray-300"
                      }`}
                    />
                    <div
                      className={`h-2 w-2 rounded-full ${
                        statusIndicators[1] ? "bg-green-500" : "bg-gray-300"
                      }`}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    {canCheckIn && (
                      <button
                        onClick={() => handleOpenAbsenModal(schedule, "in")}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition"
                      >
                        <PlayIcon className="h-4 w-4" /> Check In
                      </button>
                    )}

                    {isAttendanceClosed && !hasCheckIn && (
                      <span className="inline-block px-2 py-1 bg-red-50 text-red-600 text-xs font-medium rounded">
                        Absensi sudah ditutup karena jam pelajaran telah dimulai.
                      </span>
                    )}

                    {!canCheckIn && !hasCheckIn && !isAttendanceClosed && (
                      <span className="inline-block px-2 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded">
                        Check-in dapat dilakukan 120 menit sebelum jam pelajaran dimulai.
                      </span>
                    )}

                    {willCloseSoon && (
                      <span className="inline-block px-2 py-1 bg-amber-50 text-amber-600 text-xs font-medium rounded">
                        Absensi akan ditutup 15 menit sebelum jadwal dimulai.
                      </span>
                    )}

                    {!hasCheckOut && hasCheckIn && (
                      <span className="inline-block px-2 py-1 bg-yellow-50 text-yellow-600 text-xs font-medium rounded">
                        Checkout akan tersedia setelah jam sesi berakhir
                      </span>
                    )}

                    {canStartClass && !isCompleted && (
                      <button
                        onClick={() => {
                          const hasAccomplishments =
                            Array.isArray(schedule?.accomplishments) &&
                            schedule.accomplishments.length > 0;

                          if (!hasAccomplishments) {
                            setSelectedScheduleForAccomplishment(schedule);
                            setShowAccomplishmentModal(true);
                          } else {
                            startTransition(() => {
                              router.push(`/classroom/schedule/${schedule.id}`);
                            });
                          }
                        }}
                        className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition"
                      >
                        {isPending ? "Loading..." : <>Mulai Kelas <ArrowRightIcon className="h-4 w-4" /></>}
                      </button>
                    )}

                    {isCompleted && (
                      <button
                        onClick={() => {
                          const hasAccomplishments =
                            Array.isArray(schedule?.accomplishments) &&
                            schedule.accomplishments.length > 0;

                          if (!hasAccomplishments) {
                            setSelectedScheduleForAccomplishment(schedule);
                            setShowAccomplishmentModal(true);
                          } else {
                            startTransition(() => {
                              router.push(`/classroom/history/${schedule.id}`);
                            });
                          }
                        }}
                        className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition"
                      >
                        {isPending ? "Loading..." : <>Review Kelas <ArrowRightIcon className="h-4 w-4" /></>}
                      </button>
                    )}

                    {canCheckOut && isCompleted && (
                      <button
                        onClick={() => handleOpenAbsenModal(schedule, "out")}
                        className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition"
                      >
                        Check Out
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <AbsensiModal
        isOpen={showAbsenModal}
        onClose={() => setShowAbsenModal(false)}
        jadwal={selectedJadwal}
        absenType={absenType}
      />

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
              if (selectedScheduleForAccomplishment) {
                startTransition(() =>
                  router.push(`/classroom/schedule/${selectedScheduleForAccomplishment.id}`)
                );
              }
            })
            .catch((err: any) => {
              toast.error(err.message);
            });
        }}
      />
    </div>
  );
};

export default React.memo(ScheduleTabs);