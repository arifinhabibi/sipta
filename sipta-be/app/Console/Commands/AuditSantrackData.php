<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AuditSantrackData extends Command
{
    protected $signature = 'santrack:audit-data';

    protected $description = 'Audit business-data invariants before enforcing normalized constraints';

    public function handle()
    {
        $checks = [
            'classrooms_without_instance' => function () {
                return DB::table('classrooms')->whereNull('instance_id')->count();
            },
            'subjects_without_instance' => function () {
                return DB::table('subjects')->whereNull('instance_id')->count();
            },
            'students_without_instance' => function () {
                return DB::table('students')->whereNull('instance_id')->count();
            },
            'duplicate_student_placements' => function () {
                return $this->duplicateGroupCount(
                    'student_classroom_placements',
                    ['student_id', 'academic_year_id']
                );
            },
            'duplicate_academic_years' => function () {
                return $this->duplicateGroupCount(
                    'academic_years',
                    ['instance_id', 'name', 'periode']
                );
            },
            'duplicate_classrooms' => function () {
                return $this->duplicateGroupCount(
                    'classrooms',
                    ['instance_id', 'name']
                );
            },
            'duplicate_subject_names' => function () {
                return $this->duplicateGroupCount(
                    'subjects',
                    ['instance_id', 'name']
                );
            },
            'duplicate_subject_codes' => function () {
                return $this->duplicateGroupCount(
                    'subjects',
                    ['instance_id', 'code'],
                    ['code']
                );
            },
            'duplicate_classroom_schedule_slots' => function () {
                return $this->duplicateGroupCount(
                    'schedules',
                    ['classroom_id', 'date', 'start_time', 'end_time']
                );
            },
            'duplicate_student_attendances' => function () {
                return $this->duplicateGroupCount(
                    'student_attendances',
                    ['student_id', 'schedule_id']
                );
            },
            'duplicate_teacher_attendances' => function () {
                return $this->duplicateGroupCount(
                    'teacher_attendances',
                    ['teacher_id', 'schedule_id', 'type']
                );
            },
            'duplicate_student_assessments' => function () {
                return $this->duplicateGroupCount(
                    'student_accomplishments',
                    ['student_id', 'accomplishment_id']
                );
            },
            'cross_instance_schedules' => function () {
                return DB::table('schedules as s')
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
                    ->count();
            },
        ];

        $rows = [];
        $totalIssues = 0;
        foreach ($checks as $name => $check) {
            $count = (int) $check();
            $rows[] = [$name, $count, $count === 0 ? 'OK' : 'FIX REQUIRED'];
            $totalIssues += $count;
        }

        $this->table(['Check', 'Count', 'Status'], $rows);

        if ($totalIssues > 0) {
            $this->error(
                "Ditemukan {$totalIssues} pelanggaran invariant. " .
                'Perbaiki data sebelum menambah unique constraints production.'
            );
            return 1;
        }

        $this->info('Seluruh invariant data utama terpenuhi.');
        return 0;
    }

    private function duplicateGroupCount(
        $table,
        array $columns,
        array $requiredColumns = []
    )
    {
        if (!Schema::hasTable($table)) {
            return 0;
        }

        $query = DB::table($table)
            ->select($columns)
            ->when(!empty($requiredColumns), function ($query) use (
                $requiredColumns
            ) {
                foreach ($requiredColumns as $column) {
                    $query->whereNotNull($column);
                }
            })
            ->groupBy($columns)
            ->havingRaw('COUNT(*) > 1');

        return DB::query()->fromSub($query, 'duplicate_groups')->count();
    }
}
