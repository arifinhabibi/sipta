<?php

namespace App\Services;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class DuplicateRepairService
{
    public function inspect()
    {
        return $this->process(false);
    }

    public function repair()
    {
        return DB::transaction(function () {
            return $this->process(true);
        });
    }

    public function selectCanonical(Collection $rows)
    {
        $sorted = $rows->sort(function ($left, $right) {
            foreach (['updated_at', 'created_at', 'id'] as $column) {
                $comparison = strcmp(
                    (string) ($right->{$column} ?: ''),
                    (string) ($left->{$column} ?: '')
                );

                if ($comparison !== 0) {
                    return $comparison;
                }
            }

            return 0;
        })->values();

        return [
            'canonical' => $sorted->first(),
            'duplicates' => $sorted->slice(1)->values(),
        ];
    }

    public function payloadHasConflict(Collection $rows, array $columns)
    {
        return $rows->map(function ($row) use ($columns) {
            $payload = [];
            foreach ($columns as $column) {
                $payload[$column] = $row->{$column};
            }

            return json_encode($payload);
        })->unique()->count() > 1;
    }

    public function scheduleConflicts()
    {
        $groups = $this->duplicateGroups('schedules', [
            'classroom_id',
            'date',
            'start_time',
            'end_time',
        ]);

        $rows = collect();
        foreach ($groups as $group) {
            $query = DB::table('schedules as s')
                ->leftJoin('teachers as t', 't.id', '=', 's.teacher_id')
                ->leftJoin('subjects as sub', 'sub.id', '=', 's.subject_id')
                ->leftJoin('classrooms as c', 'c.id', '=', 's.classroom_id')
                ->select([
                    's.id',
                    's.date',
                    's.start_time',
                    's.end_time',
                    's.status',
                    's.is_completed',
                    's.updated_at',
                    't.full_name as teacher',
                    'sub.name as subject',
                    'c.name as classroom',
                ]);

            $this->applyGroupWhere($query, [
                's.classroom_id' => $group->classroom_id,
                's.date' => $group->date,
                's.start_time' => $group->start_time,
                's.end_time' => $group->end_time,
            ]);

            foreach ($query->orderByDesc('s.updated_at')->get() as $schedule) {
                $schedule->teacher_attendances = DB::table('teacher_attendances')
                    ->where('schedule_id', $schedule->id)->count();
                $schedule->student_attendances = DB::table('student_attendances')
                    ->where('schedule_id', $schedule->id)->count();
                $schedule->accomplishments = DB::table('accomplishments')
                    ->where('schedule_id', $schedule->id)->count();
                $rows->push($schedule);
            }
        }

        return $rows;
    }

    private function process($apply)
    {
        $definitions = [
            [
                'name' => 'student_attendances',
                'keys' => ['student_id', 'schedule_id'],
                'payload' => ['status', 'note'],
            ],
            [
                'name' => 'teacher_attendances',
                'keys' => ['teacher_id', 'schedule_id', 'type'],
                'payload' => [
                    'status',
                    'longitude',
                    'latitude',
                    'real_time_photo',
                    'gmaps',
                    'notes',
                ],
            ],
            [
                'name' => 'student_accomplishments',
                'keys' => ['student_id', 'accomplishment_id'],
                'payload' => ['is_capable', 'score', 'note'],
            ],
        ];

        $result = [
            'applied' => (bool) $apply,
            'tables' => [],
            'deleted_ids' => [],
        ];

        foreach ($definitions as $definition) {
            $groups = $this->duplicateGroups(
                $definition['name'],
                $definition['keys']
            );
            $summary = [
                'groups' => 0,
                'extra_rows' => 0,
                'payload_conflicts' => 0,
            ];

            foreach ($groups as $group) {
                $query = DB::table($definition['name']);
                $values = [];
                foreach ($definition['keys'] as $key) {
                    $values[$key] = $group->{$key};
                }
                $this->applyGroupWhere($query, $values);

                if ($apply) {
                    $query->lockForUpdate();
                }

                $rows = $query->get();
                if ($rows->count() < 2) {
                    continue;
                }

                $selection = $this->selectCanonical($rows);
                $duplicateIds = $selection['duplicates']->pluck('id')->values();
                $hasConflict = $this->payloadHasConflict(
                    $rows,
                    $definition['payload']
                );

                $summary['groups']++;
                $summary['extra_rows'] += $duplicateIds->count();
                $summary['payload_conflicts'] += $hasConflict ? 1 : 0;

                if ($apply && $duplicateIds->isNotEmpty()) {
                    DB::table($definition['name'])
                        ->whereIn('id', $duplicateIds->all())
                        ->delete();

                    $result['deleted_ids'][] = [
                        'table' => $definition['name'],
                        'canonical_id' => $selection['canonical']->id,
                        'deleted_ids' => $duplicateIds->all(),
                        'payload_conflict' => $hasConflict,
                    ];
                }
            }

            $result['tables'][$definition['name']] = $summary;
        }

        return $result;
    }

    private function duplicateGroups($table, array $keys)
    {
        return DB::table($table)
            ->select($keys)
            ->groupBy($keys)
            ->havingRaw('COUNT(*) > 1')
            ->get();
    }

    private function applyGroupWhere($query, array $values)
    {
        foreach ($values as $column => $value) {
            if ($value === null) {
                $query->whereNull($column);
            } else {
                $query->where($column, $value);
            }
        }
    }
}

