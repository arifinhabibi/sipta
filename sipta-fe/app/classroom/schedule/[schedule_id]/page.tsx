"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ProtectedRoute } from "@/app/components/ProtectedRoute";
import HeaderComponent from "@/app/components/HeaderComponent";
import { useScheduleStore } from "@/src/state/ScheduleStore";
import toast from "react-hot-toast";
import { Student } from "@/src/domain/StudentEntity";
import ScheduleSkeleton from "@/app/components/schedules/ScheduleSkeleton";

export default function Page() {
  const params = useParams<{ schedule_id: string }>();
  const router = useRouter();
  const id = params.schedule_id;
  const fetchSchedule = useScheduleStore((s) => s.fetchSchedule);
  const loading = useScheduleStore((s) => s.loading);
  const studentAttendance = useScheduleStore((s) => s.studentAttendance);
  const { schedule } = useScheduleStore();

  // State untuk data input pengguna
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [accomplishments, setAccomplishments] = useState<
    Record<string, Record<string, number | boolean>>
  >({});
  const [grades, setGrades] = useState<Record<string, Record<string, string>>>(
    {}
  );
  const [notes, setNotes] = useState<Record<string, string>>({});

  // State untuk popup dan checkout
  const [showPopup, setShowPopup] = useState(false);
  const [showCompletedPopup, setShowCompletedPopup] = useState(false);
  const [canCheckout, setCanCheckout] = useState(false);

  // Fungsi untuk generate grade berdasarkan nilai
  const generateGrade = (score: number): string => {
    if (score >= 85) return "A";
    if (score >= 75) return "B";
    if (score >= 65) return "C";
    return "D";
  };

  // Fungsi untuk menentukan is_capable berdasarkan score (untuk skill type)
  const determineIsCapable = (score: number): boolean => {
    return score >= 65; // >= 65 = true, < 65 = false
  };

  // Fungsi untuk menghitung total score dan grade (hanya untuk skill type)
  const calculateTotalGrade = (
    studentId: string
  ): { total: number; grade: string } => {
    const studentAccomplishments = accomplishments[studentId] || {};
    let total = 0;
    let count = 0;

    schedule?.accomplishments?.forEach((acc: any) => {
      if (acc.type === "skill") {
        const score = studentAccomplishments[acc.id];
        if (typeof score === "number") {
          total += score;
          count++;
        }
      }
    });

    // Hitung rata-rata jika ada skill accomplishments
    const average = count > 0 ? total / count : 0;
    const grade = generateGrade(average);
    return { total: Math.round(average), grade };
  };

  useEffect(() => {
    if (!id) return;
    fetchSchedule(id);
  }, [id]);

  useEffect(() => {
    if (!schedule?.start_time) return;

    const now = new Date();
    const [startHours, startMinutes] = schedule.start_time
      .split(":")
      .map(Number);

    // Buat objek waktu mulai
    const startTime = new Date();
    startTime.setHours(startHours, startMinutes, 0, 0);

  }, [schedule]);

  // Cek apakah schedule sudah completed dan tampilkan popup
  useEffect(() => {
    if (schedule?.is_completed) {
      setShowCompletedPopup(true);
    }
  }, [schedule]);

  // Cek apakah sudah bisa checkout (setelah jam pelajaran habis)
  useEffect(() => {
    if (schedule?.end_time) {
      const checkCheckoutAvailability = () => {
        const now = new Date();
        const [endHours, endMinutes] = schedule.end_time.split(":").map(Number);
        const endTime = new Date();
        endTime.setHours(endHours, endMinutes, 0, 0);

        setCanCheckout(now >= endTime);
      };

      checkCheckoutAvailability();
      // Check every minute
      const interval = setInterval(checkCheckoutAvailability, 60000);

      return () => clearInterval(interval);
    }
  }, [schedule]);

  // Inisialisasi nilai awal dari schedule
  useEffect(() => {
    if (schedule?.classroom?.students) {
      // inisialisasi data default
      const initAttendance: Record<string, string> = {};
      const initAccomplishments: Record<string, Record<string, number | boolean>> = {};
      const initGrades: Record<string, Record<string, string>> = {};
      const initNotes: Record<string, string> = {};

      schedule.classroom.students.forEach((student: any) => {
        initAttendance[student.id] = student.attendance?.status || "present";
        initNotes[student.id] = student.attendance?.note || "";

        const accMap: Record<string, number | boolean> = {};
        const gradeMap: Record<string, string> = {};

        student.accomplishments?.forEach((acc: any) => {
          const accomplishment = schedule.accomplishments.find(
            (a: any) => a.id === acc.accomplishment_id
          );
          
          if (accomplishment) {
            if (accomplishment.type === "knowledge") {
              // Untuk knowledge, gunakan is_capable (boolean)
              accMap[acc.accomplishment_id] = Boolean(acc.is_capable);
            } else if (accomplishment.type === "skill") {
              // Untuk skill, gunakan score (number) - konversi dari is_capable jika perlu
              // Karena di data existing hanya ada is_capable, kita set default score
              accMap[acc.accomplishment_id] = acc.is_capable ? 80 : 40; // Default values
              gradeMap[acc.accomplishment_id] = generateGrade(acc.is_capable ? 80 : 40);
            }
          }
        });

        // Inisialisasi nilai default untuk accomplishments yang belum ada
        schedule.accomplishments?.forEach((acc: any) => {
          if (accMap[acc.id] === undefined) {
            if (acc.type === "knowledge") {
              accMap[acc.id] = false; // Default false untuk knowledge
            } else if (acc.type === "skill") {
              accMap[acc.id] = 0; // Default 0 untuk skill
              gradeMap[acc.id] = generateGrade(0);
            }
          }
        });

        initAccomplishments[student.id] = accMap;
        initGrades[student.id] = gradeMap;
      });

      setAttendance(initAttendance);
      setAccomplishments(initAccomplishments);
      setGrades(initGrades);
      setNotes(initNotes);

      // 🔹 coba muat draft jika ada
      loadDraft();
    }
  }, [schedule]);

  const handleAttendanceChange = (studentId: string, value: string) => {
    setAttendance((prev) => ({ ...prev, [studentId]: value }));
  };

  const handleKnowledgeChange = (
    studentId: string,
    accId: string,
    value: boolean
  ) => {
    setAccomplishments((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [accId]: value,
      },
    }));
  };

  const handleSkillChange = (
    studentId: string,
    accId: string,
    value: string
  ) => {
    const score = parseInt(value) || 0;

    setAccomplishments((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [accId]: score,
      },
    }));

    // Auto generate grade (hanya untuk tampilan frontend)
    setGrades((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [accId]: generateGrade(score),
      },
    }));
  };

  const handleNoteChange = (studentId: string, value: string) => {
    setNotes((prev) => ({ ...prev, [studentId]: value }));
  };

  const handleSubmit = () => {
  // bentuk payload siap kirim
  const payload = schedule?.classroom.students.map((student: Student) => ({
    student_id: student.id,
    attendance: attendance[student.id],
    note: notes[student.id],
    accomplishments: schedule.accomplishments.map((acc: any) => {
      const accomplishmentValue = accomplishments[student.id]?.[acc.id];
      
      if (acc.type === "knowledge") {
        // Untuk knowledge, kirim is_capable langsung dari checkbox
        return {
          accomplishment_id: acc.id,
          is_capable: Boolean(accomplishmentValue),
          score: null, // Untuk knowledge, score bisa null
        };
      } else {
        // Untuk skill, kirim score (score) dan is_capable sementara
        const score = typeof accomplishmentValue === "number" ? accomplishmentValue : 0;
        return {
          accomplishment_id: acc.id,
          score: score, // Kirim score sebagai score
          is_capable: score >= 65, // Juga kirim is_capable yang dihitung di frontend
        };
      }
    }),
  }));

  // console.log("Payload yang dikirim:", payload); // Untuk debugging

  studentAttendance({
    schedule_id: id,
    students: payload,
  })
    .then((resp: any) => {
      toast.success(resp.message);
      localStorage.removeItem(`draft-${id}`);
      setShowPopup(true); // Tampilkan popup setelah submit berhasil
    })
    .catch((err: any) => {
      toast.error(err.message);
    });
};

  const saveDraft = () => {
    if (!id) return;
    const draftData = {
      attendance,
      accomplishments,
      grades,
      notes,
    };
    localStorage.setItem(`draft-${id}`, JSON.stringify(draftData));
    toast.success("Data berhasil disimpan sementara!");
  };

  const loadDraft = () => {
    if (!id) return;
    const savedDraft = localStorage.getItem(`draft-${id}`);
    if (savedDraft) {
      const data = JSON.parse(savedDraft);
      setAttendance(data.attendance || {});
      setAccomplishments(data.accomplishments || {});
      setGrades(data.grades || {});
      setNotes(data.notes || {});
    }
  };

  const handleBackToDashboard = () => {
    router.push("/"); // Ganti dengan path dashboard yang sesuai
  };

  const handleCheckout = () => {
    if (!canCheckout) {
      toast.error(
        "Checkout absensi hanya dapat dilakukan setelah jam pelajaran berakhir"
      );
      return;
    }

    // Logika untuk checkout absensi
    toast.success("Checkout absensi berhasil!");
    setShowPopup(false);
    router.push("/"); // atau halaman lain setelah checkout
  };

  // Handler untuk popup schedule completed
  const handleCompletedPopupAction = () => {
    setShowCompletedPopup(false);
    router.push(`/classroom/history/${id}`);
  };

  return (
    <ProtectedRoute allowedRoles={["teacher", "admin"]}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 pb-20">
        <HeaderComponent />

        <main className="max-w-7xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-semibold">
                  {schedule?.classroom.name}
                </h1>
                <p className="text-gray-500 text-sm">
                  {schedule?.subject.name}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-700">
                  {schedule?.teacher.full_name}
                </p>
                <p className="text-xs text-gray-400">{schedule?.date}</p>
                {schedule?.end_time && (
                  <p
                    className={`text-xs ${
                      canCheckout ? "text-green-600" : "text-orange-600"
                    }`}
                  >
                    {canCheckout
                      ? "✓ Bisa checkout"
                      : `Menunggu jam ${schedule.end_time}`}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="px-4 py-3">
            <h2 className="font-semibold text-gray-800 mb-2">Daftar Siswa</h2>
            <p className="text-sm text-gray-500 mb-4">
              Tandai kehadiran, pencapaian, dan catatan
            </p>

            {/* Legend untuk grading system */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Sistem Penilaian:
              </h3>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-green-500 rounded"></span>
                  <span>&gt; 85 = A</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-blue-500 rounded"></span>
                  <span>&gt; 75 = B</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-yellow-500 rounded"></span>
                  <span>&gt; 65 = C</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-red-500 rounded"></span>
                  <span>&gt; 0 = D</span>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-600">
                <p>• <strong>Knowledge</strong>: Checklist (Mampu/Tidak Mampu)</p>
                <p>• <strong>Skill</strong>: Skor 0-100, ≥65 = Mampu, &lt;65 = Tidak Mampu</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
              {loading ? (
                <ScheduleSkeleton />
              ) : (
                schedule?.classroom.students.map(
                  (student: any, index: number) => {
                    const { total, grade } = calculateTotalGrade(student.id);
                    const gradeColor =
                      {
                        A: "text-green-600 bg-green-50 border-green-200",
                        B: "text-blue-600 bg-blue-50 border-blue-200",
                        C: "text-yellow-600 bg-yellow-50 border-yellow-200",
                        D: "text-orange-600 bg-orange-50 border-orange-200",
                        E: "text-red-600 bg-red-50 border-red-200",
                      }[grade] || "text-gray-600 bg-gray-50 border-gray-200";

                    return (
                      <div
                        key={student.id}
                        className="p-3 rounded-xl bg-gray-50 border border-gray-200"
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <div className="min-w-0">
                                <p className="font-medium text-gray-800 truncate">
                                  {student.fullname}
                                </p>
                              </div>

                              <div className="flex flex-col items-end gap-1">
                                <select
                                  value={attendance[student.id] || "present"}
                                  onChange={(e) =>
                                    handleAttendanceChange(
                                      student.id,
                                      e.target.value
                                    )
                                  }
                                  className="text-xs border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400"
                                >
                                  <option value="present">Hadir</option>
                                  <option value="sick">Sakit</option>
                                  <option value="permission">Izin</option>
                                  <option value="absent">Alpa</option>
                                </select>

                                {/* Total Score & Grade - hanya tampilkan jika ada skill accomplishments */}
                                {attendance[student.id] === "present" &&
                                  total > 0 && (
                                    <div
                                      className={`text-xs px-2 py-1 rounded border ${gradeColor}`}
                                    >
                                      Rata-rata Skill: {total} ({grade})
                                    </div>
                                  )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <input
                            type="text"
                            placeholder="Catatan (opsional)"
                            value={notes[student.id] || ""}
                            onChange={(e) =>
                              handleNoteChange(student.id, e.target.value)
                            }
                            className="w-full border rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400"
                          />
                        </div>

                        {attendance[student.id] === "present" && (
                          <div className="mt-3">
                            <p className="text-sm font-medium text-gray-700 mb-2">
                              Pencapaian:
                            </p>
                            <div className="space-y-3">
                              {schedule?.accomplishments?.map((acc: any) => {
                                const currentValue = accomplishments[student.id]?.[acc.id];
                                
                                if (acc.type === "knowledge") {
                                  // Tampilkan checkbox untuk knowledge
                                  const isChecked = Boolean(currentValue);
                                  const statusColor = isChecked ? "text-green-600" : "text-red-600";
                                  
                                  return (
                                    <div
                                      key={acc.id}
                                      className="flex items-center justify-between gap-2 p-2 bg-white rounded border"
                                    >
                                      <label className="flex items-center gap-2 text-sm text-gray-600 flex-1">
                                        <span className="text-xs font-medium min-w-[120px]">
                                          {acc.name}
                                        </span>
                                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                          Knowledge
                                        </span>
                                      </label>

                                      <div className="flex items-center gap-2">
                                        <input
                                          type="checkbox"
                                          checked={isChecked}
                                          onChange={(e) =>
                                            handleKnowledgeChange(
                                              student.id,
                                              acc.id,
                                              e.target.checked
                                            )
                                          }
                                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-400"
                                        />
                                        {/* <span className={`text-xs ${statusColor}`}>
                                          {isChecked ? "Mampu" : "Tidak Mampu"}
                                        </span> */}
                                      </div>
                                    </div>
                                  );
                                } else if (acc.type === "skill") {
                                  // Tampilkan input number untuk skill
                                  const currentScore = typeof currentValue === 'number' ? currentValue : 0;
                                  const currentGrade = grades[student.id]?.[acc.id] || "E";
                                  const isCapable = determineIsCapable(currentScore);
                                  const gradeColor =
                                    {
                                      A: "text-green-600",
                                      B: "text-blue-600",
                                      C: "text-yellow-600",
                                      D: "text-orange-600",
                                      E: "text-red-600",
                                    }[currentGrade] || "text-gray-600";
                                  const statusColor = isCapable ? "text-green-600" : "text-red-600";

                                  return (
                                    <div
                                      key={acc.id}
                                      className="flex items-center justify-between gap-2 p-2 bg-white rounded border"
                                    >
                                      <label className="flex items-center gap-2 text-sm text-gray-600 flex-1">
                                        <span className="text-xs font-medium min-w-[120px]">
                                          {acc.name}
                                        </span>
                                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                          Skill
                                        </span>
                                      </label>

                                      <div className="flex items-center gap-2">
                                        <input
                                          type="number"
                                          min="0"
                                          max="100"
                                          value={currentScore}
                                          onChange={(e) =>
                                            handleSkillChange(
                                              student.id,
                                              acc.id,
                                              e.target.value
                                            )
                                          }
                                          className="w-16 text-xs border rounded px-2 py-1 text-center focus:outline-none focus:ring-1 focus:ring-blue-400"
                                          placeholder="0-100"
                                        />
                                        <span
                                          className={`text-xs font-bold ${gradeColor} min-w-[20px]`}
                                        >
                                          {currentGrade}
                                        </span>
                                        <span className={`text-xs ${statusColor}`}>
                                          {isCapable ? "Mampu" : "Tidak Mampu"}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                }
                                
                                return null;
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }
                )
              )}
            </div>
          </div>

          <div className="flex justify-between px-4 py-3 border-t bg-white sticky bottom-0">
            <button
              onClick={saveDraft}
              className="flex-1 py-2 mr-2 border rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Simpan Draft
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 py-2 ml-2 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors"
            >
              Submit
            </button>
          </div>
        </main>

        {/* Popup setelah submit */}
        {showPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>

                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Absensi Berhasil Disimpan!
                </h3>
                <p className="text-gray-600 mb-6">
                  Data absensi siswa telah berhasil disimpan. Anda bisa kembali
                  ke dashboard atau melakukan checkout absensi.
                </p>

                <div className="space-y-3">
                  <button
                    onClick={handleBackToDashboard}
                    className="w-full py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Kembali ke Dashboard
                  </button>

                  <button
                    onClick={handleCheckout}
                    className={`w-full py-3 font-medium rounded-lg transition-colors ${
                      canCheckout
                        ? "bg-green-500 text-white hover:bg-green-600"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                    disabled={!canCheckout}
                  >
                    Checkout Absensi
                  </button>

                  {!canCheckout && (
                    <p className="text-xs text-orange-600 mt-2">
                      * Checkout hanya bisa dilakukan setelah jam pelajaran
                      berakhir
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Popup ketika schedule sudah completed */}
        {showCompletedPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>

                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Absensi Sudah Selesai
                </h3>
                <p className="text-gray-600 mb-6">
                  Absensi untuk jadwal ini sudah selesai dan tidak dapat diubah.
                  Anda akan diarahkan ke halaman review kelas.
                </p>

                <div className="space-y-3">
                  <button
                    onClick={handleCompletedPopupAction}
                    className="w-full py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Lihat Review Kelas
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}