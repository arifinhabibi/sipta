<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ReconcileBusinessSchemaV2 extends Migration
{
    public function up()
    {
        $this->reconcileUsers();
        $this->reconcileAcademicYears();
        $this->reconcileClassrooms();
        $this->reconcileSubjects();
        $this->reconcileStudents();
        $this->reconcilePlacements();
        $this->reconcileSchedules();
        $this->reconcileAttendancesAndScores();
        $this->backfillOwnership();
        $this->backfillScheduleState();
        $this->normalizeAccomplishmentTypes();
    }

    private function reconcileUsers()
    {
        if (!Schema::hasColumn('users', 'is_active')) {
            Schema::table('users', function (Blueprint $table) {
                $table->boolean('is_active')->default(true)->after('role');
            });
        }
    }

    public function down()
    {
        // This migration deliberately keeps reconciled production columns on rollback.
        // Removing them could destroy data that already existed before this repository
        // had matching migrations.
    }

    private function reconcileAcademicYears()
    {
        if (!Schema::hasColumn('academic_years', 'is_promoted')) {
            Schema::table('academic_years', function (Blueprint $table) {
                $table->boolean('is_promoted')->default(false);
            });
        }
    }

    private function reconcileClassrooms()
    {
        if (!Schema::hasColumn('classrooms', 'instance_id')) {
            Schema::table('classrooms', function (Blueprint $table) {
                $table->uuid('instance_id')->nullable()->index();
            });
        }
    }

    private function reconcileSubjects()
    {
        if (!Schema::hasColumn('subjects', 'instance_id')) {
            Schema::table('subjects', function (Blueprint $table) {
                $table->uuid('instance_id')->nullable()->index();
            });
        }

        if (
            DB::getDriverName() === 'mysql'
            && Schema::hasColumn('subjects', 'academic_year_id')
        ) {
            DB::statement(
                'ALTER TABLE subjects MODIFY academic_year_id CHAR(36) NULL'
            );
        }
    }

    private function reconcileStudents()
    {
        if (!Schema::hasColumn('students', 'instance_id')) {
            Schema::table('students', function (Blueprint $table) {
                $table->uuid('instance_id')->nullable()->index();
            });
        }
    }

    private function reconcilePlacements()
    {
        if (Schema::hasTable('student_classroom_placements')) {
            return;
        }

        Schema::create('student_classroom_placements', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('student_id')->constrained('students')->cascadeOnDelete();
            $table->foreignUuid('classroom_id')->constrained('classrooms')->cascadeOnDelete();
            $table->foreignUuid('academic_year_id')->constrained('academic_years')->cascadeOnDelete();
            $table->boolean('is_current')->default(true);
            $table->timestamps();

            $table->unique(
                ['student_id', 'academic_year_id'],
                'placements_student_academic_year_unique'
            );
            $table->index(
                ['classroom_id', 'academic_year_id'],
                'placements_classroom_academic_year_index'
            );
        });
    }

    private function reconcileSchedules()
    {
        if (!Schema::hasColumn('schedules', 'status')) {
            Schema::table('schedules', function (Blueprint $table) {
                $table->enum(
                    'status',
                    ['scheduled', 'in_progress', 'completed', 'cancelled']
                )->default('scheduled')->after('is_completed');
            });
        }

        if (!Schema::hasColumn('schedules', 'completed_at')) {
            Schema::table('schedules', function (Blueprint $table) {
                $table->timestamp('completed_at')->nullable()->after('status');
            });
        }
    }

    private function reconcileAttendancesAndScores()
    {
        if (!Schema::hasColumn('teacher_attendances', 'notes')) {
            Schema::table('teacher_attendances', function (Blueprint $table) {
                $table->string('notes', 225)->nullable();
            });
        }

        if (!Schema::hasColumn('student_accomplishments', 'score')) {
            Schema::table('student_accomplishments', function (Blueprint $table) {
                $table->unsignedTinyInteger('score')->nullable();
            });
        }
    }

    private function backfillOwnership()
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        DB::statement(
            'UPDATE classrooms c
             INNER JOIN teachers t ON t.id = c.teacher_id
             SET c.instance_id = t.instance_id
             WHERE c.instance_id IS NULL'
        );

        if (Schema::hasColumn('subjects', 'academic_year_id')) {
            DB::statement(
                'UPDATE subjects s
                 INNER JOIN academic_years ay ON ay.id = s.academic_year_id
                 SET s.instance_id = ay.instance_id
                 WHERE s.instance_id IS NULL'
            );
        }

        if (Schema::hasColumn('students', 'classroom_id')) {
            DB::statement(
                'UPDATE students s
                 INNER JOIN classrooms c ON c.id = s.classroom_id
                 SET s.instance_id = c.instance_id
                 WHERE s.instance_id IS NULL'
            );
        }

        DB::statement(
            'UPDATE students s
             INNER JOIN student_classroom_placements p ON p.student_id = s.id
             INNER JOIN academic_years ay ON ay.id = p.academic_year_id
             SET s.instance_id = ay.instance_id
             WHERE s.instance_id IS NULL'
        );
    }

    private function backfillScheduleState()
    {
        DB::table('schedules')
            ->where('is_completed', true)
            ->update([
                'status' => 'completed',
                'completed_at' => DB::raw('COALESCE(completed_at, updated_at)'),
            ]);
    }

    private function normalizeAccomplishmentTypes()
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        DB::statement(
            "ALTER TABLE accomplishments
             MODIFY type ENUM(
                'knowledge',
                'skill',
                'attitude',
                'creativity1',
                'creativity2'
             ) NOT NULL DEFAULT 'knowledge'"
        );
    }
}
