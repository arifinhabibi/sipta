<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class EnforceBusinessConstraints extends Migration
{
    public function up()
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        $this->assertOwnershipIsComplete();
        $this->replaceGlobalSubjectConstraints();
        $this->normalizeInstanceOwnershipConstraints();

        $this->addUnique(
            'academic_years',
            ['instance_id', 'name', 'periode'],
            'academic_years_instance_name_period_unique'
        );
        $this->addUnique(
            'classrooms',
            ['instance_id', 'name'],
            'classrooms_instance_name_unique'
        );
        $this->addUnique(
            'student_classroom_placements',
            ['student_id', 'academic_year_id'],
            'placements_student_academic_year_unique'
        );
        $this->addUnique(
            'schedules',
            ['classroom_id', 'date', 'start_time', 'end_time'],
            'schedules_classroom_slot_unique'
        );
        $this->addUnique(
            'student_attendances',
            ['student_id', 'schedule_id'],
            'student_attendances_student_schedule_unique'
        );
        $this->addUnique(
            'teacher_attendances',
            ['teacher_id', 'schedule_id', 'type'],
            'teacher_attendances_teacher_schedule_type_unique'
        );
        $this->addUnique(
            'student_accomplishments',
            ['student_id', 'accomplishment_id'],
            'student_accomplishments_student_accomplishment_unique'
        );
    }

    private function assertOwnershipIsComplete()
    {
        foreach (['classrooms', 'subjects', 'students'] as $table) {
            if (DB::table($table)->whereNull('instance_id')->exists()) {
                throw new \RuntimeException(
                    "{$table}.instance_id masih kosong. Jalankan " .
                    'php artisan santrack:audit-data dan perbaiki ownership data.'
                );
            }
        }

        $crossInstanceScheduleExists = DB::table('schedules as s')
            ->join('academic_years as ay', 'ay.id', '=', 's.academic_year_id')
            ->join('teachers as t', 't.id', '=', 's.teacher_id')
            ->join('classrooms as c', 'c.id', '=', 's.classroom_id')
            ->join('subjects as sub', 'sub.id', '=', 's.subject_id')
            ->where(function ($query) {
                $query
                    ->whereColumn('t.instance_id', '!=', 'ay.instance_id')
                    ->orWhereColumn('c.instance_id', '!=', 'ay.instance_id')
                    ->orWhereColumn('sub.instance_id', '!=', 'ay.instance_id');
            })
            ->exists();

        if ($crossInstanceScheduleExists) {
            throw new \RuntimeException(
                'Cross-instance schedule ditemukan. Jalankan ' .
                'php artisan santrack:audit-data dan perbaiki referensinya.'
            );
        }
    }

    public function down()
    {
        // Business constraints are intentionally retained on rollback.
    }

    private function replaceGlobalSubjectConstraints()
    {
        if ($this->indexExists('subjects', 'subjects_name_unique')) {
            DB::statement('ALTER TABLE subjects DROP INDEX subjects_name_unique');
        }

        if ($this->indexExists('subjects', 'subjects_code_unique')) {
            DB::statement('ALTER TABLE subjects DROP INDEX subjects_code_unique');
        }

        $this->addUnique(
            'subjects',
            ['instance_id', 'name'],
            'subjects_instance_name_unique'
        );
        $this->addUnique(
            'subjects',
            ['instance_id', 'code'],
            'subjects_instance_code_unique'
        );
    }

    private function normalizeInstanceOwnershipConstraints()
    {
        foreach (['classrooms', 'subjects', 'students'] as $table) {
            $constraintName = DB::table(
                'information_schema.key_column_usage'
            )
                ->where('table_schema', DB::getDatabaseName())
                ->where('table_name', $table)
                ->where('column_name', 'instance_id')
                ->whereNotNull('referenced_table_name')
                ->value('constraint_name');

            if ($constraintName) {
                DB::statement(
                    "ALTER TABLE {$table} DROP FOREIGN KEY `{$constraintName}`"
                );
            }

            DB::statement(
                "ALTER TABLE {$table} MODIFY instance_id CHAR(36) NOT NULL"
            );
            DB::statement(
                "ALTER TABLE {$table}
                 ADD CONSTRAINT {$table}_instance_id_foreign
                 FOREIGN KEY (instance_id) REFERENCES instances(id)
                 ON DELETE CASCADE"
            );
        }
    }

    private function addUnique($table, array $columns, $indexName)
    {
        if ($this->indexExists($table, $indexName)) {
            return;
        }

        $duplicates = DB::table($table)
            ->select($columns)
            ->groupBy($columns)
            ->havingRaw('COUNT(*) > 1')
            ->limit(1)
            ->exists();

        if ($duplicates) {
            throw new \RuntimeException(
                "Tidak dapat menambah {$indexName}: data duplikat ditemukan. " .
                'Jalankan php artisan santrack:audit-data dan bersihkan data terlebih dahulu.'
            );
        }

        Schema::table($table, function (Blueprint $blueprint) use (
            $columns,
            $indexName
        ) {
            $blueprint->unique($columns, $indexName);
        });
    }

    private function indexExists($table, $indexName)
    {
        return DB::table('information_schema.statistics')
            ->where('table_schema', DB::getDatabaseName())
            ->where('table_name', $table)
            ->where('index_name', $indexName)
            ->exists();
    }

}
