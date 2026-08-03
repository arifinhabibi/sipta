import { PayloadCreateSchedules, Subject } from "@/src/domain/ScheduleEntity";
import { useClassroomStore } from "@/src/state/ClassroomStore";
import { useScheduleStore } from "@/src/state/ScheduleStore";
import { useTeacherStore } from "@/src/state/TeacherStore";
import {
  XMarkIcon,
  PlusIcon,
  MinusIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface ScheduleItem {
  id: string;
  classroom_id: string;
  subject_id: string;
  start_time: string;
  end_time: string;
  teacher_id: string;
  date: string; // Tambahkan field date
}

export const AddScheduleModal: React.FC<{
  isOpen: boolean;
  subjects: Subject[];
  onClose: () => void;
}> = ({ isOpen, subjects, onClose }) => {
  const { teachers, fetchTeachers } = useTeacherStore();
  const { fetchSchedules, createSchedules } = useScheduleStore();
  const { classrooms, fetchClassrooms } = useClassroomStore();
  const [academicYear, setAcademicYear] = useState({
    id: "",
    name: "",
    periode: "",
    start_periode: "",
    end_periode: "",
  });

  // Hapus selectedDay dan ganti dengan selectedDate
  const [selectedDate, setSelectedDate] = useState("");
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([
    {
      id: "1",
      classroom_id: "",
      subject_id: "",
      start_time: "",
      end_time: "",
      teacher_id: "",
      date: "", // Tambahkan date di initial state
    },
  ]);

  useEffect(() => {
    fetchClassrooms().catch((err) => console.error(err.message));
    fetchTeachers().catch((err) => console.error(err.message));
  }, [fetchTeachers, fetchClassrooms]);

  useEffect(() => {
    const authData = localStorage.getItem("auth-storage");
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        setAcademicYear(parsed.state?.academic_year || {});
      } catch (err) {
        toast.error("Gagal membaca data login.");
      }
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Set tanggal default ke hari ini
      const today = new Date().toISOString().split("T")[0];
      setSelectedDate(today);
      setScheduleItems([
        {
          id: "1",
          classroom_id: "",
          subject_id: "",
          start_time: "",
          end_time: "",
          teacher_id: "",
          date: today, // Set default date
        },
      ]);
    }
  }, [isOpen]);

  const addScheduleItem = () => {
    const newItem: ScheduleItem = {
      id: Date.now().toString(),
      classroom_id: "",
      subject_id: "",
      start_time: "",
      end_time: "",
      teacher_id: "",
      date: selectedDate, // Gunakan selectedDate yang sama
    };
    setScheduleItems([...scheduleItems, newItem]);
  };

  const removeScheduleItem = (id: string) => {
    if (scheduleItems.length > 1) {
      setScheduleItems(scheduleItems.filter((item) => item.id !== id));
    } else {
      toast.error("Minimal harus ada satu jadwal");
    }
  };

  const updateScheduleItem = (
    id: string,
    field: keyof ScheduleItem,
    value: string
  ) => {
    setScheduleItems(
      scheduleItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  // Update semua schedule items ketika tanggal berubah
  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    setScheduleItems(
      scheduleItems.map((item) => ({
        ...item,
        date: newDate,
      }))
    );
  };

  const validateScheduleItems = (): boolean => {
    let isValid = true;

    // Validasi tanggal
    if (!selectedDate) {
      toast.error("Tanggal harus dipilih");
      isValid = false;
    }

    // Validasi setiap item
    scheduleItems.forEach((item, index) => {
      if (!item.classroom_id) {
        toast.error(`Kelas harus dipilih untuk jadwal ke-${index + 1}`);
        isValid = false;
      }
      if (!item.subject_id) {
        toast.error(
          `Mata pelajaran harus dipilih untuk jadwal ke-${index + 1}`
        );
        isValid = false;
      }
      if (!item.start_time) {
        toast.error(`Waktu mulai harus diisi untuk jadwal ke-${index + 1}`);
        isValid = false;
      }
      if (!item.end_time) {
        toast.error(`Waktu selesai harus diisi untuk jadwal ke-${index + 1}`);
        isValid = false;
      }
      if (
        item.start_time &&
        item.end_time &&
        item.start_time >= item.end_time
      ) {
        toast.error(
          `Waktu selesai harus setelah waktu mulai untuk jadwal ke-${index + 1}`
        );
        isValid = false;
      }
      if (!item.teacher_id) {
        toast.error(`Guru harus dipilih untuk jadwal ke-${index + 1}`);
        isValid = false;
      }
      if (!item.date) {
        toast.error(`Tanggal harus diisi untuk jadwal ke-${index + 1}`);
        isValid = false;
      }
    });

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateScheduleItems()) {
      return;
    }

    try {
      const promises = scheduleItems.map((item) => {
        const requestData = {
          subject_id: item.subject_id,
          classroom_id: item.classroom_id,
          teacher_id: item.teacher_id,
          academic_year_id: academicYear.id,
          date: item.date, // Gunakan tanggal spesifik
          start_time: item.start_time,
          end_time: item.end_time,
          // Hapus start_periode dan end_periode karena backend sudah menggunakan bulan ini
        };

        return createSchedules(requestData);
      });

      const results = await Promise.allSettled(promises);

      let successCount = 0;
      let errorCount = 0;

      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          successCount++;
          // console.log(`Jadwal ke-${index + 1} berhasil dibuat:`, result.value);
        } else {
          errorCount++;
          console.error(`Jadwal ke-${index + 1} gagal:`, result.reason);
        }
      });

      if (successCount > 0) {
        toast.success(`Berhasil menambahkan ${successCount} jadwal`);
      }
      if (errorCount > 0) {
        toast.error(`Gagal menambahkan ${errorCount} jadwal`);
      }

      // Refresh daftar jadwal
      await fetchSchedules();
      onClose();
    } catch (error) {
      console.error("Error adding schedules:", error);
      toast.error("Terjadi kesalahan saat menambahkan jadwal");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header - Sticky */}
        <div className="flex-shrink-0 sticky top-0 bg-white z-10 rounded-t-xl">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Tambah Jadwal Baru
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Date Selection - Ganti Day Selection dengan Date Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal *
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  min={new Date().toISOString().split("T")[0]} // Tidak bisa pilih tanggal sebelum hari ini
                />
                <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
              {selectedDate && (
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(selectedDate).toLocaleDateString("id-ID", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              )}
            </div>

            {/* Schedule Items List */}
            <div className="space-y-4">
              {/* Schedule List Header - Sticky */}
              <div className="sticky top-0 bg-white py-2 z-5 -mx-2 px-2 border-b border-gray-100">
                <div className="flex justify-between items-center">
                  <h3 className="text-md font-medium text-gray-900">
                    Daftar Jadwal ({scheduleItems.length})
                  </h3>
                  <button
                    type="button"
                    onClick={addScheduleItem}
                    className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-sm"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Tambah Jadwal
                  </button>
                </div>
              </div>

              {/* Schedule Items */}
              <div className="space-y-4 pt-2">
                {scheduleItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="border border-gray-200 rounded-lg p-4 space-y-4 bg-white shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium text-gray-700">
                        Jadwal {index + 1}
                      </h4>
                      <button
                        type="button"
                        onClick={() => removeScheduleItem(item.id)}
                        className="text-red-500 hover:text-red-700 transition-colors disabled:text-gray-300 disabled:cursor-not-allowed"
                        disabled={scheduleItems.length === 1}
                      >
                        <MinusIcon className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Classroom Selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Kelas *
                        </label>
                        <select
                          value={item.classroom_id}
                          onChange={(e) =>
                            updateScheduleItem(
                              item.id,
                              "classroom_id",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        >
                          <option value="">Pilih Kelas</option>
                          {classrooms.map((classroom) => (
                            <option key={classroom.id} value={classroom.id}>
                              {classroom.name} ({classroom.room_number})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Subject Selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Mata Pelajaran *
                        </label>
                        <select
                          value={item.subject_id}
                          onChange={(e) =>
                            updateScheduleItem(
                              item.id,
                              "subject_id",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        >
                          <option value="">Pilih Mata Pelajaran</option>
                          {subjects.map((subject) => (
                            <option key={subject.id} value={subject.id}>
                              {subject.name} ({subject.code})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Teacher Selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Guru *
                        </label>
                        <select
                          value={item.teacher_id}
                          onChange={(e) =>
                            updateScheduleItem(
                              item.id,
                              "teacher_id",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        >
                          <option value="">Pilih Guru</option>
                          {teachers.map((teacher) => (
                            <option key={teacher.id} value={teacher.id}>
                              {teacher.full_name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Time Selection */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Waktu Mulai *
                          </label>
                          <input
                            type="time"
                            value={item.start_time}
                            onChange={(e) =>
                              updateScheduleItem(
                                item.id,
                                "start_time",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Waktu Selesai *
                          </label>
                          <input
                            type="time"
                            value={item.end_time}
                            onChange={(e) =>
                              updateScheduleItem(
                                item.id,
                                "end_time",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons - Sticky Bottom */}
            <div className="sticky bottom-0 bg-white py-4 -mx-6 px-6 border-t border-gray-200 mt-6">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors shadow-sm"
                >
                  Simpan ({scheduleItems.length}) Jadwal
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
