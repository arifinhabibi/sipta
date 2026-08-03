<?php

namespace App\Services;

use App\Exceptions\BusinessRuleException;
use App\Models\Schedule;
use App\Models\Teacher;
use App\Models\TeacherAttendance;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class TeacherAttendanceService
{
    public function record(
        Teacher $teacher,
        Schedule $schedule,
        $type,
        array $data
    ) {
        if ($schedule->teacher_id !== $teacher->id) {
            throw new BusinessRuleException(
                'Jadwal bukan milik guru yang melakukan absensi.'
            );
        }

        return DB::transaction(function () use (
            $teacher,
            $schedule,
            $type,
            $data
        ) {
            Schedule::where('id', $schedule->id)->lockForUpdate()->firstOrFail();

            if ($type === 'check_out' && !TeacherAttendance::where([
                'teacher_id' => $teacher->id,
                'schedule_id' => $schedule->id,
                'type' => 'check_in',
            ])->exists()) {
                throw new BusinessRuleException(
                    'Check-out hanya dapat dilakukan setelah check-in.'
                );
            }

            $status = isset($data['status']) ? $data['status'] : null;
            if ($type === 'check_in' && !$status) {
                $startsAt = Carbon::parse(
                    $schedule->date->format('Y-m-d') . ' ' . $schedule->start_time
                );
                $status = now()->gt($startsAt->copy()->addMinutes(
                    config('santrack.teacher_attendance.grace_minutes')
                )) ? 'late' : 'present';
            }

            return TeacherAttendance::updateOrCreate(
                [
                    'teacher_id' => $teacher->id,
                    'schedule_id' => $schedule->id,
                    'type' => $type,
                ],
                array_merge($data, [
                    'status' => $status ?: 'present',
                ])
            );
        });
    }
}
