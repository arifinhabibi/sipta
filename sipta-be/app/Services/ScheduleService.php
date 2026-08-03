<?php

namespace App\Services;

use App\Exceptions\BusinessRuleException;
use App\Models\AcademicYear;
use App\Models\Classroom;
use App\Models\Schedule;
use App\Models\Subject;
use App\Models\Teacher;
use Illuminate\Support\Facades\DB;

class ScheduleService
{
    public function create(array $data, AcademicYear $academicYear)
    {
        return DB::transaction(function () use ($data, $academicYear) {
            $this->assertReferences($data, $academicYear);
            $this->assertNoConflict($data);

            $data['academic_year_id'] = $academicYear->id;
            $data['status'] = 'scheduled';
            $data['is_completed'] = false;

            return Schedule::create($data);
        });
    }

    public function update(
        Schedule $schedule,
        array $data,
        AcademicYear $academicYear
    ) {
        return DB::transaction(function () use ($schedule, $data, $academicYear) {
            Schedule::where('id', $schedule->id)->lockForUpdate()->first();
            $this->assertReferences($data, $academicYear);
            $this->assertNoConflict($data, $schedule->id);

            $data['academic_year_id'] = $academicYear->id;
            $schedule->update($data);

            return $schedule->fresh();
        });
    }

    private function assertReferences(array $data, AcademicYear $academicYear)
    {
        $teacher = Teacher::where('id', $data['teacher_id'])
            ->lockForUpdate()
            ->first();
        $classroom = Classroom::where('id', $data['classroom_id'])
            ->lockForUpdate()
            ->first();
        $subject = Subject::find($data['subject_id']);

        if (!$teacher || !$classroom || !$subject) {
            throw new BusinessRuleException(
                'Teacher, classroom, atau subject tidak ditemukan.'
            );
        }

        $instanceIds = array_unique([
            $teacher->instance_id,
            $classroom->instance_id,
            $subject->instance_id,
            $academicYear->instance_id,
        ]);

        if (count($instanceIds) !== 1) {
            throw new BusinessRuleException(
                'Semua referensi jadwal harus berasal dari instance yang sama.'
            );
        }
    }

    private function assertNoConflict(array $data, $ignoreScheduleId = null)
    {
        $base = Schedule::whereDate('date', $data['date'])
            ->where('start_time', '<', $data['end_time'])
            ->where('end_time', '>', $data['start_time'])
            ->where('status', '!=', 'cancelled');

        if ($ignoreScheduleId) {
            $base->where('id', '!=', $ignoreScheduleId);
        }

        if ((clone $base)->where('classroom_id', $data['classroom_id'])->exists()) {
            throw new BusinessRuleException(
                'Kelas sudah memiliki jadwal pada rentang waktu tersebut.'
            );
        }

        if ((clone $base)->where('teacher_id', $data['teacher_id'])->exists()) {
            throw new BusinessRuleException(
                'Guru sudah memiliki jadwal pada rentang waktu tersebut.'
            );
        }
    }
}
