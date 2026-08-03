<?php

namespace App\Services;

use App\Exceptions\BusinessRuleException;
use App\Models\Schedule;
use App\Models\StudentAccomplishment;
use App\Models\StudentAttendance;
use App\Models\StudentClassroomPlacement;
use Illuminate\Support\Facades\DB;

class RecordStudentAttendanceService
{
    public function record(Schedule $schedule, array $studentEntries)
    {
        return DB::transaction(function () use ($schedule, $studentEntries) {
            $schedule = Schedule::with('accomplishments')
                ->lockForUpdate()
                ->findOrFail($schedule->id);

            if ($schedule->status === 'cancelled') {
                throw new BusinessRuleException(
                    'Attendance tidak dapat dicatat pada jadwal yang dibatalkan.'
                );
            }

            $allowedAccomplishments = $schedule->accomplishments->keyBy('id');
            $studentIds = collect($studentEntries)
                ->pluck('student_id')
                ->unique()
                ->values();

            $placedStudentIds = StudentClassroomPlacement::whereIn(
                'student_id',
                $studentIds
            )
                ->where('academic_year_id', $schedule->academic_year_id)
                ->where('classroom_id', $schedule->classroom_id)
                ->pluck('student_id');

            $invalidStudentIds = $studentIds->diff($placedStudentIds)->values();
            if ($invalidStudentIds->isNotEmpty()) {
                throw new BusinessRuleException(
                    'Ada siswa yang tidak terdaftar di kelas jadwal ini.',
                    ['student_ids' => $invalidStudentIds->all()]
                );
            }

            foreach ($studentEntries as $entry) {
                StudentAttendance::updateOrCreate(
                    [
                        'student_id' => $entry['student_id'],
                        'schedule_id' => $schedule->id,
                    ],
                    [
                        'status' => $entry['attendance'],
                        'note' => isset($entry['note']) ? $entry['note'] : null,
                    ]
                );

                foreach ($entry['accomplishments'] as $assessment) {
                    $accomplishment = $allowedAccomplishments->get(
                        $assessment['accomplishment_id']
                    );

                    if (!$accomplishment) {
                        throw new BusinessRuleException(
                            'Accomplishment tidak dimiliki oleh jadwal ini.',
                            ['accomplishment_id' => $assessment['accomplishment_id']]
                        );
                    }

                    $score = isset($assessment['score'])
                        ? (int) $assessment['score']
                        : null;
                    $isCapable = (bool) $assessment['is_capable'];

                    if ($accomplishment->type === 'skill' && $score !== null) {
                        $isCapable = $score >= config(
                            'santrack.assessment.skill_passing_score'
                        );
                    }

                    StudentAccomplishment::updateOrCreate(
                        [
                            'student_id' => $entry['student_id'],
                            'accomplishment_id' => $accomplishment->id,
                        ],
                        [
                            'is_capable' => $isCapable,
                            'score' => $score,
                            'note' => isset($assessment['note'])
                                ? $assessment['note']
                                : null,
                            'rated_at' => now(),
                        ]
                    );
                }
            }

            // Finalizing a session creates a complete roster. Students omitted
            // by the client are explicitly absent, so reports never undercount
            // the denominator because a row was simply missing.
            $submittedStudentIds = $studentIds->all();
            $rosterStudentIds = StudentClassroomPlacement::where(
                'academic_year_id',
                $schedule->academic_year_id
            )->where('classroom_id', $schedule->classroom_id)
                ->pluck('student_id');

            foreach ($rosterStudentIds->diff($submittedStudentIds) as $studentId) {
                StudentAttendance::updateOrCreate(
                    [
                        'student_id' => $studentId,
                        'schedule_id' => $schedule->id,
                    ],
                    [
                        'status' => 'absent',
                        'note' => 'Tidak tercantum saat sesi difinalisasi.',
                    ]
                );
            }

            $schedule->markCompleted();

            return $schedule->fresh([
                'studentAttendances',
                'accomplishments.studentAssessments',
            ]);
        });
    }
}
