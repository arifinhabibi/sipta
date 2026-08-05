"use client";

import {
  ArrowTrendingUpIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { useMemo } from "react";
import type { Attendance } from "@/src/domain/Attendance";

interface AttendanceSession {
  key: string;
  teacherId: string;
  teacherName: string;
  date: string;
  status: Attendance["status"];
  hasCheckIn: boolean;
  hasCheckOut: boolean;
}

interface TeacherMetric {
  teacherId: string;
  teacherName: string;
  sessions: number;
  attended: number;
  late: number;
  exceptions: number;
  rate: number;
}

const statusLabels: Record<Attendance["status"], string> = {
  present: "Tepat waktu",
  late: "Terlambat",
  absent: "Tidak hadir",
  sick: "Sakit",
  permission: "Izin",
};

const statusStyles: Record<Attendance["status"], string> = {
  present: "bg-emerald-500",
  late: "bg-amber-500",
  absent: "bg-rose-500",
  sick: "bg-violet-500",
  permission: "bg-sky-500",
};

const percentage = (value: number, total: number) =>
  total > 0 ? Math.round((value / total) * 100) : 0;

const formatDate = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return value || "-";
  return `${match[3]}-${match[2]}-${match[1]}`;
};

const buildSessions = (attendances: Attendance[]): AttendanceSession[] => {
  const grouped = new Map<
    string,
    {
      teacherId: string;
      teacherName: string;
      date: string;
      checkIn?: Attendance;
      checkOut?: Attendance;
      fallback: Attendance;
    }
  >();

  attendances.forEach((attendance) => {
    const key = `${attendance.teacher_id}:${attendance.schedule_id}`;
    const current = grouped.get(key) ?? {
      teacherId: attendance.teacher_id,
      teacherName: attendance.teacher_name || "Guru tidak diketahui",
      date: attendance.schedule_date,
      fallback: attendance,
    };

    if (attendance.type === "check_in") current.checkIn = attendance;
    if (attendance.type === "check_out") current.checkOut = attendance;
    grouped.set(key, current);
  });

  return Array.from(grouped.entries()).map(([key, group]) => ({
    key,
    teacherId: group.teacherId,
    teacherName: group.teacherName,
    date: group.date,
    status: (group.checkIn ?? group.fallback).status,
    hasCheckIn: Boolean(group.checkIn),
    hasCheckOut: Boolean(group.checkOut),
  }));
};

export function TeacherAttendanceAnalytics({
  attendances,
}: {
  attendances: Attendance[];
}) {
  const analytics = useMemo(() => {
    const sessions = buildSessions(attendances);
    const statusCounts = {
      present: 0,
      late: 0,
      absent: 0,
      sick: 0,
      permission: 0,
    } satisfies Record<Attendance["status"], number>;

    const teachers = new Map<string, Omit<TeacherMetric, "rate">>();
    const daily = new Map<
      string,
      { total: number; attended: number; late: number }
    >();

    sessions.forEach((session) => {
      statusCounts[session.status] += 1;
      const isAttended =
        session.status === "present" || session.status === "late";
      const isException = ["absent", "sick", "permission"].includes(
        session.status,
      );

      const teacher = teachers.get(session.teacherId) ?? {
        teacherId: session.teacherId,
        teacherName: session.teacherName,
        sessions: 0,
        attended: 0,
        late: 0,
        exceptions: 0,
      };
      teacher.sessions += 1;
      teacher.attended += isAttended ? 1 : 0;
      teacher.late += session.status === "late" ? 1 : 0;
      teacher.exceptions += isException ? 1 : 0;
      teachers.set(session.teacherId, teacher);

      const day = daily.get(session.date) ?? { total: 0, attended: 0, late: 0 };
      day.total += 1;
      day.attended += isAttended ? 1 : 0;
      day.late += session.status === "late" ? 1 : 0;
      daily.set(session.date, day);
    });

    const teacherMetrics: TeacherMetric[] = Array.from(teachers.values())
      .map((teacher) => ({
        ...teacher,
        rate: percentage(teacher.attended, teacher.sessions),
      }))
      .sort(
        (left, right) =>
          left.rate - right.rate ||
          right.late - left.late ||
          left.teacherName.localeCompare(right.teacherName),
      );

    const dailyMetrics = Array.from(daily.entries())
      .map(([date, metric]) => ({ date, ...metric }))
      .sort((left, right) => left.date.localeCompare(right.date));

    const attended = statusCounts.present + statusCounts.late;
    const attendedCheckIns = sessions.filter(
      (session) =>
        session.hasCheckIn &&
        (session.status === "present" || session.status === "late"),
    );
    const completeCheckOut = sessions.filter(
      (session) =>
        session.hasCheckIn &&
        session.hasCheckOut &&
        (session.status === "present" || session.status === "late"),
    ).length;
    const missingCheckOut = Math.max(
      attendedCheckIns.length - completeCheckOut,
      0,
    );
    const orphanCheckOut = sessions.filter(
      (session) => !session.hasCheckIn && session.hasCheckOut,
    ).length;

    return {
      sessions,
      statusCounts,
      teacherMetrics,
      dailyMetrics,
      attended,
      attendanceRate: percentage(attended, sessions.length),
      lateRate: percentage(statusCounts.late, sessions.length),
      checkOutRate: percentage(completeCheckOut, attendedCheckIns.length),
      missingCheckOut,
      orphanCheckOut,
    };
  }, [attendances]);

  if (analytics.sessions.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
        <ArrowTrendingUpIcon className="mx-auto h-9 w-9 text-slate-300" />
        <h2 className="mt-3 font-semibold text-slate-900">
          Belum ada data untuk dianalisis
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Ubah periode laporan atau pastikan absensi guru sudah tercatat.
        </p>
      </section>
    );
  }

  const kpis = [
    {
      label: "Sesi unik",
      value: analytics.sessions.length,
      helper: `${analytics.teacherMetrics.length} guru tercatat`,
      icon: UserGroupIcon,
      tone: "bg-slate-900 text-white",
    },
    {
      label: "Tingkat hadir",
      value: `${analytics.attendanceRate}%`,
      helper: `${analytics.attended} sesi hadir/terlambat`,
      icon: CheckCircleIcon,
      tone: "bg-emerald-600 text-white",
    },
    {
      label: "Tingkat terlambat",
      value: `${analytics.lateRate}%`,
      helper: `${analytics.statusCounts.late} sesi terlambat`,
      icon: ClockIcon,
      tone: "bg-amber-500 text-slate-950",
    },
    {
      label: "Check-out lengkap",
      value: `${analytics.checkOutRate}%`,
      helper: `${analytics.missingCheckOut} sesi belum check-out`,
      icon: ExclamationTriangleIcon,
      tone:
        analytics.missingCheckOut > 0
          ? "bg-rose-600 text-white"
          : "bg-sky-600 text-white",
    },
  ];

  const maxDailySessions = Math.max(
    ...analytics.dailyMetrics.map((metric) => metric.total),
    1,
  );

  return (
    <section
      className="space-y-4"
      aria-labelledby="teacher-attendance-analysis-title"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
            Analisis operasional
          </p>
          <h2
            id="teacher-attendance-analysis-title"
            className="mt-1 text-xl font-bold text-slate-950"
          >
            Ringkasan kehadiran guru
          </h2>
        </div>
        <p className="max-w-xl text-xs leading-5 text-slate-500">
          Dihitung dari sesi unik guru dan jadwal. Check-in serta check-out
          tidak dihitung sebagai dua kehadiran. Indikator ini untuk evaluasi
          operasional, bukan keputusan payroll.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <article
            key={kpi.label}
            className={`rounded-2xl p-5 shadow-sm ${kpi.tone}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium opacity-80">{kpi.label}</p>
                <p className="mt-2 text-3xl font-bold tracking-tight">
                  {kpi.value}
                </p>
                <p className="mt-1 text-xs opacity-80">{kpi.helper}</p>
              </div>
              <span className="rounded-xl bg-white/15 p-2.5">
                <kpi.icon className="h-5 w-5" aria-hidden="true" />
              </span>
            </div>
          </article>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-950">
                Distribusi status
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Komposisi seluruh sesi dalam periode
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {analytics.sessions.length} sesi
            </span>
          </div>

          <div className="mt-5 space-y-4">
            {(Object.keys(statusLabels) as Attendance["status"][]).map(
              (status) => {
                const count = analytics.statusCounts[status];
                const rate = percentage(count, analytics.sessions.length);
                return (
                  <div key={status}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700">
                        {statusLabels[status]}
                      </span>
                      <span className="tabular-nums text-slate-500">
                        {count} · {rate}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${statusStyles[status]}`}
                        style={{ width: `${rate}%` }}
                      />
                    </div>
                  </div>
                );
              },
            )}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-slate-950">Tren sesi harian</h3>
              <p className="mt-1 text-xs text-slate-500">
                Volume dan keterlambatan per tanggal
              </p>
            </div>
            {analytics.orphanCheckOut > 0 && (
              <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
                {analytics.orphanCheckOut} check-out tanpa check-in
              </span>
            )}
          </div>

          <div className="mt-5 max-h-72 space-y-3 overflow-y-auto pr-1">
            {analytics.dailyMetrics.map((metric) => (
              <div
                key={metric.date}
                className="grid grid-cols-[88px_1fr_auto] items-center gap-3"
              >
                <span className="text-xs font-medium tabular-nums text-slate-600">
                  {formatDate(metric.date)}
                </span>
                <div className="h-7 overflow-hidden rounded-lg bg-slate-100">
                  <div
                    className="flex h-full items-center rounded-lg bg-blue-600 px-2 text-[11px] font-semibold text-white"
                    style={{
                      width: `${Math.max((metric.total / maxDailySessions) * 100, 12)}%`,
                    }}
                  >
                    {metric.total}
                  </div>
                </div>
                <span className="min-w-20 text-right text-xs text-slate-500">
                  {metric.late > 0 ? `${metric.late} terlambat` : "tepat waktu"}
                </span>
              </div>
            ))}
          </div>
        </article>
      </div>

      <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h3 className="font-semibold text-slate-950">Analisis per guru</h3>
          <p className="mt-1 text-xs text-slate-500">
            Diurutkan dari tingkat kehadiran terendah agar tindak lanjut lebih
            mudah diprioritaskan.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Guru</th>
                <th className="px-5 py-3 text-right font-semibold">Sesi</th>
                <th className="px-5 py-3 text-right font-semibold">Hadir</th>
                <th className="px-5 py-3 text-right font-semibold">
                  Terlambat
                </th>
                <th className="px-5 py-3 text-right font-semibold">
                  Izin/sakit/absen
                </th>
                <th className="px-5 py-3 text-right font-semibold">
                  Tingkat hadir
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {analytics.teacherMetrics.map((teacher) => (
                <tr key={teacher.teacherId} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-5 py-3 font-semibold text-slate-800">
                    {teacher.teacherName}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums text-slate-600">
                    {teacher.sessions}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums text-emerald-700">
                    {teacher.attended}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums text-amber-700">
                    {teacher.late}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums text-rose-700">
                    {teacher.exceptions}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span
                      className={`inline-flex min-w-14 justify-center rounded-full px-2.5 py-1 text-xs font-bold ${
                        teacher.rate >= 90
                          ? "bg-emerald-50 text-emerald-700"
                          : teacher.rate >= 75
                            ? "bg-amber-50 text-amber-700"
                            : "bg-rose-50 text-rose-700"
                      }`}
                    >
                      {teacher.rate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
