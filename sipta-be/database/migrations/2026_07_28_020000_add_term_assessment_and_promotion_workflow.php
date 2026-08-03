<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use App\Services\AssessmentPeriodDetector;

class AddTermAssessmentAndPromotionWorkflow extends Migration
{
    public function up()
    {
        if (!Schema::hasColumn('academic_years', 'status')) {
            Schema::table('academic_years', function (Blueprint $table) {
                $table->enum('status', ['draft', 'active', 'closed'])
                    ->default('draft')->after('is_active');
                $table->timestamp('closed_at')->nullable()->after('status');
            });
        }

        if (!Schema::hasColumn('schedules', 'assessment_period')) {
            Schema::table('schedules', function (Blueprint $table) {
                $table->enum('assessment_period', ['regular', 'uts', 'uas'])
                    ->default('regular')->after('completed_at');
            });
        }

        DB::table('academic_years')->where('is_active', true)
            ->update(['status' => 'active']);

        // Legacy data encoded UTS/UAS in assessment names. Normalize it once;
        // all new writes must set schedules.assessment_period explicitly.
        // Token boundaries are required: a substring search for "uas" also
        // matches Indonesian words such as "evaluasi".
        $this->backfillAssessmentPeriods();

        if (DB::getDriverName() === 'mysql') {
            DB::statement(
                "ALTER TABLE accomplishments MODIFY type ENUM(" .
                "'knowledge','skill','attitude','creativity'," .
                "'creativity1','creativity2') NOT NULL DEFAULT 'knowledge'"
            );
        }

        DB::table('accomplishments')
            ->whereIn('type', ['creativity1', 'creativity2'])
            ->update(['type' => 'creativity']);

        if (DB::getDriverName() === 'mysql') {
            DB::statement(
                "ALTER TABLE accomplishments MODIFY type ENUM(" .
                "'knowledge','skill','attitude','creativity') " .
                "NOT NULL DEFAULT 'knowledge'"
            );
        }

        if (!Schema::hasTable('student_promotion_decisions')) {
            Schema::create('student_promotion_decisions', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('student_id')->constrained()->cascadeOnDelete();
                $table->foreignUuid('source_academic_year_id')
                    ->constrained('academic_years')->cascadeOnDelete();
                $table->foreignUuid('target_academic_year_id')
                    ->constrained('academic_years')->cascadeOnDelete();
                $table->foreignUuid('source_classroom_id')
                    ->constrained('classrooms')->restrictOnDelete();
                $table->foreignUuid('target_classroom_id')->nullable()
                    ->constrained('classrooms')->restrictOnDelete();
                $table->enum('decision', [
                    'continued', 'promoted', 'repeated', 'graduated', 'withdrawn'
                ]);
                $table->enum('recommendation', [
                    'continue_same_class', 'promote', 'review', 'not_eligible'
                ]);
                $table->decimal('final_score', 5, 2)->nullable();
                $table->decimal('attendance_percentage', 5, 2)->nullable();
                $table->text('override_reason')->nullable();
                $table->timestamp('decided_at');
                $table->timestamps();
                $table->unique(
                    ['student_id', 'source_academic_year_id', 'target_academic_year_id'],
                    'promotion_decision_student_term_unique'
                );
            });
        }
    }

    public function down()
    {
        Schema::dropIfExists('student_promotion_decisions');
    }

    private function backfillAssessmentPeriods()
    {
        $detector = app(AssessmentPeriodDetector::class);
        $periodsBySchedule = [];

        $candidates = DB::table('accomplishments')
            ->select(['schedule_id', 'name'])
            ->where(function ($query) {
                $query->whereRaw('LOWER(name) LIKE ?', ['%uts%'])
                    ->orWhereRaw('LOWER(name) LIKE ?', ['%uas%']);
            })
            ->get();

        foreach ($candidates as $candidate) {
            foreach ($detector->detect($candidate->name) as $period) {
                $periodsBySchedule[$candidate->schedule_id][$period] = true;
            }
        }

        $ambiguousScheduleIds = [];
        foreach ($periodsBySchedule as $scheduleId => $periods) {
            if (count($periods) > 1) {
                $ambiguousScheduleIds[] = $scheduleId;
            }
        }

        if (!empty($ambiguousScheduleIds)) {
            throw new \RuntimeException(
                'Schedule memiliki marker UTS dan UAS sekaligus: ' .
                implode(', ', $ambiguousScheduleIds) . '. ' .
                'Perbaiki nama assessment sebelum melanjutkan migration.'
            );
        }

        foreach ($periodsBySchedule as $scheduleId => $periods) {
            DB::table('schedules')->where('id', $scheduleId)->update([
                'assessment_period' => array_keys($periods)[0],
            ]);
        }
    }
}
