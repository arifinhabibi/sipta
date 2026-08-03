<?php

namespace App\Services;

use App\Exceptions\BusinessRuleException;
use App\Models\AcademicYear;
use App\Models\Classroom;
use App\Models\Student;
use App\Models\StudentClassroomPlacement;
use Illuminate\Support\Facades\DB;

class StudentPlacementService
{
    public function place(
        Student $student,
        Classroom $classroom,
        AcademicYear $academicYear
    ) {
        return DB::transaction(function () use (
            $student,
            $classroom,
            $academicYear
        ) {
            Classroom::where('id', $classroom->id)->lockForUpdate()->first();
            $this->assertSameInstance($student, $classroom, $academicYear);

            if ($classroom->capacity !== null) {
                $occupied = StudentClassroomPlacement::where(
                    'academic_year_id',
                    $academicYear->id
                )
                    ->where('classroom_id', $classroom->id)
                    ->where('student_id', '!=', $student->id)
                    ->count();

                if ($occupied >= $classroom->capacity) {
                    throw new BusinessRuleException('Kapasitas kelas sudah penuh.');
                }
            }

            if ($academicYear->is_active) {
                StudentClassroomPlacement::where('student_id', $student->id)
                    ->update(['is_current' => false]);
            }

            return StudentClassroomPlacement::updateOrCreate(
                [
                    'student_id' => $student->id,
                    'academic_year_id' => $academicYear->id,
                ],
                [
                    'classroom_id' => $classroom->id,
                    'is_current' => (bool) $academicYear->is_active,
                ]
            );
        });
    }

    private function assertSameInstance(
        Student $student,
        Classroom $classroom,
        AcademicYear $academicYear
    ) {
        $instanceIds = array_unique(array_filter([
            $student->instance_id,
            $classroom->instance_id,
            $academicYear->instance_id,
        ]));

        if (count($instanceIds) !== 1) {
            throw new BusinessRuleException(
                'Siswa, kelas, dan tahun akademik harus berasal dari instance yang sama.'
            );
        }
    }
}
