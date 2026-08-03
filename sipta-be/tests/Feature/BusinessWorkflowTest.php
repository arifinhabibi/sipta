<?php

namespace Tests\Feature;

use App\Exceptions\BusinessRuleException;
use App\Models\AcademicYear;
use App\Models\Accomplishment;
use App\Models\Classroom;
use App\Models\Instance;
use App\Models\Student;
use App\Models\StudentAccomplishment;
use App\Models\StudentAttendance;
use App\Models\StudentClassroomPlacement;
use App\Models\StudentPromotionDecision;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\User;
use App\Services\AcademicYearService;
use App\Services\PromoteStudentsService;
use App\Services\RecordStudentAttendanceService;
use App\Services\ScheduleService;
use App\Services\SemesterTransitionService;
use App\Services\StudentPlacementService;
use App\Services\StudentPerformanceService;
use App\Services\TeacherAttendanceService;
use App\Services\AttendanceReportService;
use App\Services\HistoricalScheduleReconciliationService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class BusinessWorkflowTest extends TestCase
{
    use RefreshDatabase;

    private $instance;
    private $activeYear;
    private $targetYear;
    private $nextYear;
    private $teacher;
    private $classroom;
    private $targetClassroom;
    private $subject;

    protected function setUp(): void
    {
        parent::setUp();

        $this->instance = Instance::create(['name' => 'TPA Test']);
        $this->activeYear = AcademicYear::create([
            'instance_id' => $this->instance->id,
            'name' => '2026/2027',
            'periode' => 'ganjil',
            'start_periode' => '2026-01-01',
            'end_periode' => '2026-06-30',
            'is_active' => true,
        ]);
        $this->targetYear = AcademicYear::create([
            'instance_id' => $this->instance->id,
            'name' => '2026/2027',
            'periode' => 'genap',
            'start_periode' => '2026-07-01',
            'end_periode' => '2026-12-31',
            'is_active' => false,
        ]);
        $this->nextYear = AcademicYear::create([
            'instance_id' => $this->instance->id,
            'name' => '2027/2028',
            'periode' => 'ganjil',
            'start_periode' => '2027-01-01',
            'end_periode' => '2027-06-30',
            'is_active' => false,
        ]);

        $user = User::create([
            'username' => 'teacher-test',
            'password' => Hash::make('password'),
        ]);
        $this->teacher = Teacher::create([
            'user_id' => $user->id,
            'instance_id' => $this->instance->id,
            'full_name' => 'Teacher Test',
            'gender' => 'male',
        ]);
        $this->classroom = Classroom::create([
            'instance_id' => $this->instance->id,
            'teacher_id' => $this->teacher->id,
            'name' => 'Class A',
            'capacity' => 20,
        ]);
        $this->targetClassroom = Classroom::create([
            'instance_id' => $this->instance->id,
            'teacher_id' => $this->teacher->id,
            'name' => 'Class B',
            'capacity' => 20,
        ]);
        $this->subject = Subject::create([
            'instance_id' => $this->instance->id,
            'name' => 'Tahfidz',
            'code' => 'THF',
        ]);
    }

    public function test_schedule_conflict_uses_real_time_overlap()
    {
        $service = app(ScheduleService::class);
        $base = [
            'teacher_id' => $this->teacher->id,
            'subject_id' => $this->subject->id,
            'classroom_id' => $this->classroom->id,
            'date' => '2026-03-01',
        ];

        $service->create(array_merge($base, [
            'start_time' => '09:00',
            'end_time' => '10:00',
        ]), $this->activeYear);

        $adjacent = $service->create(array_merge($base, [
            'start_time' => '10:00',
            'end_time' => '11:00',
        ]), $this->activeYear);

        $this->assertNotNull($adjacent->id);

        $this->expectException(BusinessRuleException::class);
        $service->create(array_merge($base, [
            'start_time' => '09:30',
            'end_time' => '10:30',
        ]), $this->activeYear);
    }

    public function test_attendance_submission_is_atomic_and_idempotent()
    {
        $placementService = app(StudentPlacementService::class);
        $student = $this->createStudent('Student One');
        $placementService->place(
            $student,
            $this->classroom,
            $this->activeYear
        );

        $schedule = app(ScheduleService::class)->create([
            'teacher_id' => $this->teacher->id,
            'subject_id' => $this->subject->id,
            'classroom_id' => $this->classroom->id,
            'date' => '2026-03-02',
            'start_time' => '09:00',
            'end_time' => '10:00',
        ], $this->activeYear);
        $accomplishment = Accomplishment::create([
            'schedule_id' => $schedule->id,
            'name' => 'Membaca',
            'type' => 'skill',
        ]);

        $entry = [[
            'student_id' => $student->id,
            'attendance' => 'present',
            'note' => null,
            'accomplishments' => [[
                'accomplishment_id' => $accomplishment->id,
                'is_capable' => false,
                'score' => 70,
            ]],
        ]];

        $service = app(RecordStudentAttendanceService::class);
        $service->record($schedule, $entry);
        $entry[0]['attendance'] = 'permission';
        $entry[0]['accomplishments'][0]['score'] = 60;
        $service->record($schedule, $entry);

        $this->assertSame(1, StudentAttendance::count());
        $this->assertSame(1, StudentAccomplishment::count());
        $this->assertSame(
            'permission',
            StudentAttendance::first()->status
        );
        $this->assertFalse(
            (bool) StudentAccomplishment::first()->is_capable
        );
        $this->assertNotNull(StudentAccomplishment::first()->rated_at);
        $this->assertSame('completed', $schedule->fresh()->status);
    }

    public function test_finalizing_attendance_marks_omitted_roster_students_absent()
    {
        $present = $this->createStudent('Present Student');
        $omitted = $this->createStudent('Omitted Student');
        $placements = app(StudentPlacementService::class);
        $placements->place($present, $this->classroom, $this->activeYear);
        $placements->place($omitted, $this->classroom, $this->activeYear);
        $schedule = app(ScheduleService::class)->create([
            'teacher_id' => $this->teacher->id,
            'subject_id' => $this->subject->id,
            'classroom_id' => $this->classroom->id,
            'date' => '2026-03-03',
            'start_time' => '09:00',
            'end_time' => '10:00',
        ], $this->activeYear);

        app(RecordStudentAttendanceService::class)->record($schedule, [[
            'student_id' => $present->id,
            'attendance' => 'present',
            'accomplishments' => [],
        ]]);

        $this->assertDatabaseHas('student_attendances', [
            'student_id' => $omitted->id,
            'schedule_id' => $schedule->id,
            'status' => 'absent',
        ]);
    }

    public function test_promotion_moves_only_selected_students_and_keeps_history()
    {
        $this->targetYear->update(['status' => 'active']);
        $placementService = app(StudentPlacementService::class);
        $selected = $this->createStudent('Selected Student');
        $notSelected = $this->createStudent('Other Student');

        $placementService->place(
            $selected,
            $this->classroom,
            $this->targetYear
        );
        $placementService->place(
            $notSelected,
            $this->classroom,
            $this->targetYear
        );

        app(PromoteStudentsService::class)->promote(
            [$selected->id],
            $this->targetYear,
            $this->nextYear,
            $this->targetClassroom,
            'Test override untuk data fixture tanpa assessment.'
        );

        $this->assertDatabaseHas('student_classroom_placements', [
            'student_id' => $selected->id,
            'academic_year_id' => $this->targetYear->id,
            'classroom_id' => $this->classroom->id,
        ]);
        $this->assertDatabaseHas('student_classroom_placements', [
            'student_id' => $selected->id,
            'academic_year_id' => $this->nextYear->id,
            'classroom_id' => $this->targetClassroom->id,
        ]);
        $this->assertDatabaseMissing('student_classroom_placements', [
            'student_id' => $notSelected->id,
            'academic_year_id' => $this->nextYear->id,
        ]);
        $this->assertDatabaseHas('student_promotion_decisions', [
            'student_id' => $selected->id,
            'decision' => 'promoted',
            'source_academic_year_id' => $this->targetYear->id,
            'target_academic_year_id' => $this->nextYear->id,
        ]);
    }

    public function test_odd_to_even_rollover_keeps_the_same_classroom()
    {
        $this->activeYear->update([
            'status' => 'closed',
            'is_active' => false,
        ]);
        $student = $this->createStudent('Semester Student');
        app(StudentPlacementService::class)->place(
            $student,
            $this->classroom,
            $this->activeYear
        );

        app(SemesterTransitionService::class)->rollover(
            $this->activeYear,
            $this->targetYear
        );

        $this->assertDatabaseHas('student_classroom_placements', [
            'student_id' => $student->id,
            'academic_year_id' => $this->targetYear->id,
            'classroom_id' => $this->classroom->id,
        ]);
        $this->assertDatabaseHas('student_promotion_decisions', [
            'student_id' => $student->id,
            'decision' => 'continued',
            'recommendation' => 'continue_same_class',
        ]);
    }

    public function test_student_report_accumulates_scores_per_subject()
    {
        $student = $this->createStudent('Performance Student');
        app(StudentPlacementService::class)->place(
            $student,
            $this->classroom,
            $this->activeYear
        );

        foreach (['regular' => 80, 'uts' => 70, 'uas' => 90] as $period => $score) {
            $schedule = app(ScheduleService::class)->create([
                'teacher_id' => $this->teacher->id,
                'subject_id' => $this->subject->id,
                'classroom_id' => $this->classroom->id,
                'date' => '2026-04-' . (
                    $period === 'regular' ? '01' : ($period === 'uts' ? '02' : '03')
                ),
                'start_time' => '09:00',
                'end_time' => '10:00',
                'assessment_period' => $period,
            ], $this->activeYear);
            $accomplishment = Accomplishment::create([
                'schedule_id' => $schedule->id,
                'name' => 'Assessment ' . $period,
                'type' => 'knowledge',
            ]);
            app(RecordStudentAttendanceService::class)->record($schedule, [[
                'student_id' => $student->id,
                'attendance' => 'present',
                'accomplishments' => [[
                    'accomplishment_id' => $accomplishment->id,
                    'is_capable' => true,
                    'score' => $score,
                ]],
            ]]);
        }

        $secondSubject = Subject::create([
            'instance_id' => $this->instance->id,
            'name' => 'Akhlak',
            'code' => 'AKH',
        ]);
        foreach (['regular' => 60, 'uts' => 50, 'uas' => 70] as $period => $score) {
            $schedule = app(ScheduleService::class)->create([
                'teacher_id' => $this->teacher->id,
                'subject_id' => $secondSubject->id,
                'classroom_id' => $this->classroom->id,
                'date' => '2026-04-' . (
                    $period === 'regular' ? '04' : ($period === 'uts' ? '05' : '06')
                ),
                'start_time' => '09:00',
                'end_time' => '10:00',
                'assessment_period' => $period,
            ], $this->activeYear);
            $accomplishment = Accomplishment::create([
                'schedule_id' => $schedule->id,
                'name' => 'Assessment ' . $period,
                'type' => 'knowledge',
            ]);
            app(RecordStudentAttendanceService::class)->record($schedule, [[
                'student_id' => $student->id,
                'attendance' => 'present',
                'accomplishments' => [[
                    'accomplishment_id' => $accomplishment->id,
                    'is_capable' => true,
                    'score' => $score,
                ]],
            ]]);
        }

        $performance = app(StudentPerformanceService::class)->forStudent(
            $student,
            $this->activeYear
        );
        $subjects = $performance['subjects']->keyBy('subject.id');
        $this->assertSame(
            80.0,
            $subjects[$this->subject->id]['assessment_averages']['regular']
        );
        $this->assertSame(
            70.0,
            $subjects[$this->subject->id]['assessment_averages']['uts']
        );
        $this->assertSame(
            90.0,
            $subjects[$this->subject->id]['assessment_averages']['uas']
        );
        $this->assertSame(81.0, $subjects[$this->subject->id]['final_score']);
        $this->assertSame(61.0, $subjects[$secondSubject->id]['final_score']);
        $this->assertSame(71.0, $performance['final_score']);
        $this->assertSame(2, $performance['subject_count']);
        $this->assertSame('continue_same_class', $performance[
            'promotion_recommendation'
        ]);
    }

    public function test_teacher_attendance_is_counted_once_per_schedule()
    {
        $schedule = app(ScheduleService::class)->create([
            'teacher_id' => $this->teacher->id,
            'subject_id' => $this->subject->id,
            'classroom_id' => $this->classroom->id,
            'date' => '2026-05-01',
            'start_time' => '09:00',
            'end_time' => '10:00',
        ], $this->activeYear);

        Carbon::setTestNow('2026-05-01 09:20:00');
        $service = app(TeacherAttendanceService::class);
        $checkIn = $service->record(
            $this->teacher,
            $schedule,
            'check_in',
            []
        );
        Carbon::setTestNow('2026-05-01 10:01:00');
        $service->record($this->teacher, $schedule, 'check_out', []);
        Carbon::setTestNow();

        $report = app(AttendanceReportService::class)->getData(
            '2026-05-01',
            '2026-05-01',
            $this->teacher->id,
            $this->activeYear->id
        );

        $this->assertSame('late', $checkIn->status);
        $this->assertCount(1, $report[0]);
        $this->assertSame(1, $report[5]['total_attendances']);
        $this->assertSame(1, $report[5]['late_count']);
        $this->assertSame(1, $report[5]['check_out_count']);
    }

    public function test_activating_academic_year_switches_current_placements()
    {
        $student = $this->createStudent('Student Active Year');
        $placementService = app(StudentPlacementService::class);
        $placementService->place(
            $student,
            $this->classroom,
            $this->activeYear
        );
        $placementService->place(
            $student,
            $this->targetClassroom,
            $this->targetYear
        );

        app(AcademicYearService::class)->activate($this->targetYear);

        $this->assertFalse($this->activeYear->fresh()->is_active);
        $this->assertTrue($this->targetYear->fresh()->is_active);
        $this->assertDatabaseHas('student_classroom_placements', [
            'student_id' => $student->id,
            'academic_year_id' => $this->activeYear->id,
            'is_current' => false,
        ]);
        $this->assertDatabaseHas('student_classroom_placements', [
            'student_id' => $student->id,
            'academic_year_id' => $this->targetYear->id,
            'is_current' => true,
        ]);
    }

    public function test_even_semester_cannot_be_activated_before_roster_rollover()
    {
        $student = $this->createStudent('Student Missing Rollover');
        app(StudentPlacementService::class)->place(
            $student,
            $this->classroom,
            $this->activeYear
        );

        $this->expectException(BusinessRuleException::class);
        $this->expectExceptionMessage('Roster semester genap belum disalin');

        app(AcademicYearService::class)->activate($this->targetYear);
    }

    public function test_next_year_cannot_activate_until_all_active_students_are_promoted()
    {
        $student = $this->createStudent('Student Missing Promotion');
        app(StudentPlacementService::class)->place(
            $student,
            $this->classroom,
            $this->targetYear
        );

        $this->expectException(BusinessRuleException::class);
        $this->expectExceptionMessage('Keputusan kenaikan kelas belum lengkap');

        app(AcademicYearService::class)->activate($this->nextYear);
    }

    public function test_historical_schedule_reconciliation_uses_activity_evidence()
    {
        $withEvidence = app(ScheduleService::class)->create([
            'teacher_id' => $this->teacher->id,
            'subject_id' => $this->subject->id,
            'classroom_id' => $this->classroom->id,
            'date' => '2026-02-01',
            'start_time' => '09:00',
            'end_time' => '10:00',
        ], $this->activeYear);
        $withoutEvidence = app(ScheduleService::class)->create([
            'teacher_id' => $this->teacher->id,
            'subject_id' => $this->subject->id,
            'classroom_id' => $this->classroom->id,
            'date' => '2026-02-02',
            'start_time' => '09:00',
            'end_time' => '10:00',
        ], $this->activeYear);
        \App\Models\TeacherAttendance::create([
            'teacher_id' => $this->teacher->id,
            'schedule_id' => $withEvidence->id,
            'type' => 'check_in',
            'status' => 'present',
        ]);

        $result = app(HistoricalScheduleReconciliationService::class)
            ->resolve($this->activeYear);

        $this->assertSame(1, $result['completed']);
        $this->assertSame(1, $result['cancelled']);
        $this->assertSame('completed', $withEvidence->fresh()->status);
        $this->assertTrue($withEvidence->fresh()->is_completed);
        $this->assertSame('cancelled', $withoutEvidence->fresh()->status);
    }

    public function test_schedule_in_target_period_can_be_reassigned_safely()
    {
        $schedule = app(ScheduleService::class)->create([
            'teacher_id' => $this->teacher->id,
            'subject_id' => $this->subject->id,
            'classroom_id' => $this->classroom->id,
            'date' => '2026-08-01',
            'start_time' => '09:00',
            'end_time' => '10:00',
        ], $this->activeYear);

        $moved = app(HistoricalScheduleReconciliationService::class)
            ->moveSchedulesInTargetPeriod($this->activeYear, $this->targetYear);

        $this->assertSame(1, $moved);
        $this->assertSame(
            $this->targetYear->id,
            $schedule->fresh()->academic_year_id
        );
    }

    private function createStudent($name)
    {
        return Student::create([
            'instance_id' => $this->instance->id,
            'fullname' => $name,
            'gender' => 'male',
            'status' => 'active',
        ]);
    }
}
