<?php

namespace App\Services;

use App\Exceptions\BusinessRuleException;
use App\Models\AcademicYear;
use App\Models\Classroom;
use App\Models\Student;
use App\Models\StudentClassroomPlacement;
use App\Models\StudentPromotionDecision;
use Illuminate\Support\Facades\DB;

class PromoteStudentsService
{
    private $placementService;
    private $performanceService;

    public function __construct(
        StudentPlacementService $placementService,
        StudentPerformanceService $performanceService
    )
    {
        $this->placementService = $placementService;
        $this->performanceService = $performanceService;
    }

    public function promote(
        array $studentIds,
        AcademicYear $sourceAcademicYear,
        AcademicYear $targetAcademicYear,
        Classroom $targetClassroom,
        $overrideReason = null
    ) {
        $studentIds = array_values(array_unique($studentIds));
        $this->assertValidTarget(
            $sourceAcademicYear,
            $targetAcademicYear,
            $targetClassroom
        );

        return DB::transaction(function () use (
            $studentIds,
            $sourceAcademicYear,
            $targetAcademicYear,
            $targetClassroom,
            $overrideReason
        ) {
            $sourcePlacements = StudentClassroomPlacement::whereIn(
                'student_id',
                $studentIds
            )
                ->where('academic_year_id', $sourceAcademicYear->id)
                ->lockForUpdate()
                ->get()
                ->keyBy('student_id');

            $missingIds = array_values(array_diff(
                $studentIds,
                $sourcePlacements->keys()->all()
            ));

            if (!empty($missingIds)) {
                throw new BusinessRuleException(
                    'Sebagian siswa tidak memiliki placement pada tahun akademik asal.',
                    ['student_ids' => $missingIds]
                );
            }

            $students = Student::whereIn('id', $studentIds)
                ->where('instance_id', $sourceAcademicYear->instance_id)
                ->where('status', 'active')
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            $inactiveOrMissing = array_values(array_diff(
                $studentIds,
                $students->keys()->all()
            ));

            if (!empty($inactiveOrMissing)) {
                throw new BusinessRuleException(
                    'Siswa nonaktif atau tidak ditemukan tidak dapat dipromosikan.',
                    ['student_ids' => $inactiveOrMissing]
                );
            }

            if ($targetClassroom->capacity !== null) {
                $alreadyPlaced = StudentClassroomPlacement::where(
                    'academic_year_id',
                    $targetAcademicYear->id
                )
                    ->where('classroom_id', $targetClassroom->id)
                    ->whereNotIn('student_id', $studentIds)
                    ->count();

                if ($alreadyPlaced + count($studentIds) > $targetClassroom->capacity) {
                    throw new BusinessRuleException(
                        'Jumlah siswa melebihi kapasitas kelas tujuan.'
                    );
                }
            }

            $placements = [];
            foreach ($students as $student) {
                $sourcePlacement = $sourcePlacements->get($student->id);
                $performance = $this->performanceService->forStudent(
                    $student,
                    $sourceAcademicYear
                );
                if (!$performance['is_complete'] && !$overrideReason) {
                    throw new BusinessRuleException(
                        'Penilaian siswa belum lengkap. Lengkapi nilai atau sertakan alasan override.',
                        [
                            'student_id' => $student->id,
                            'incomplete_subject_ids' => $performance[
                                'incomplete_subject_ids'
                            ],
                        ]
                    );
                }
                $placements[] = $this->placementService->place(
                    $student,
                    $targetClassroom,
                    $targetAcademicYear
                );

                StudentPromotionDecision::updateOrCreate(
                    [
                        'student_id' => $student->id,
                        'source_academic_year_id' => $sourceAcademicYear->id,
                        'target_academic_year_id' => $targetAcademicYear->id,
                    ],
                    [
                        'source_classroom_id' => $sourcePlacement->classroom_id,
                        'target_classroom_id' => $targetClassroom->id,
                        'decision' => 'promoted',
                        'recommendation' => $performance[
                            'promotion_recommendation'
                        ],
                        'final_score' => $performance['final_score'],
                        'attendance_percentage' => $performance[
                            'attendance'
                        ]['percentage'],
                        'override_reason' => $overrideReason,
                        'decided_at' => now(),
                    ]
                );
            }

            return collect($placements);
        });
    }

    private function assertValidTarget(
        AcademicYear $source,
        AcademicYear $target,
        Classroom $classroom
    ) {
        if (
            $source->instance_id !== $target->instance_id
            || $source->instance_id !== $classroom->instance_id
        ) {
            throw new BusinessRuleException(
                'Tahun akademik dan kelas tujuan harus berada dalam instance yang sama.'
            );
        }

        if ($target->start_periode->lte($source->start_periode)) {
            throw new BusinessRuleException(
                'Tahun akademik tujuan harus dimulai setelah tahun akademik asal.'
            );
        }

        if (!$source->isEvenSemester() || !$target->isOddSemester()) {
            throw new BusinessRuleException(
                'Kenaikan kelas hanya berlaku dari semester genap ke semester ganjil berikutnya.'
            );
        }

        if (!in_array($source->status, ['active', 'closed'], true)) {
            throw new BusinessRuleException(
                'Semester genap harus aktif atau sudah ditutup untuk memproses kenaikan kelas.'
            );
        }
    }
}
