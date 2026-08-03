<?php

namespace App\Console\Commands;

use App\Services\DuplicateRepairService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class RepairSantrackDuplicates extends Command
{
    protected $signature = 'santrack:repair-duplicates
        {--apply : Delete non-canonical retry duplicates}
        {--confirm= : Required value is REPAIR_DUPLICATES when applying}
        {--force : Allow apply while APP_ENV is production}';

    protected $description = 'Inspect or repair duplicate attendance and assessment retry rows';

    public function handle(DuplicateRepairService $service)
    {
        $apply = (bool) $this->option('apply');

        if ($apply && $this->option('confirm') !== 'REPAIR_DUPLICATES') {
            $this->error(
                'Apply dibatalkan. Tambahkan --confirm=REPAIR_DUPLICATES.'
            );
            return 2;
        }

        if ($apply && app()->environment('production') && !$this->option('force')) {
            $this->error(
                'Apply di production memerlukan --force setelah backup dan maintenance.'
            );
            return 2;
        }

        $this->warn($apply
            ? 'APPLY MODE: duplicate non-canonical akan dihapus dalam transaksi.'
            : 'DRY RUN: tidak ada data yang diubah.'
        );

        $result = $apply ? $service->repair() : $service->inspect();
        $rows = [];
        foreach ($result['tables'] as $table => $summary) {
            $rows[] = [
                $table,
                $summary['groups'],
                $summary['extra_rows'],
                $summary['payload_conflicts'],
            ];
        }

        $this->table(
            ['Table', 'Duplicate groups', 'Extra rows', 'Payload conflicts'],
            $rows
        );

        $scheduleConflicts = $service->scheduleConflicts();
        if ($scheduleConflicts->isNotEmpty()) {
            $this->error(
                'Schedule conflict tidak diperbaiki otomatis. Reschedule atau ' .
                'hapus record yang salah beserta review relasinya.'
            );
            $this->table([
                'ID',
                'Date',
                'Time',
                'Classroom',
                'Teacher',
                'Subject',
                'Status',
                'TA',
                'SA',
                'ACC',
                'Updated',
            ], $scheduleConflicts->map(function ($schedule) {
                return [
                    $schedule->id,
                    $schedule->date,
                    $schedule->start_time . '-' . $schedule->end_time,
                    $schedule->classroom,
                    $schedule->teacher,
                    $schedule->subject,
                    $schedule->status,
                    $schedule->teacher_attendances,
                    $schedule->student_attendances,
                    $schedule->accomplishments,
                    $schedule->updated_at,
                ];
            })->all());
        }

        if ($apply) {
            $path = storage_path(
                'logs/santrack-duplicate-repair-' . now()->format('Ymd-His') . '.json'
            );
            File::put($path, json_encode([
                'executed_at' => now()->toIso8601String(),
                'environment' => app()->environment(),
                'database' => config('database.connections.' .
                    config('database.default') . '.database'),
                'result' => $result,
            ], JSON_PRETTY_PRINT));

            $this->info('Repair log: ' . $path);
            $this->info('Retry duplicate repair selesai. Jalankan santrack:audit-data.');
        } else {
            $this->info(
                'Review hasil lalu gunakan --apply --confirm=REPAIR_DUPLICATES.'
            );
        }

        return $scheduleConflicts->isEmpty() ? 0 : 1;
    }
}

