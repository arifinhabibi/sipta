"use client";

import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";

import {
    ArrowLeftIcon,
    FireIcon,
    LightBulbIcon,
    UserIcon,
    CalendarDaysIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    InformationCircleIcon,
    PencilIcon,
    XMarkIcon,
    ArrowPathIcon,
    ExclamationTriangleIcon,
    LockClosedIcon,
} from "@heroicons/react/24/outline";

import { useReportStore } from "@/src/state/ReportStore";
import { useAcademicYearStore } from "@/src/state/AcademicYearStore";
import getStifin from "@/src/stifin";
import HeaderComponent from "@/app/components/HeaderComponent";
import { ProtectedRoute } from "@/app/components/ProtectedRoute";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import SemesterSelector from "@/app/components/reports/students/SemesterSelector";
import { Alert } from "@/app/components/ui";

interface Props {
    params: {
        student_id: string;
    };
}

interface Accomplishment {
    id: string;
    name: string;
    type: string;
    score: number;
    is_capable: boolean;
}

interface Attendance {
    id: string;
    status: string;
    created_at: string;
    schedule: {
        id: string;
        date: string;
        start_time: string;
        end_time: string;
        subject: {
            id: string;
            name: string;
            accomplishments: Accomplishment[];
        };
    };
}

interface StudentData {
    student: {
        id: string;
        fullname: string;
        gender: string;
        birth_date: string;
        phone: string;
        address: string;
        photo: string;
        status: string;
    };
    classroom: {
        id: string;
        name: string;
        teacher: {
            id: string;
            full_name: string | null;
        };
    };
    academic_year: {
        id: string;
        name: string;
        periode: string;
    };
    summary: {
        total_attendance: number;
        present_count: number;
        attendance_percentage: number;
        final_score: number;
        average_scores: {
            creativity1: number;
            creativity2: number;
            attitude: number;
            skill: number;
        };
    };
    attendances: Attendance[];
}

// Interface untuk editing state
interface EditingScoreState {
    accomplishmentId: string;
    accomplishmentName: string;
    attendanceId: string;
    currentScore: number;
    type: 'skill' | 'knowledge';
    subject: string;
    date: string;
    isCapable?: boolean;
}

interface UpdateMessage {
    type: 'success' | 'error';
    text: string;
}

interface AccomplishmentWithMetadata extends Accomplishment {
    date: string;
    subject: string;
    attendanceId: string;
    scheduleId: string;
}

const formatDate = (date: string) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
};

const formatDateTime = (date: string) => {
    if (!date) return "-";
    return new Date(date).toLocaleString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const getStatusBadgeColor = (status: string) => {
    switch (status) {
        case "present":
            return "bg-green-100 text-green-700";
        case "absent":
            return "bg-red-100 text-red-700";
        case "sick":
            return "bg-yellow-100 text-yellow-700";
        case "permission":
            return "bg-blue-100 text-blue-700";
        case "late":
            return "bg-orange-100 text-orange-700";
        default:
            return "bg-gray-100 text-gray-700";
    }
};

const getStatusLabel = (status: string) => {
    switch (status) {
        case "present":
            return "Hadir";
        case "absent":
            return "Absen";
        case "sick":
            return "Sakit";
        case "permission":
            return "Izin";
        case "late":
            return "Terlambat";
        default:
            return status;
    }
};

const getScoreColor = (score: number): string => {
    if (score >= 90) return 'bg-green-100 text-green-800';
    if (score >= 80) return 'bg-blue-100 text-blue-800';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800';
    if (score >= 65) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
};

const getGrade = (score: number): string => {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 65) return 'D';
    return 'E';
};

export default function StudentDetailPage() {
    const params = useParams<{student_id: string}>();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { performanceStudentsByStudent, updatePerformanceStudent, exportPerformanceStudentPDF, canonicalPerformanceStudent } = useReportStore();
    const { academicYears, fetchAcademicYears, loading: yearsLoading } = useAcademicYearStore();
    const studentId = params.student_id;

    const [student, setStudent] = useState<StudentData | null>(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);

    // ---------- Semester selection (URL-driven, no active-term mutation) ----------
    // Docs reference: docs/frontend-architecture/21-semester-student-report.md
    const urlYearId = searchParams?.get("academic_year_id") || undefined;
    const activeYear = useMemo(() => academicYears.find((y) => y.is_active), [academicYears]);
    const newestYear = useMemo(() => {
        if (academicYears.length === 0) return undefined;
        return [...academicYears].sort(
            (a, b) => new Date(b.start_periode).getTime() - new Date(a.start_periode).getTime(),
        )[0];
    }, [academicYears]);

    // Resolve selection according to the spec:
    //  1. URL param wins if it matches an available term.
    //  2. Otherwise fall back to the active term.
    //  3. Otherwise newest term (labelled accurately in the UI).
    const selectedYear = useMemo(() => {
        if (!academicYears.length) return undefined;
        if (urlYearId) {
            const match = academicYears.find((y) => y.id === urlYearId);
            if (match) return match;
        }
        return activeYear ?? newestYear;
    }, [urlYearId, academicYears, activeYear, newestYear]);

    // Race-safe latest request tracker: fast-switching users cannot see a
    // stale response overwrite the current selection.
    const requestSeqRef = useRef(0);
    const [reportError, setReportError] = useState<string | null>(null);

    // If URL param is missing or invalid, back-fill it after we know the selection.
    useEffect(() => {
        if (!academicYears.length || !selectedYear || !studentId) return;
        if (urlYearId === selectedYear.id) return;
        // Use `replace` to avoid polluting history when we're just canonicalizing.
        const q = new URLSearchParams(searchParams?.toString() || "");
        q.set("academic_year_id", selectedYear.id);
        router.replace(`/reports/students/${studentId}?${q.toString()}`);
    }, [academicYears.length, selectedYear?.id, urlYearId, studentId, router, searchParams]);

    // Selector handler — writes to the URL (does not mutate active term).
    const handleSelectYear = useCallback(
        (id: string) => {
            if (!studentId) return;
            const q = new URLSearchParams(searchParams?.toString() || "");
            q.set("academic_year_id", id);
            router.push(`/reports/students/${studentId}?${q.toString()}`);
        },
        [router, searchParams, studentId],
    );

    const isHistorical = Boolean(selectedYear && !selectedYear.is_active);
    const isClosed = selectedYear?.status === "closed";
    // Edit / PDF controls remain enabled only for the *active* selected term,
    // matching the “active vs. historical behavior” contract in the docs.
    const editingAllowed = Boolean(selectedYear?.is_active);
    const pdfAllowed = editingAllowed; // legacy PDF endpoint has no semester arg → gate it too
    
    // State untuk edit
    const [editingScore, setEditingScore] = useState<EditingScoreState | null>(null);
    const [tempScore, setTempScore] = useState<number>(0);
    const [tempIsCapable, setTempIsCapable] = useState<boolean>(false);
    const [updateMessage, setUpdateMessage] = useState<UpdateMessage | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);

    // Fetch academic years once on mount so the selector is populated.
    useEffect(() => {
        if (academicYears.length === 0) {
            fetchAcademicYears().catch(() => {
                /* store surfaces its own error state */
            });
        }
    }, [fetchAcademicYears, academicYears.length]);

    useEffect(() => {
        async function load() {
            try {
                if (!studentId) return;
                if (academicYears.length && !selectedYear) return; // waiting on selection resolution
                const mySeq = ++requestSeqRef.current;
                setLoading(true);
                setReportError(null);
                // Prefer the semester-aware canonical endpoint. When no year is
                // selected yet (still loading years) we call it without the arg
                // so the backend returns the active term — matching v1 behavior.
                const response: any = selectedYear
                    ? await canonicalPerformanceStudent(studentId, selectedYear.id)
                    : await performanceStudentsByStudent(studentId);

                if (mySeq !== requestSeqRef.current) return; // stale response — ignore
                const data = response?.data;
                setStudent(data ?? null);
            } catch (error: any) {
                if (requestSeqRef.current) {
                    console.error(error);
                    setReportError(
                        error?.response?.data?.message ||
                            "Gagal memuat laporan siswa untuk semester ini.",
                    );
                    setStudent(null);
                }
            } finally {
                setLoading(false);
            }
        }

        load();
    }, [studentId, selectedYear?.id, academicYears.length, canonicalPerformanceStudent, performanceStudentsByStudent]);

    // Reset editing state saat student berubah
    useEffect(() => {
        setEditingScore(null);
        setUpdateMessage(null);
    }, [student]);

    const attendanceStats = useMemo(() => {
        if (!student) {
            return {
                present: 0,
                absent: 0,
                sick: 0,
                permission: 0,
                late: 0,
            };
        }

        const data = student.attendances || [];

        return {
            present: data.filter((x: Attendance) => x.status === "present").length,
            absent: data.filter((x: Attendance) => x.status === "absent").length,
            sick: data.filter((x: Attendance) => x.status === "sick").length,
            permission: data.filter((x: Attendance) => x.status === "permission").length,
            late: data.filter((x: Attendance) => x.status === "late").length,
        };
    }, [student]);

    // Get all accomplishments with metadata
    const allAccomplishments = useMemo<AccomplishmentWithMetadata[]>(() => {
        if (!student) return [];

        const accomplishments: AccomplishmentWithMetadata[] = [];

        student.attendances.forEach((att: Attendance) => {
            if (!att.schedule?.subject?.accomplishments) return;
            
            att.schedule.subject.accomplishments.forEach((item: Accomplishment) => {
                accomplishments.push({
                    ...item,
                    subject: att.schedule.subject.name,
                    date: att.schedule.date,
                    attendanceId: att.schedule.id,
                    scheduleId: att.schedule.id,
                });
            });
        });

        return accomplishments;
    }, [student]);

    const skills = allAccomplishments.filter((item: any) => item.type === "skill");
    const knowledge = allAccomplishments.filter((item: any) => item.type === "knowledge");

    // Skill yang capable (score >= 60)
    const capableSkills = skills.filter((item: any) => item.is_capable === true);
    const capableKnowledge = knowledge.filter((item: any) => item.is_capable === true);

    // Get STIFIN data
    const stifinData = useMemo(() => {
        if (!student?.student?.birth_date) return null;
        return getStifin(student.student.birth_date);
    }, [student?.student?.birth_date]);

    // Handler untuk update score
    const handleUpdateScore = useCallback(async (
        accomplishmentStudentId: string,
        accomplishmentName: string,
        newScore: number,
        attendanceId: string,
        type: 'skill' | 'knowledge',
        isCapable?: boolean
    ) => {
        try {
            setIsUpdating(true);

            const payload = {
                accomplishmentStudentId,
                accomplishmentName,
                newScore,
                attendanceId,
                type,
                isCapable
            };

            const response: any = await updatePerformanceStudent(
                studentId!,
                payload
            );

            if (response?.success) {
                const refreshedResponse: any = await performanceStudentsByStudent(studentId!);
                setStudent(refreshedResponse?.data ?? null);
            }

            return { success: true };
        } catch (error) {
            console.error('Error updating score:', error);
            throw error;
        } finally {
            setIsUpdating(false);
        }
    }, [studentId, updatePerformanceStudent, performanceStudentsByStudent]);

    // Handler untuk edit click
    const handleEditClick = useCallback((accomplishment: AccomplishmentWithMetadata) => {
        if (isUpdating) return;
        if (!editingAllowed) return; // read-only for historical semesters

        if (editingScore) {
            const confirmSwitch = window.confirm(
                'Anda sedang mengedit nilai lain. Beralih ke accomplishment ini akan membatalkan perubahan yang belum disimpan. Lanjutkan?'
            );
            if (!confirmSwitch) return;
            
            setEditingScore(null);
            setTempScore(0);
            setTempIsCapable(false);
            setUpdateMessage(null);
        }

        const editingState: EditingScoreState = {
            accomplishmentId: accomplishment.id,
            accomplishmentName: accomplishment.name,
            attendanceId: accomplishment.attendanceId,
            currentScore: accomplishment.score,
            type: accomplishment.type as 'skill' | 'knowledge',
            subject: accomplishment.subject,
            date: accomplishment.date,
            isCapable: accomplishment.is_capable
        };

        setEditingScore(editingState);
        setTempScore(accomplishment.score);
        setTempIsCapable(accomplishment.is_capable || false);
        setUpdateMessage(null);
    }, [editingScore, isUpdating, editingAllowed]);

    // Handler untuk cancel edit
    const handleCancelEdit = useCallback(() => {
        if (isUpdating) return;
        setEditingScore(null);
        setUpdateMessage(null);
        setTempScore(0);
        setTempIsCapable(false);
    }, [isUpdating]);

    // Handler untuk save score
    const handleScoreUpdate = useCallback(async () => {
        if (!editingScore || isUpdating) return;
        if (!editingAllowed) return; // guard: read-only for historical semesters

        setUpdateMessage(null);

        // Validasi untuk skill
        if (editingScore.type === 'skill') {
            if (!Number.isFinite(tempScore)) {
                setUpdateMessage({ type: 'error', text: 'Nilai skill tidak valid' });
                return;
            }

            if (tempScore < 0 || tempScore > 100) {
                setUpdateMessage({ type: 'error', text: 'Nilai skill harus antara 0–100' });
                return;
            }

            if (tempScore === editingScore.currentScore) {
                setUpdateMessage({ type: 'error', text: 'Tidak ada perubahan nilai' });
                return;
            }

            const confirmed = window.confirm(
                `Ubah nilai skill dari ${editingScore.currentScore} menjadi ${tempScore}?`
            );
            if (!confirmed) return;
        }

        // Validasi untuk knowledge
        if (editingScore.type === 'knowledge') {
            if (tempIsCapable === editingScore.isCapable) {
                setUpdateMessage({ type: 'error', text: 'Tidak ada perubahan status' });
                return;
            }

            const confirmed = window.confirm(
                `Ubah status pengetahuan dari ${editingScore.isCapable ? 'Capable' : 'Not Capable'} menjadi ${tempIsCapable ? 'Capable' : 'Not Capable'}?`
            );
            if (!confirmed) return;
        }

        setIsUpdating(true);

        try {
            await handleUpdateScore(
                editingScore.accomplishmentId,
                editingScore.accomplishmentName,
                editingScore.type === 'skill' ? tempScore : editingScore.currentScore,
                editingScore.attendanceId,
                editingScore.type,
                editingScore.type === 'knowledge' ? tempIsCapable : undefined
            );

            setUpdateMessage({
                type: 'success',
                text: editingScore.type === 'skill'
                    ? `Nilai skill berhasil diubah dari ${editingScore.currentScore} ke ${tempScore}`
                    : `Status pengetahuan berhasil diubah menjadi ${tempIsCapable ? 'Capable ✓' : 'Not Capable ✗'}`
            });

            setEditingScore(null);
            setTempScore(0);
            setTempIsCapable(false);

            setTimeout(() => {
                setUpdateMessage(null);
            }, 3000);

        } catch (err: any) {
            console.error('handleScoreUpdate error:', err);
            setUpdateMessage({
                type: 'error',
                text: err.response?.data?.message || 'Gagal menyimpan perubahan. Silakan coba lagi.'
            });
        } finally {
            setIsUpdating(false);
        }
    }, [editingScore, tempScore, tempIsCapable, handleUpdateScore, isUpdating, editingAllowed]);

    // Cek apakah accomplishment sedang diedit
    const isEditing = useCallback((accomplishmentId: string, attendanceId: string) => {
        return editingScore?.accomplishmentId === accomplishmentId && 
               editingScore?.attendanceId === attendanceId;
    }, [editingScore]);

    // Handler untuk download PDF
    const handleDownloadPDF = useCallback(async () => {
        if (!studentId || downloading) return;
        if (!pdfAllowed) return; // legacy PDF endpoint has no semester arg — never export while historical
        
        setDownloading(true);
        try {
            await exportPerformanceStudentPDF(studentId);
        } catch (error: any) {
            console.error('Error downloading PDF:', error);
            alert(error.response?.data?.message || 'Gagal mengunduh PDF. Silakan coba lagi.');
        } finally {
            setDownloading(false);
        }
    }, [studentId, downloading, pdfAllowed, exportPerformanceStudentPDF]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Memuat data siswa...</p>
                </div>
            </div>
        );
    }

    if (!student) {
        return (
            <ProtectedRoute allowedRoles={["admin", "teacher"]}>
                <div className="min-h-screen bg-[var(--sipta-background)] pb-8">
                    <HeaderComponent />
                    <main className="mx-auto max-w-5xl px-5 py-6 space-y-4">
                        {/* Selector remains available so users can switch semesters */}
                        <SemesterSelector
                            academicYears={academicYears}
                            selectedId={selectedYear?.id}
                            onChange={handleSelectYear}
                            loading={yearsLoading}
                        />
                        {reportError && (
                            <Alert
                                tone="destructive"
                                title="Gagal memuat laporan"
                                icon={<ExclamationTriangleIcon className="h-5 w-5" />}
                                testId="semester-report-error"
                            >
                                {reportError}
                            </Alert>
                        )}
                        <div
                            className="rounded-xl border p-6 text-center"
                            style={{
                                background: "var(--sipta-surface)",
                                borderColor: "var(--sipta-border)",
                            }}
                        >
                            <p className="text-sm" style={{ color: "var(--sipta-muted-fg)" }}>
                                Data laporan siswa tidak ditemukan untuk semester ini.
                            </p>
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="mt-4 rounded-lg px-4 py-2 text-sm font-semibold"
                                style={{
                                    background: "var(--sipta-primary)",
                                    color: "var(--sipta-primary-fg)",
                                }}
                                data-testid="student-report-back-empty"
                            >
                                Kembali
                            </button>
                        </div>
                    </main>
                </div>
            </ProtectedRoute>
        );
    }

    const stifin = getStifin(student.student.birth_date);

    return (
        <ProtectedRoute allowedRoles={["admin", "teacher"]}>
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 pb-8">
                <HeaderComponent />

                <main className="min-h-screen bg-slate-100 p-5 pb-20">
                    <div className="">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-5">
                            <button
                                onClick={() => router.back()}
                                className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow hover:shadow-md transition"
                                data-testid="student-report-back-button"
                            >
                                <ArrowLeftIcon className="h-5 w-5" />
                                Kembali
                            </button>
                            <button
                                onClick={handleDownloadPDF}
                                disabled={downloading || !pdfAllowed}
                                title={
                                    !pdfAllowed
                                        ? "Ekspor PDF hanya tersedia untuk semester aktif"
                                        : undefined
                                }
                                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-full shadow hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                data-testid="student-report-download-button"
                            >
                                {downloading ? (
                                    <ArrowPathIcon className="h-5 w-5 animate-spin" />
                                ) : (
                                    <ArrowDownTrayIcon className="h-5 w-5" />
                                )}
                                {downloading ? 'Mengunduh...' : 'Download PDF'}
                            </button>
                        </div>

                        {/* Semester selector — spec: 21-semester-student-report.md */}
                        <div className="mb-4">
                            <SemesterSelector
                                academicYears={academicYears}
                                selectedId={selectedYear?.id}
                                onChange={handleSelectYear}
                                loading={yearsLoading}
                            />
                        </div>

                        {/* Historical / archive banner */}
                        {isHistorical && (
                            <div className="mb-4">
                                <Alert
                                    tone={isClosed ? "warning" : "info"}
                                    title={isClosed ? "Arsip semester — hanya baca" : "Semester non-aktif"}
                                    icon={<LockClosedIcon className="h-5 w-5" />}
                                    testId="semester-archive-banner"
                                >
                                    Kontrol edit dan ekspor PDF dinonaktifkan untuk semester ini. Semester aktif operasional tidak berubah.
                                </Alert>
                            </div>
                        )}

                        {/* Report fetch error */}
                        {reportError && !loading && (
                            <div className="mb-4">
                                <Alert
                                    tone="destructive"
                                    title="Gagal memuat laporan"
                                    icon={<ExclamationTriangleIcon className="h-5 w-5" />}
                                    action={
                                        <button
                                            type="button"
                                            onClick={() => selectedYear && handleSelectYear(selectedYear.id)}
                                            className="text-xs font-semibold underline underline-offset-2 text-[var(--sipta-destructive)]"
                                            data-testid="semester-report-retry-button"
                                        >
                                            Coba lagi
                                        </button>
                                    }
                                    testId="semester-report-error"
                                >
                                    {reportError}
                                </Alert>
                            </div>
                        )}

                        {/* Update Message */}
                        {updateMessage && (
                            <div className={`mb-4 p-3 rounded-xl ${
                                updateMessage.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                            }`}>
                                <div className={`text-sm flex items-center gap-2 ${
                                    updateMessage.type === 'success' ? 'text-green-600' : 'text-red-600'
                                }`}>
                                    {updateMessage.type === 'success' ? (
                                        <CheckCircleIcon className="w-4 h-4" />
                                    ) : (
                                        <ExclamationTriangleIcon className="w-4 h-4" />
                                    )}
                                    {updateMessage.text}
                                </div>
                            </div>
                        )}

                        {/* Profile Card */}
                        <section className="bg-white rounded-3xl p-5 shadow">
                            <div className="flex items-start gap-4">
                                {/* <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                    {student.student.photo ? (
                                        <img
                                            src={student.student.photo}
                                            alt={student.student.fullname}
                                            className="w-full h-full rounded-full object-cover"
                                        />
                                    ) : (
                                        <UserIcon className="h-8 w-8 text-blue-600" />
                                    )}
                                </div> */}
                                <div className="flex-1">
                                    <h1 className="text-2xl font-bold">{student.student.fullname}</h1>
                                    <p className="text-sm text-gray-500">
                                        {student.classroom.name} • {student.student.gender === "male" ? "Laki-laki" : "Perempuan"}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {formatDate(student.student.birth_date)}
                                    </p>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
                                <StatCard
                                    title="Nilai Akhir"
                                    value={student.summary.final_score.toFixed(1)}
                                    subtitle="dari 100"
                                    color="blue"
                                />
                                <StatCard
                                    title="Kehadiran"
                                    value={`${student.summary.attendance_percentage}%`}
                                    subtitle={`${student.summary.present_count}/${student.summary.total_attendance} hadir`}
                                    color="green"
                                />
                                <StatCard
                                    title="Skill"
                                    value={student.summary.average_scores.skill.toFixed(1)}
                                    subtitle={`${capableSkills.length} capable`}
                                    color="purple"
                                />
                                <StatCard
                                    title="Knowledge"
                                    value={student.summary.average_scores.creativity1.toFixed(1)}
                                    subtitle={`${capableKnowledge.length} capable`}
                                    color="orange"
                                />
                            </div>
                        </section>

                        {/* Achievement Summary */}
                        <section className="mt-5 bg-white rounded-3xl p-5 shadow">
                            <h2 className="font-bold text-lg">Achievement</h2>
                            <div className="grid grid-cols-2 gap-3 mt-4">
                                <div className="p-4 bg-orange-50 rounded-xl">
                                    <div className="flex items-center gap-2">
                                        <FireIcon className="h-6 text-orange-500" />
                                        <p className="text-sm text-gray-600">Skill</p>
                                    </div>
                                    <b className="text-xl">{skills.length}</b>
                                    <p className="text-xs text-gray-500">
                                        {capableSkills.length} capable
                                    </p>
                                </div>
                                <div className="p-4 bg-blue-50 rounded-xl">
                                    <div className="flex items-center gap-2">
                                        <LightBulbIcon className="h-6 text-blue-500" />
                                        <p className="text-sm text-gray-600">Knowledge</p>
                                    </div>
                                    <b className="text-xl">{knowledge.length}</b>
                                    <p className="text-xs text-gray-500">
                                        {capableKnowledge.length} capable
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Attendance Stats */}
                        <section className="mt-5 bg-white rounded-3xl p-5 shadow">
                            <h2 className="font-bold text-lg">Kehadiran</h2>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-4">
                                <AttendanceCard
                                    title="Hadir"
                                    value={attendanceStats.present}
                                    color="green"
                                />
                                <AttendanceCard
                                    title="Sakit"
                                    value={attendanceStats.sick}
                                    color="yellow"
                                />
                                <AttendanceCard
                                    title="Izin"
                                    value={attendanceStats.permission}
                                    color="blue"
                                />
                                <AttendanceCard
                                    title="Absen"
                                    value={attendanceStats.absent}
                                    color="red"
                                />
                                <AttendanceCard
                                    title="Terlambat"
                                    value={attendanceStats.late}
                                    color="orange"
                                />
                            </div>
                        </section>

                        {/* Skill Section with Edit */}
                        <section className="mt-5 bg-white rounded-3xl p-5 shadow">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-bold text-lg flex items-center gap-2">
                                    <FireIcon className="w-5 h-5 text-orange-500" />
                                    Skill Assessment
                                </h2>
                                {/* <span className="text-xs text-gray-500">
                                    Klik icon pensil untuk edit
                                </span> */}
                            </div>
                            
                            <div className="mt-4 space-y-3 max-h-96 overflow-y-auto">
                            {skills.length > 0 ? (
                                <div className="space-y-3">
                                    {skills.map((accomplishment) => {
                                        const currentlyEditing = isEditing(accomplishment.id, accomplishment.attendanceId);
                                        
                                        return (
                                            <div
                                                key={`skill-${accomplishment.id}-${accomplishment.scheduleId}`}
                                                className={`p-4 rounded-lg border transition-all ${
                                                    currentlyEditing 
                                                        ? 'ring-2 ring-orange-500 ring-opacity-50 border-orange-300 bg-orange-50' 
                                                        : 'border-orange-200 bg-orange-50 hover:bg-orange-100'
                                                }`}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            {/* {accomplishment.score < 65 ? (
                                                                <ExclamationTriangleIcon className="w-5 h-5 text-red-500 flex-shrink-0" />
                                                            ) : accomplishment.score >= 85 ? (
                                                                <FireIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                                                            ) : (
                                                                <CheckCircleIcon className="w-5 h-5 text-blue-500 flex-shrink-0" />
                                                            )} */}
                                                            <span className="font-medium text-gray-900 truncate">
                                                                {accomplishment.name}
                                                            </span>
                                                        </div>
                                                        <div className="text-sm text-gray-600 truncate">
                                                            {accomplishment.subject}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {formatDate(accomplishment.date)}
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex flex-col items-end gap-2 ml-2">
                                                        {currentlyEditing ? (
                                                            <div className="flex flex-col gap-2 w-full">
                                                                <div className="flex items-center gap-1">
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        max="100"
                                                                        value={tempScore}
                                                                        onChange={(e) => {
                                                                            const value = parseInt(e.target.value);
                                                                            if (!isNaN(value)) {
                                                                                setTempScore(Math.max(0, Math.min(100, value)));
                                                                            }
                                                                        }}
                                                                        className="w-20 px-2 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                                                        autoFocus
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === 'Enter') {
                                                                                handleScoreUpdate();
                                                                            }
                                                                            if (e.key === 'Escape') {
                                                                                handleCancelEdit();
                                                                            }
                                                                        }}
                                                                        disabled={isUpdating}
                                                                    />
                                                                    <span className="text-sm font-medium text-gray-700">/100</span>
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={handleScoreUpdate}
                                                                        disabled={isUpdating}
                                                                        className="flex-1 px-3 py-1.5 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                                                                    >
                                                                        {isUpdating ? (
                                                                            <>
                                                                                <ArrowPathIcon className="w-3 h-3 animate-spin" />
                                                                                Menyimpan...
                                                                            </>
                                                                        ) : 'Simpan'}
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={handleCancelEdit}
                                                                        disabled={isUpdating}
                                                                        className="flex-1 px-3 py-1.5 text-xs bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                                    >
                                                                        Batal
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <div className="text-right">
                                                                    <div className="text-lg font-bold text-gray-900">
                                                                        {accomplishment.score}
                                                                    </div>
                                                                    <div className={`text-xs font-medium px-2 py-1 rounded ${getScoreColor(accomplishment.score)}`}>
                                                                        {getGrade(accomplishment.score)}
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleEditClick(accomplishment)}
                                                                    className="p-1.5 text-gray-400 hover:text-orange-600 transition-colors hover:bg-orange-50 rounded-md"
                                                                    title={editingAllowed ? "Edit nilai" : "Semester non-aktif — hanya baca"}
                                                                    disabled={isUpdating || !editingAllowed}
                                                                    hidden={!editingAllowed}
                                                                    data-testid="student-skill-edit-button"
                                                                >
                                                                    <PencilIcon className="w-4 h-4" />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <FireIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500">Tidak ada data skill assessment</p>
                                </div>
                            )}
                            </div>
                        </section>

                        {/* Knowledge Section with Edit */}
                        <section className="mt-5 bg-white rounded-3xl p-5 shadow">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-bold text-lg flex items-center gap-2">
                                    <LightBulbIcon className="w-5 h-5 text-blue-500" />
                                    Knowledge Assessment
                                </h2>
                                {/* <span className="text-xs text-gray-500">
                                    Klik icon pensil untuk edit
                                </span> */}
                            </div>
                            <div className="mt-4 space-y-3 max-h-96 overflow-y-auto">
                            {knowledge.length > 0 ? (
                                <div className="space-y-3">
                                    {knowledge.map((accomplishment, index) => {
                                        const currentlyEditing = isEditing(accomplishment.id, accomplishment.attendanceId);
                                        
                                        return (
                                            <div
                                                key={`knowledge-${accomplishment.id}-${accomplishment.scheduleId}-${index}`}
                                                className={`p-4 rounded-lg border transition-all ${
                                                    currentlyEditing 
                                                        ? 'ring-2 ring-blue-500 ring-opacity-50 border-blue-300 bg-blue-50' 
                                                        : 'border-blue-200 bg-blue-50 hover:bg-blue-100'
                                                }`}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            {/* {accomplishment.is_capable ? (
                                                                <LightBulbIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                                                            ) : (
                                                                <ExclamationTriangleIcon className="w-5 h-5 text-red-500 flex-shrink-0" />
                                                            )} */}
                                                            <span className="font-medium text-gray-900 truncate">
                                                                {accomplishment.name}
                                                            </span>
                                                        </div>
                                                        <div className="text-sm text-gray-600 truncate">
                                                            {accomplishment.subject}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {formatDate(accomplishment.date)}
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex flex-col items-end gap-2 ml-2">
                                                        {currentlyEditing ? (
                                                            <div className="flex flex-col gap-2 w-full">
                                                                <div className="flex flex-col gap-1 mt-2 w-full">
                                                                    <label className="text-xs font-medium text-gray-700">Status Capable:</label>
                                                                    <div className="flex gap-4">
                                                                        <label className="flex items-center gap-1 text-sm cursor-pointer">
                                                                            <input
                                                                                type="radio"
                                                                                name={`capable-${accomplishment.attendanceId}`}
                                                                                value="true"
                                                                                checked={tempIsCapable === true}
                                                                                onChange={() => setTempIsCapable(true)}
                                                                                disabled={isUpdating}
                                                                                className="h-4 w-4 text-green-600 focus:ring-green-500 cursor-pointer"
                                                                            />
                                                                            <span className="text-green-700 flex items-center gap-1">
                                                                                <CheckCircleIcon className="w-3 h-3" />
                                                                                Capable
                                                                            </span>
                                                                        </label>
                                                                        <label className="flex items-center gap-1 text-sm cursor-pointer">
                                                                            <input
                                                                                type="radio"
                                                                                name={`capable-${accomplishment.attendanceId}`}
                                                                                value="false"
                                                                                checked={tempIsCapable === false}
                                                                                onChange={() => setTempIsCapable(false)}
                                                                                disabled={isUpdating}
                                                                                className="h-4 w-4 text-red-600 focus:ring-red-500 cursor-pointer"
                                                                            />
                                                                            <span className="text-red-700 flex items-center gap-1">
                                                                                <XCircleIcon className="w-3 h-3" />
                                                                                Not Capable
                                                                            </span>
                                                                        </label>
                                                                    </div>
                                                                </div>

                                                                <div className="flex gap-2 mt-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={handleScoreUpdate}
                                                                        disabled={isUpdating}
                                                                        className="flex-1 px-3 py-1.5 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                                                                    >
                                                                        {isUpdating ? (
                                                                            <>
                                                                                <ArrowPathIcon className="w-3 h-3 animate-spin" />
                                                                                Menyimpan...
                                                                            </>
                                                                        ) : 'Simpan'}
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={handleCancelEdit}
                                                                        disabled={isUpdating}
                                                                        className="flex-1 px-3 py-1.5 text-xs bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                                    >
                                                                        Batal
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <div className="text-right">
                                                                    <div className={`px-2 py-1 text-xs font-medium rounded flex items-center gap-1 ${
                                                                        accomplishment.is_capable 
                                                                            ? 'bg-green-100 text-green-800' 
                                                                            : 'bg-red-100 text-red-800'
                                                                    }`}>
                                                                        {accomplishment.is_capable ? (
                                                                            <>
                                                                                <CheckCircleIcon className="w-3 h-3" />
                                                                                Capable
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <XCircleIcon className="w-3 h-3" />
                                                                                Not Capable
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleEditClick(accomplishment)}
                                                                    className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors hover:bg-blue-50 rounded-md"
                                                                    title={editingAllowed ? "Edit status" : "Semester non-aktif — hanya baca"}
                                                                    disabled={isUpdating || !editingAllowed}
                                                                    hidden={!editingAllowed}
                                                                    data-testid="student-knowledge-edit-button"
                                                                >
                                                                    <PencilIcon className="w-4 h-4" />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <LightBulbIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500">Tidak ada data knowledge assessment</p>
                                </div>
                            )}
                            </div>
                        </section>

                        {/* Attendance History */}
                        <section className="mt-5 bg-white rounded-3xl p-5 shadow">
                            <h2 className="font-bold text-lg">Riwayat Kehadiran</h2>
                            <div className="mt-4 space-y-3 max-h-96 overflow-y-auto">
                                {student.attendances.length === 0 ? (
                                    <p className="text-gray-500 text-center py-4">
                                        Belum ada data kehadiran
                                    </p>
                                ) : (
                                    student.attendances.map((att: Attendance) => (
                                        <div
                                            key={att.id}
                                            className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm truncate">
                                                    {att.schedule?.subject?.name || "Mata Pelajaran"}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {formatDate(att.schedule?.date)} •{" "}
                                                    {att.schedule?.start_time?.slice(0, 5)} -{" "}
                                                    {att.schedule?.end_time?.slice(0, 5)}
                                                </p>
                                                {att.schedule?.subject?.accomplishments?.length > 0 && (
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        {att.schedule.subject.accomplishments.length} accomplishment
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex-shrink-0 ml-2">
                                                <span
                                                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(
                                                        att.status
                                                    )}`}
                                                >
                                                    {getStatusLabel(att.status)}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>

                        {/* STIFIN Profile */}
                        <section className="mt-5 bg-white rounded-3xl p-5 shadow">
                            <h2 className="font-bold text-lg flex items-center gap-2">
                                <InformationCircleIcon className="w-5 h-5 text-indigo-500" />
                                Profil STIFIN
                            </h2>
                            
                            {stifinData ? (
                                <div className="mt-4 space-y-6">
                                    {/* STIFIN Type */}
                                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-5 border border-indigo-100">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-indigo-100 p-3 rounded-full">
                                                <span className="text-2xl font-bold text-indigo-600">
                                                    {stifinData.stifinType || '?'}
                                                </span>
                                            </div>
                                            <div>
                                                <h4 className="text-xl font-bold text-gray-800">
                                                    {stifinData.typeName || 'Tipe tidak diketahui'}
                                                </h4>
                                                <div className="">
                                                 <p className="text-sm text-gray-600">
                                                  Tanggal Lahir : {stifinData.original || '-'}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                  Hasil Stifin :  {stifinData.result || '-'}
                                                </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    {stifinData.description && (
                                        <div className="bg-white rounded-xl p-4 border border-gray-200">
                                            <h4 className="text-sm font-semibold text-gray-700 mb-2">Deskripsi</h4>
                                            <p className="text-sm text-gray-600">
                                                {stifinData.description}
                                            </p>
                                        </div>
                                    )}

                                    {/* Characteristics */}
                                    {stifinData.characteristics && stifinData.characteristics.length > 0 && (
                                        <div className="bg-white rounded-xl p-4 border border-gray-200">
                                            <h4 className="text-sm font-semibold text-gray-700 mb-2">Karakteristik</h4>
                                            <ul className="space-y-1.5">
                                                {stifinData.characteristics.map((item: string, idx: number) => (
                                                    <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                                                        <span className="mt-1.5 inline-block h-1.5 w-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
                                                        <span>{item}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Suitable Careers */}
                                    {stifinData.suitableCareers && stifinData.suitableCareers.length > 0 && (
                                        <div className="bg-white rounded-xl p-4 border border-gray-200">
                                            <h4 className="text-sm font-semibold text-gray-700 mb-2">Karier yang Sesuai</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {stifinData.suitableCareers.map((item: string, idx: number) => (
                                                    <span
                                                        key={idx}
                                                        className="px-3 py-1.5 rounded-xl text-sm font-medium bg-indigo-50 text-indigo-700 border border-indigo-100"
                                                    >
                                                        {item}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Learning & Communication Style */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {stifinData.learningStyle && (
                                            <div className="bg-white rounded-xl p-4 border border-gray-200">
                                                <h4 className="text-sm font-semibold text-gray-700 mb-2">Gaya Belajar</h4>
                                                <p className="text-sm text-gray-600">{stifinData.learningStyle}</p>
                                            </div>
                                        )}
                                        {stifinData.communicationStyle && (
                                            <div className="bg-white rounded-xl p-4 border border-gray-200">
                                                <h4 className="text-sm font-semibold text-gray-700 mb-2">Gaya Komunikasi</h4>
                                                <p className="text-sm text-gray-600">{stifinData.communicationStyle}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Strengths & Weaknesses */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {stifinData.strengths && stifinData.strengths.length > 0 && (
                                            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                                                <h4 className="text-sm font-semibold text-green-800 mb-2 flex items-center gap-2">
                                                    <CheckCircleIcon className="w-4 h-4" />
                                                    Strengths
                                                </h4>
                                                <ul className="space-y-1.5">
                                                    {stifinData.strengths.map((item: string, idx: number) => (
                                                        <li key={idx} className="text-sm text-green-800/80 flex items-start gap-2">
                                                            <span className="mt-1.5 inline-block h-1.5 w-1.5 rounded-full bg-green-500 flex-shrink-0" />
                                                            <span>{item}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {stifinData.weaknesses && stifinData.weaknesses.length > 0 && (
                                            <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                                                <h4 className="text-sm font-semibold text-red-800 mb-2 flex items-center gap-2">
                                                    <XCircleIcon className="w-4 h-4" />
                                                    Weaknesses
                                                </h4>
                                                <ul className="space-y-1.5">
                                                    {stifinData.weaknesses.map((item: string, idx: number) => (
                                                        <li key={idx} className="text-sm text-red-800/80 flex items-start gap-2">
                                                            <span className="mt-1.5 inline-block h-1.5 w-1.5 rounded-full bg-red-500 flex-shrink-0" />
                                                            <span>{item}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>

                                    {/* Tips */}
                                    {stifinData.tips && stifinData.tips.length > 0 && (
                                        <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                                            <h4 className="text-sm font-semibold text-orange-800 mb-2 flex items-center gap-2">
                                                <LightBulbIcon className="w-4 h-4" />
                                                Tips
                                            </h4>
                                            <ul className="space-y-1.5">
                                                {stifinData.tips.map((item: string, idx: number) => (
                                                    <li key={idx} className="text-sm text-orange-800/80 flex items-start gap-2">
                                                        <span className="mt-1.5 inline-block h-1.5 w-1.5 rounded-full bg-orange-500 flex-shrink-0" />
                                                        <span>{item}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <InformationCircleIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500">Data STIFIN tidak tersedia</p>
                                    <p className="text-sm text-gray-400 mt-1">
                                        Pastikan tanggal lahir siswa tersedia
                                    </p>
                                </div>
                            )}
                        </section>
                    </div>
                </main>
            </div>
        </ProtectedRoute>
    );
}

// ========== COMPONENTS ==========

function StatCard({
    title,
    value,
    subtitle,
    color = "blue",
}: {
    title: string;
    value: string;
    subtitle?: string;
    color?: "blue" | "green" | "purple" | "orange" | "red";
}) {
    const colorMap = {
        blue: "bg-blue-50 border-blue-200",
        green: "bg-green-50 border-green-200",
        purple: "bg-purple-50 border-purple-200",
        orange: "bg-orange-50 border-orange-200",
        red: "bg-red-50 border-red-200",
    };

    return (
        <div className={`rounded-xl p-3 text-center border ${colorMap[color]}`}>
            <p className="text-xs text-gray-500">{title}</p>
            <p className="font-bold text-lg">{value}</p>
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
    );
}

function AttendanceCard({
    title,
    value,
    color = "gray",
}: {
    title: string;
    value: number;
    color?: "green" | "yellow" | "blue" | "red" | "orange" | "gray";
}) {
    const colorMap = {
        green: "bg-green-50 text-green-700",
        yellow: "bg-yellow-50 text-yellow-700",
        blue: "bg-blue-50 text-blue-700",
        red: "bg-red-50 text-red-700",
        orange: "bg-orange-50 text-orange-700",
        gray: "bg-gray-50 text-gray-700",
    };

    return (
        <div className={`p-3 rounded-xl text-center ${colorMap[color]}`}>
            <p className="text-xs">{title}</p>
            <p className="font-bold text-lg">{value}</p>
        </div>
    );
}