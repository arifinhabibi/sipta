<?php

namespace App\Services;

use App\Models\AcademicYear;
use App\Models\Schedule;
use App\Models\Teacher;
use Carbon\Carbon;

class AttendanceReportService
{
    public function getData(
        $startDate,
        $endDate,
        $teacherId = null,
        $academicYearId = null
    ): array {
        $academicYear = $this->resolveAcademicYear(
            $teacherId,
            $academicYearId
        );
        $teacher = $teacherId ? Teacher::find($teacherId) : null;

        $schedules = Schedule::with([
            'teacher', 'subject', 'classroom', 'teacher_attendances',
        ])->when($academicYear, function ($query) use ($academicYear) {
            $query->where('academic_year_id', $academicYear->id);
        })->when($teacherId, function ($query) use ($teacherId) {
            $query->where('teacher_id', $teacherId);
        })->when($startDate && $endDate, function ($query) use (
            $startDate,
            $endDate
        ) {
            $query->whereDate('date', '>=', $startDate)
                ->whereDate('date', '<=', $endDate);
        })->where('status', '!=', 'cancelled')
            ->whereDate('date', '<=', now()->toDateString())
            ->orderBy('date')->orderBy('start_time')->get();

        $rawStatuses = [];
        $exportData = $schedules->map(function ($schedule, $index) use (
            &$rawStatuses
        ) {
            $checkIn = $schedule->teacher_attendances
                ->firstWhere('type', 'check_in');
            $checkOut = $schedule->teacher_attendances
                ->firstWhere('type', 'check_out');
            $rawStatus = $checkIn ? $checkIn->status : 'absent';
            $rawStatuses[] = $rawStatus;
            $statusMap = [
                'present' => 'Hadir', 'late' => 'Terlambat',
                'absent' => 'Absen', 'sick' => 'Sakit',
                'permission' => 'Izin',
            ];
            $date = Carbon::parse($schedule->date);

            return [
                'no' => $index + 1,
                'schedule_id' => $schedule->id,
                'teacher_id' => $schedule->teacher_id,
                'teacher_name' => $schedule->teacher->full_name ?? 'N/A',
                'date' => $date->format('Y-m-d'),
                'day' => $date->locale('id')->translatedFormat('l'),
                // Compatibility with the existing export: one logical row is
                // a schedule session, never a second row for check-out.
                'type' => 'check_in',
                'check_in_time' => $checkIn
                    ? Carbon::parse($checkIn->created_at)->format('H:i') : '-',
                'check_out_time' => $checkOut
                    ? Carbon::parse($checkOut->created_at)->format('H:i') : '-',
                'status' => $statusMap[$rawStatus],
                'status_note' => $checkIn->notes ?? (
                    $checkIn ? '-' : 'Belum melakukan check-in'
                ),
                'subject_name' => $schedule->subject->name ?? 'N/A',
                'classroom_name' => $schedule->classroom->name ?? 'N/A',
                'location' => $checkIn && $checkIn->latitude
                    ? 'Lat: ' . $checkIn->latitude . ', Long: ' . $checkIn->longitude
                    : '-',
                'special_notes' => $checkIn->notes ?? '-',
                'schedule_time' => $schedule->start_time . ' - ' . $schedule->end_time,
                'recorded_time' => $checkIn
                    ? Carbon::parse($checkIn->created_at)->format('H:i:s') : '-',
            ];
        });

        $statuses = collect($rawStatuses);
        $countStatus = function ($status) use ($statuses) {
            return $statuses->filter(function ($item) use ($status) {
                return $item === $status;
            })->count();
        };
        $summary = [
            'total_attendances' => $schedules->count(),
            'present_count' => $countStatus('present'),
            'absent_count' => $countStatus('absent'),
            'late_count' => $countStatus('late'),
            'sick_count' => $countStatus('sick'),
            'permission_count' => $countStatus('permission'),
            'check_in_count' => $schedules->count() - $countStatus('absent'),
            'check_out_count' => $schedules->filter(function ($schedule) {
                return $schedule->teacher_attendances
                    ->contains('type', 'check_out');
            })->count(),
        ];

        return [
            $exportData, $startDate, $endDate,
            $academicYear ? $academicYear->name . ' ' . $academicYear->periode : null,
            $teacher ? $teacher->full_name : null,
            $summary,
        ];
    }

    private function resolveAcademicYear($teacherId, $academicYearId)
    {
        if ($academicYearId) {
            return AcademicYear::find($academicYearId);
        }
        if (!$teacherId) {
            return null;
        }

        $teacher = Teacher::find($teacherId);
        return $teacher
            ? AcademicYear::where('instance_id', $teacher->instance_id)
                ->active()->first()
            : null;
    }
}
