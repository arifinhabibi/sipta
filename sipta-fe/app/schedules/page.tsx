"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ProtectedRoute } from "../components/ProtectedRoute";
import HeaderComponent from "../components/HeaderComponent";
import {
  BookOpenIcon,
  BuildingLibraryIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  EyeIcon,
  PencilSquareIcon,
  PlusIcon,
  UserIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { toast, Toaster } from "react-hot-toast";
import { Calendar, Event, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import { AddScheduleModal } from "../components/schedules/AddSchedule";
import { useScheduleStore } from "@/src/state/ScheduleStore";
import { useStudyStore } from "@/src/state/StudyStore";
import { Schedule } from "@/src/domain/ScheduleEntity";
import { EditScheduleModal } from "../components/schedules/EditScheduleModal";
import { useTeacherStore } from "@/src/state/TeacherStore";
import { SubjectManagement } from "../components/schedules/SubjectManagement";
import { AuthState, AuthUser } from "@/src/domain/AuthEntity";
import { DeleteConfirmationModal } from "../components/schedules/DeleteConfirmationModal";
import { formatDateDDMMYYYY } from "@/src/utils/date";

const localizer = momentLocalizer(moment);

const subjectColors: Record<string, string> = {
  "Bahasa Arab": "bg-blue-100 border-blue-300 text-blue-800",
  Fiqih: "bg-green-100 border-green-300 text-green-800",
  "Ilmu Tauhid": "bg-purple-100 border-purple-300 text-purple-800",
  "Ilmu Tajwid": "bg-blue-100 border-blue-300 text-blue-800",
  "imla'": "bg-orange-100 border-orange-300 text-orange-800",
  "Sejarah Kebudayaan Islam": "bg-pink-100 border-pink-300 text-pink-800",
};

const getSubjectColor = (subjectName: string): string => {
  return subjectColors[subjectName] || "bg-gray-100 border-gray-300 text-gray-800";
};

const CalendarSkeleton = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 bg-gray-200 rounded w-36" />
        <div className="h-8 bg-gray-200 rounded w-48" />
      </div>
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 7 }).map((_, index) => (
          <div key={index} className="h-10 bg-gray-200 rounded" />
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 35 }).map((_, index) => (
          <div key={index} className="h-24 bg-gray-100 rounded" />
        ))}
      </div>
    </div>
  </div>
);

const CompactEventComponent = React.memo(function CompactEventComponent({
  event,
}: {
  event: Event;
}) {
  const schedule = event.resource as Schedule;
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <div
      className={`
        ${isMobile ? "text-[6px] p-0.5" : "text-[8px] p-0.5"}
        leading-tight rounded border ${getSubjectColor(schedule.subject.name)}
        group relative overflow-hidden cursor-pointer hover:shadow-sm transition-all duration-150
        min-h-[20px] flex flex-col justify-center
      `}
      title={`${schedule.subject.name} - ${schedule.teacher.full_name} (${schedule.start_time.substring(0, 5)}-${schedule.end_time.substring(0, 5)})`}
    >
      <div className="font-semibold truncate leading-none mb-0.5">
        {schedule.subject.code}
      </div>
      <div className="truncate leading-none opacity-90">
        {schedule.classroom.room_number}
      </div>
    </div>
  );
});

const CustomToolbar = React.memo(function CustomToolbar({
  label,
  onNavigate,
}: {
  label: string;
  onNavigate: (action: "PREV" | "NEXT" | "TODAY") => void;
}) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <div
      className={`flex items-center justify-between mb-4 p-3 bg-white rounded-lg border border-gray-200 ${
        isMobile ? "flex-col gap-3" : ""
      }`}
    >
      <div className={`flex items-center gap-2 ${isMobile ? "order-2" : ""}`}>
        <button
          onClick={() => onNavigate("TODAY")}
          className={`${isMobile ? "px-2 py-1 text-xs" : "px-3 py-2 text-sm"} font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300`}
        >
          Hari Ini
        </button>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => onNavigate("PREV")}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Bulan sebelumnya"
        >
          <ChevronLeftIcon className={`${isMobile ? "h-3 w-3" : "h-4 w-4"} text-gray-600`} />
        </button>

        <span
          className={`${isMobile ? "text-sm min-w-[120px]" : "text-lg min-w-[140px]"} font-semibold text-gray-900 text-center`}
        >
          {label}
        </span>

        <button
          onClick={() => onNavigate("NEXT")}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Bulan berikutnya"
        >
          <ChevronRightIcon className={`${isMobile ? "h-3 w-3" : "h-4 w-4"} text-gray-600`} />
        </button>
      </div>

      {!isMobile && <div className="w-20" />}
    </div>
  );
});

const ClickableDateCell = React.memo(function ClickableDateCell({
  date,
  onClick,
  dayEvents,
  isToday,
  isCurrentMonth,
  todayHighlight,
}: {
  date: Date;
  onClick: (date: Date) => void;
  dayEvents: Event[];
  isToday: boolean;
  isCurrentMonth: boolean;
  todayHighlight: boolean;
}) {
  return (
    <div
      className={`rbc-date-cell ${isToday ? "rbc-now" : ""} ${
        isToday && todayHighlight ? "animate-pulse" : ""
      } ${!isCurrentMonth ? "text-gray-400" : ""} ${
        dayEvents.length > 0 ? "cursor-pointer hover:bg-gray-50" : ""
      } relative`}
      onClick={() => onClick(date)}
    >
      {date.getDate()}
      {dayEvents.length > 0 && (
        <div className="absolute bottom-1 right-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full" />
        </div>
      )}
    </div>
  );
});

export default function Page() {
  const { schedules, fetchSchedules, deleteSchedule } = useScheduleStore();
  const { subjects, fetchSubjects } = useStudyStore();
  const { teachers, fetchTeachers } = useTeacherStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [todayHighlight, setTodayHighlight] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showMoreModal, setShowMoreModal] = useState(false);
  const [selectedDateEvents, setSelectedDateEvents] = useState<Event[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubjectManagementOpen, setIsSubjectManagementOpen] = useState(false);

  useEffect(() => {
    const getAuthData = () => {
      try {
        const authStorage = localStorage.getItem("auth-storage");

        if (authStorage) {
          const authData: AuthState = JSON.parse(authStorage);
          setCurrentUser(authData.state.user);
        }
      } catch (error) {
        console.error("Error reading auth data from localStorage:", error);
      }
    };

    getAuthData();
  }, []);

  const isAdmin = currentUser?.role === "admin";
  const canEditDelete = isAdmin;
  const canAdd = isAdmin;

  const calendarEvents = useMemo(
    () =>
      schedules.map((schedule) => ({
        id: schedule.id,
        title: `${schedule.subject.code} - ${schedule.classroom.room_number}`,
        start: new Date(`${schedule.date}T${schedule.start_time}`),
        end: new Date(`${schedule.date}T${schedule.end_time}`),
        resource: schedule,
      })),
    [schedules]
  );

  const loadPageData = useCallback(
    async (refresh = false) => {
      if (refresh) {
        setIsRefreshing(true);
      }

      const results = await Promise.allSettled([
        fetchSchedules(),
        fetchSubjects(),
        fetchTeachers(),
      ]);

      const hasErrors = results.some((result) => result.status === "rejected");

      if (hasErrors) {
        toast.error("Gagal memuat sebagian data jadwal");
      }

      if (!refresh) {
        setIsPageLoading(false);
      }

      if (refresh) {
        setIsRefreshing(false);
      }
    },
    [fetchSchedules, fetchSubjects, fetchTeachers]
  );

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      await loadPageData(false);

      if (!isMounted) {
        return;
      }
    };

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, [loadPageData]);

  const handleViewSchedule = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setIsEditModalOpen(true);
  };

  const handleEditSchedule = (schedule: Schedule) => {
    if (!canEditDelete) {
      return;
    }

    setSelectedSchedule(schedule);
    setIsEditModalOpen(true);
  };

  const handleDeleteSchedule = () => {
    if (!selectedSchedule || !canEditDelete) {
      return;
    }

    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedSchedule) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteSchedule(selectedSchedule.id);
      await loadPageData(true);
      setIsDeleteModalOpen(false);
      setIsEditModalOpen(false);
      setSelectedSchedule(null);
      toast.success("Jadwal berhasil dihapus");
    } catch (error) {
      console.error("Error deleting schedule:", error);
      toast.error("Gagal menghapus jadwal");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
  };

  const handleShowMore = (events: Event[], date: Date) => {
    setSelectedDateEvents(events);
    setSelectedDate(date);
    setShowMoreModal(true);
  };

  const handleDateClick = (date: Date) => {
    const dayEvents = calendarEvents.filter((event) =>
      moment(event.start).isSame(date, "day")
    );

    if (dayEvents.length > 0) {
      handleShowMore(dayEvents, date);
    }
  };

  const navigateToPreviousMonth = () => {
    setCurrentDate((prevDate) => moment(prevDate).subtract(1, "month").toDate());
  };

  const navigateToNextMonth = () => {
    setCurrentDate((prevDate) => moment(prevDate).add(1, "month").toDate());
  };

  const navigateToToday = () => {
    setCurrentDate(new Date());
    setTodayHighlight(true);

    window.setTimeout(() => {
      setTodayHighlight(false);
    }, 2000);
  };

  const handleEventSelect = (event: Event) => {
    const schedule = event.resource as Schedule;

    if (canEditDelete) {
      handleEditSchedule(schedule);
      return;
    }

    handleViewSchedule(schedule);
  };

  const handleNavigate = (newDate: Date) => {
    setCurrentDate(newDate);
  };

  const eventStyleGetter = () => ({
    style: {
      padding: "0px",
      margin: "1px",
      borderRadius: "4px",
      fontSize: "9px",
      border: "1px solid",
    },
  });

  const renderShowMoreModal = () => {
    if (!showMoreModal || !selectedDate) {
      return null;
    }

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Semua Jadwal - {formatDateDDMMYYYY(selectedDate)}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {selectedDateEvents.length} jadwal pada hari ini
              </p>
            </div>
            <button
              onClick={() => setShowMoreModal(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[70vh]">
            <div className="grid gap-4">
              {selectedDateEvents.map((event, index) => {
                const schedule = event.resource as Schedule;

                return (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-l-4 ${getSubjectColor(schedule.subject.name).split(" ")[1]} bg-white border border-gray-200 hover:shadow-md transition-shadow`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${getSubjectColor(schedule.subject.name)}`}
                          >
                            {schedule.subject.code}
                          </span>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <ClockIcon className="h-4 w-4" />
                            <span>
                              {schedule.start_time.substring(0, 5)} - {schedule.end_time.substring(0, 5)}
                            </span>
                          </div>
                        </div>

                        <h4 className="font-semibold text-gray-900 mb-2 text-lg">
                          {schedule.subject.name}
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <UserIcon className="h-4 w-4" />
                            <span>Pengajar: {schedule.teacher.full_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <BuildingLibraryIcon className="h-4 w-4" />
                            <span>Kelas: {schedule.classroom.room_number}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        {canEditDelete ? (
                          <button
                            onClick={() => {
                              setShowMoreModal(false);
                              handleEditSchedule(schedule);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
                            title="Edit jadwal"
                          >
                            <PencilSquareIcon className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setShowMoreModal(false);
                              handleViewSchedule(schedule);
                            }}
                            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
                            title="Lihat detail"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end p-6 border-t border-gray-200">
            <button
              onClick={() => setShowMoreModal(false)}
              className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <ProtectedRoute allowedRoles={["admin", "teacher"]}>
      <div className="min-h-screen bg-gray-50 z-0">
        <HeaderComponent />
        <Toaster position="top-right" />

        <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4">
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Kalender Jadwal</h1>
                <p className="text-gray-600 text-sm">
                  {isAdmin
                    ? "Kelola jadwal mengajar - Klik tanggal untuk lihat semua jadwal"
                    : "Lihat jadwal mengajar - Klik tanggal untuk lihat semua jadwal"}
                </p>

                {currentUser && (
                  <div className="mt-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        currentUser.role === "admin"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {currentUser.role === "admin" ? "Administrator" : "Teacher"} - {currentUser.fullname}
                    </span>
                    {isRefreshing && (
                      <p className="text-xs text-blue-600 mt-2">Memperbarui data jadwal...</p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                {isAdmin && (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsSubjectManagementOpen(true)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2"
                    >
                      <BookOpenIcon className="h-4 w-4" />
                      <span className="text-sm">Mata Pelajaran</span>
                    </button>
                    <button
                      onClick={() => setIsAddModalOpen(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2"
                    >
                      <PlusIcon className="h-4 w-4" />
                      <span className="text-sm">Tambah Jadwal</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mb-6 bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Keterangan Mata Pelajaran</h3>
            <div className="flex flex-wrap gap-2">
              {subjects.map((subject) => (
                <div key={subject.id} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded ${getSubjectColor(subject.name).split(" ")[0]}`} />
                  <span className="text-xs text-gray-600">
                    {subject.code} - {subject.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {isPageLoading && calendarEvents.length === 0 ? (
            <CalendarSkeleton />
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 relative">
              {isRefreshing && (
                <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center rounded-xl">
                  <span className="text-sm font-medium text-gray-700">Memperbarui kalender...</span>
                </div>
              )}

              <div className="calendar-container">
                <Calendar
                  localizer={localizer}
                  events={calendarEvents}
                  startAccessor="start"
                  endAccessor="end"
                  style={{ height: 650 }}
                  views={["month"]}
                  view="month"
                  date={currentDate}
                  onNavigate={handleNavigate}
                  onSelectEvent={handleEventSelect}
                  components={{
                    event: CompactEventComponent,
                    toolbar: CustomToolbar,
                    month: {
                      dateHeader: ({ date }: { date: Date }) => {
                        const dayEvents = calendarEvents.filter((event) =>
                          moment(event.start).isSame(date, "day")
                        );

                        return (
                          <ClickableDateCell
                            date={date}
                            onClick={handleDateClick}
                            dayEvents={dayEvents}
                            isToday={moment(date).isSame(new Date(), "day")}
                            isCurrentMonth={moment(date).isSame(currentDate, "month")}
                            todayHighlight={todayHighlight}
                          />
                        );
                      },
                    },
                  }}
                  eventPropGetter={eventStyleGetter}
                  messages={{
                    next: "Next",
                    previous: "Prev",
                    today: "Today",
                    month: "Month",
                    noEventsInRange: "Tidak ada jadwal",
                    showMore: (total) => `+${total} jadwal lainnya`,
                  }}
                  popup
                  showMultiDayTimes={false}
                  doShowMoreDrillDown={true}
                  onShowMore={handleShowMore}
                  step={60}
                  timeslots={1}
                />
              </div>
            </div>
          )}
        </main>

        <style jsx>{`
          @keyframes blink {
            0%,
            100% {
              background-color: transparent;
            }
            50% {
              background-color: #fef3c7;
            }
          }

          .animate-pulse {
            animation: blink 0.5s ease-in-out 3;
          }
        `}</style>

        {canAdd && (
          <AddScheduleModal
            isOpen={isAddModalOpen}
            subjects={subjects}
            onClose={() => setIsAddModalOpen(false)}
          />
        )}

        {canEditDelete && (
          <EditScheduleModal
            isOpen={isEditModalOpen}
            schedule={selectedSchedule}
            subjects={subjects}
            teachers={teachers}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedSchedule(null);
            }}
            onDelete={handleDeleteSchedule}
          />
        )}

        <SubjectManagement
          isOpen={isSubjectManagementOpen}
          onClose={() => setIsSubjectManagementOpen(false)}
        />

        {renderShowMoreModal()}

        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={handleCancelDelete}
          onConfirm={handleConfirmDelete}
          scheduleName={
            selectedSchedule
              ? `${selectedSchedule.subject.name} - ${selectedSchedule.teacher.full_name} (${selectedSchedule.start_time.substring(0, 5)}-${selectedSchedule.end_time.substring(0, 5)})`
              : ""
          }
          isLoading={isDeleting}
        />
      </div>
    </ProtectedRoute>
  );
}
