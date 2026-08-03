<?php

namespace App\Services;

use App\Models\AcademicYear;
use App\Models\Classroom;
use App\Models\Schedule;
use App\Models\Student;
use App\Models\StudentClassroomPlacement;
use Illuminate\Support\Collection;

class StudentPerformanceService
{
    private $scoreService;

    public function __construct(PerformanceScoreService $scoreService)
    {
        $this->scoreService = $scoreService;
    }

    public function forClassroom(
        Classroom $classroom,
        AcademicYear $academicYear
    ): Collection {
        $students = Student::whereHas('placements', function ($query) use (
            $classroom,
            $academicYear
        ) {
            $query->where('classroom_id', $classroom->id)
                ->where('academic_year_id', $academicYear->id);
        })->get();

        $results = $students->map(function ($student) use (
            $classroom,
            $academicYear
        ) {
            return $this->forStudent($student, $academicYear, $classroom);
        })->sortByDesc(function ($item) {
            return $item['is_complete']
                ? $item['final_score'] : $item['provisional_score'];
        })->values();

        return $results->map(function ($item, $index) {
            $item['rank'] = $index + 1;
            return $item;
        });
    }

    public function forStudent(
        Student $student,
        AcademicYear $academicYear,
        Classroom $classroom = null
    ): array {
        $placement = StudentClassroomPlacement::with('classroom')
            ->where('student_id', $student->id)
            ->where('academic_year_id', $academicYear->id)
            ->when($classroom, function ($query) use ($classroom) {
                $query->where('classroom_id', $classroom->id);
            })
            ->firstOrFail();

        $schedules = Schedule::with([
            'subject',
            'studentAttendances' => function ($query) use ($student) {
                $query->where('student_id', $student->id);
            },
            'accomplishments.studentAssessments' => function ($query) use ($student) {
                $query->where('student_id', $student->id);
            },
        ])->where('academic_year_id', $academicYear->id)
            ->where('classroom_id', $placement->classroom_id)
            ->where('status', 'completed')
            ->get();

        $statusCounts = collect([
            'present' => 0, 'late' => 0, 'absent' => 0,
            'sick' => 0, 'permission' => 0,
        ]);
        $subjectBuckets = [];

        foreach ($schedules as $schedule) {
            $attendance = $schedule->studentAttendances->first();
            $status = $attendance ? $attendance->status : 'absent';
            $statusCounts->put(
                $status,
                $statusCounts->get($status, 0) + 1
            );

            if (!isset($subjectBuckets[$schedule->subject_id])) {
                $subjectBuckets[$schedule->subject_id] = [
                    'subject' => $schedule->subject,
                    'completed_sessions' => 0,
                    'periods' => [
                        'regular' => [], 'uts' => [], 'uas' => [],
                    ],
                    'domains' => [
                        'knowledge' => [], 'skill' => [],
                        'attitude' => [], 'creativity' => [],
                    ],
                ];
            }
            $subjectBuckets[$schedule->subject_id]['completed_sessions']++;

            foreach ($schedule->accomplishments as $accomplishment) {
                $assessment = $accomplishment->studentAssessments->first();
                if (!$assessment || $assessment->score === null) {
                    continue;
                }

                $score = (float) $assessment->score;
                $period = $schedule->assessment_period ?: 'regular';
                $subjectBuckets[$schedule->subject_id]['periods'][$period][]
                    = $score;

                $domain = in_array($accomplishment->type, [
                    'creativity1', 'creativity2',
                ], true) ? 'creativity' : $accomplishment->type;
                if (isset(
                    $subjectBuckets[$schedule->subject_id]['domains'][$domain]
                )) {
                    $subjectBuckets[$schedule->subject_id]['domains'][$domain][]
                        = $score;
                }
            }
        }

        $subjectReports = collect($subjectBuckets)->map(function ($bucket) {
            $periodAverages = $this->averages($bucket['periods']);
            $missing = collect($periodAverages)->filter(function ($value) {
                return $value === null;
            })->keys()->values()->all();
            $isComplete = empty($missing);

            return [
                'subject' => $bucket['subject'],
                'completed_sessions' => $bucket['completed_sessions'],
                'assessment_averages' => $periodAverages,
                'domain_averages' => $this->averages($bucket['domains']),
                'provisional_score' => $this->scoreService->calculateSubject(
                    $periodAverages,
                    true
                ),
                'final_score' => $isComplete
                    ? $this->scoreService->calculateSubject($periodAverages)
                    : null,
                'is_complete' => $isComplete,
                'missing_components' => $missing,
            ];
        })->sortBy(function ($report) {
            return $report['subject']->name;
        })->values();

        $expectedSessions = $schedules->count();
        $attendedSessions = $statusCounts->get('present')
            + $statusCounts->get('late');
        $attendancePercentage = $expectedSessions
            ? round(($attendedSessions / $expectedSessions) * 100, 2) : 0;

        $provisionalScore = $this->scoreService->averageSubjects(
            $subjectReports->pluck('provisional_score')->all()
        );
        $isComplete = $subjectReports->isNotEmpty()
            && !$subjectReports->contains(function ($report) {
                return !$report['is_complete'];
            });
        $finalScore = $isComplete
            ? $this->scoreService->averageSubjects(
                $subjectReports->pluck('final_score')->all()
            ) : null;

        return [
            'student' => $student,
            'classroom' => $placement->classroom,
            'academic_year' => $academicYear,
            'attendance' => [
                'expected_sessions' => $expectedSessions,
                'attended_sessions' => $attendedSessions,
                'percentage' => $attendancePercentage,
                'by_status' => $statusCounts->all(),
            ],
            'subjects' => $subjectReports,
            'subject_count' => $subjectReports->count(),
            'provisional_score' => $provisionalScore,
            'final_score' => $finalScore,
            'is_complete' => $isComplete,
            'incomplete_subject_ids' => $subjectReports
                ->filter(function ($report) {
                    return !$report['is_complete'];
                })->pluck('subject.id')->values()->all(),
            'promotion_recommendation' => $this->scoreService
                ->promotionRecommendation(
                    $academicYear->periode,
                    $finalScore,
                    $attendancePercentage
                ),
        ];
    }

    private function averages(array $groups): array
    {
        return collect($groups)->map(function ($scores) {
            return count($scores)
                ? round(array_sum($scores) / count($scores), 2) : null;
        })->all();
    }
}
