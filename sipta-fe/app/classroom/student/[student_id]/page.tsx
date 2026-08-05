"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
    ArrowLeftIcon,
    FireIcon,
    LightBulbIcon,
    UserIcon,
    CalendarDaysIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
} from "@heroicons/react/24/outline";

import { useReportStore } from "@/src/state/ReportStore";
import getStifin from "@/src/stifin";
import { formatDateDDMMYYYY } from "@/src/utils/date";

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

const formatDate = (date: string) => {
    return formatDateDDMMYYYY(date);
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

export default function StudentDetailPage({ params }: Props) {
    const router = useRouter();
    const { performanceStudentsByStudent } = useReportStore();

    const [student, setStudent] = useState<StudentData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const response: any = await performanceStudentsByStudent(
                    params.student_id
                );

                const data = response.data;
                // console.log("student data", data);
                setStudent(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }

        load();
    }, [params.student_id]);

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

    const accomplishments = useMemo(() => {
        if (!student) return [];

        return student.attendances.flatMap((att: Attendance) => {
            if (!att.schedule?.subject?.accomplishments) return [];
            return att.schedule.subject.accomplishments.map((item: Accomplishment) => ({
                ...item,
                subject: att.schedule.subject.name,
                date: att.schedule.date,
                attendance_status: att.status,
                attendance_date: att.created_at,
            }));
        });
    }, [student]);

    const skills = accomplishments.filter((item: any) => item.type === "skill");
    const knowledge = accomplishments.filter((item: any) => item.type === "knowledge");

    // Skill yang capable (score >= 60)
    const capableSkills = skills.filter((item: any) => item.is_capable === true);
    const capableKnowledge = knowledge.filter((item: any) => item.is_capable === true);

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
            <div className="min-h-screen flex items-center justify-center p-5">
                <div className="bg-white rounded-3xl p-8 shadow-lg text-center">
                    <p className="text-gray-600">Data laporan siswa tidak ditemukan.</p>
                    <button
                        onClick={() => router.back()}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl"
                    >
                        Kembali
                    </button>
                </div>
            </div>
        );
    }

    const stifin = getStifin(student.student.birth_date);

    return (
        <main className="min-h-screen bg-slate-100 p-5 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow hover:shadow-md transition"
                >
                    <ArrowLeftIcon className="h-5 w-5" />
                    Kembali
                </button>
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow">
                    <CalendarDaysIcon className="h-5 w-5 text-gray-500" />
                    <span className="text-sm text-gray-600">
                        {student.academic_year.name} - {student.academic_year.periode}
                    </span>
                </div>
            </div>

            {/* Profile Card */}
            <section className="bg-white rounded-3xl p-5 shadow">
                <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        {student.student.photo ? (
                            <img
                                src={student.student.photo}
                                alt={student.student.fullname}
                                className="w-full h-full rounded-full object-cover"
                            />
                        ) : (
                            <UserIcon className="h-8 w-8 text-blue-600" />
                        )}
                    </div>
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
                        title="Tugas"
                        value={student.summary.average_scores.skill.toFixed(1)}
                        subtitle={`${capableSkills.length} mampu`}
                        color="purple"
                    />
                    <StatCard
                        title="Pemahaman"
                        value={student.summary.average_scores.creativity1.toFixed(1)}
                        subtitle={`${capableKnowledge.length} mampu`}
                        color="orange"
                    />
                </div>
            </section>

            {/* STIFIN Profile */}
            <section className="mt-5 bg-white rounded-3xl p-5 shadow">
                <h2 className="font-bold text-lg">Profil STIFIN</h2>
                <div className="mt-3 flex gap-2 flex-wrap">
                    <Badge text={stifin.typeName || "-"} color="blue" />
                    <Badge text={stifin.stifinType || "-"} color="indigo" />
                </div>
            </section>

            {/* Achievement Summary */}
            <section className="mt-5 bg-white rounded-3xl p-5 shadow">
                <h2 className="font-bold text-lg">Achievement</h2>
                <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="p-4 bg-orange-50 rounded-xl">
                        <div className="flex items-center gap-2">
                            <FireIcon className="h-6 text-orange-500" />
                            <p className="text-sm text-gray-600">Tugas</p>
                        </div>
                        <b className="text-xl">{skills.length}</b>
                        <p className="text-xs text-gray-500">
                            {capableSkills.length} mampu
                        </p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-xl">
                        <div className="flex items-center gap-2">
                            <LightBulbIcon className="h-6 text-blue-500" />
                            <p className="text-sm text-gray-600">Pemahaman</p>
                        </div>
                        <b className="text-xl">{knowledge.length}</b>
                        <p className="text-xs text-gray-500">
                            {capableKnowledge.length} mampu
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
        </main>
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

function Badge({ text, color = "blue" }: { text: string; color?: "blue" | "indigo" }) {
    const colorMap = {
        blue: "bg-blue-100 text-blue-700",
        indigo: "bg-indigo-100 text-indigo-700",
    };

    return (
        <span className={`px-3 py-2 rounded-xl text-sm font-medium ${colorMap[color]}`}>
            {text}
        </span>
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
