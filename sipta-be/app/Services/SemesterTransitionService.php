<?php

namespace App\Services;

use App\Exceptions\BusinessRuleException;
use App\Models\AcademicYear;
use App\Models\StudentClassroomPlacement;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SemesterTransitionService
{
    public function rollover(
        AcademicYear $source,
        AcademicYear $target
    ) {
        $this->assertOddToEvenPair($source, $target);

        return DB::transaction(function () use ($source, $target) {
            $sourcePlacements = StudentClassroomPlacement::with([
                'student', 'classroom',
            ])->where('academic_year_id', $source->id)
                ->lockForUpdate()->get();

            $now = now();
            $placementRows = [];
            $decisionRows = [];

            foreach ($sourcePlacements as $sourcePlacement) {
                if (
                    !$sourcePlacement->student
                    || !$sourcePlacement->classroom
                    || $sourcePlacement->student->status !== 'active'
                ) {
                    continue;
                }

                $placementRows[] = [
                    'id' => (string) Str::uuid(),
                    'student_id' => $sourcePlacement->student_id,
                    'classroom_id' => $sourcePlacement->classroom_id,
                    'academic_year_id' => $target->id,
                    'is_current' => (bool) $target->is_active,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
                $decisionRows[] = [
                    'id' => (string) Str::uuid(),
                    'student_id' => $sourcePlacement->student_id,
                    'source_academic_year_id' => $source->id,
                    'target_academic_year_id' => $target->id,
                    'source_classroom_id' => $sourcePlacement->classroom_id,
                    'target_classroom_id' => $sourcePlacement->classroom_id,
                    'decision' => 'continued',
                    'recommendation' => 'continue_same_class',
                    'decided_at' => $now,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            if (!empty($placementRows)) {
                DB::table('student_classroom_placements')->upsert(
                    $placementRows,
                    ['student_id', 'academic_year_id'],
                    ['classroom_id', 'is_current', 'updated_at']
                );
                DB::table('student_promotion_decisions')->upsert(
                    $decisionRows,
                    [
                        'student_id',
                        'source_academic_year_id',
                        'target_academic_year_id',
                    ],
                    [
                        'source_classroom_id',
                        'target_classroom_id',
                        'decision',
                        'recommendation',
                        'decided_at',
                        'updated_at',
                    ]
                );
            }

            return StudentClassroomPlacement::where(
                'academic_year_id',
                $target->id
            )->get();
        });
    }

    private function assertOddToEvenPair(AcademicYear $source, AcademicYear $target)
    {
        if (
            $source->instance_id !== $target->instance_id
            || !$source->isOddSemester()
            || !$target->isEvenSemester()
            || $source->name !== $target->name
            || $target->start_periode->lte($source->start_periode)
            || $source->status !== 'closed'
        ) {
            throw new BusinessRuleException(
                'Rollover memerlukan semester ganjil yang sudah ditutup dan semester genap pada tahun akademik yang sama.'
            );
        }
    }
}
