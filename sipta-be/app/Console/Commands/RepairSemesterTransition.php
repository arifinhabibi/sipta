<?php

namespace App\Console\Commands;

use App\Exceptions\BusinessRuleException;
use App\Models\AcademicYear;
use App\Models\Schedule;
use App\Models\StudentClassroomPlacement;
use App\Services\AcademicYearService;
use App\Services\HistoricalScheduleReconciliationService;
use App\Services\SemesterTransitionService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class RepairSemesterTransition extends Command
{
    protected $signature = 'santrack:repair-semester-transition
        {source? : UUID semester asal}
        {target? : UUID semester tujuan}
        {--apply : Tutup source, isi placement target, dan aktifkan target}
        {--resolve-past-schedules : Complete historical schedules with activity and cancel those without activity}
        {--move-target-schedules : Move source schedules whose dates fall inside the target period}
        {--confirm= : Required value is REPAIR_SEMESTER_TRANSITION}
        {--force : Allow apply while APP_ENV is production}';

    protected $description = 'Inspect or repair missing roster during a semester transition';

    public function handle(
        AcademicYearService $academicYearService,
        SemesterTransitionService $transitionService,
        HistoricalScheduleReconciliationService $scheduleReconciliation
    ) {
        $sourceId = $this->argument('source');
        $targetId = $this->argument('target');

        if (!$sourceId && !$targetId) {
            $rows = AcademicYear::orderBy('instance_id')
                ->orderBy('start_periode')
                ->get()
                ->map(function ($academicYear) {
                    return [
                        $academicYear->id,
                        $academicYear->name,
                        $academicYear->periode,
                        $academicYear->status,
                        $academicYear->is_active ? 'yes' : 'no',
                        $this->activePlacementCount($academicYear),
                    ];
                })->all();
            $this->table(
                ['ID', 'Tahun', 'Periode', 'Status', 'Active', 'Roster'],
                $rows
            );
            $this->info('Pilih source dan target, lalu jalankan command kembali.');
            return 0;
        }

        if (!$sourceId || !$targetId) {
            $this->error('Source dan target harus diberikan bersamaan.');
            return 2;
        }

        $source = AcademicYear::find($sourceId);
        $target = AcademicYear::find($targetId);

        if (!$source || !$target || $source->instance_id !== $target->instance_id) {
            $this->error('Semester asal/tujuan tidak ditemukan pada instance yang sama.');
            return 2;
        }

        $sourceCount = $this->activePlacementCount($source);
        $targetCount = $this->activePlacementCount($target);
        $this->table(['Semester', 'Periode', 'Status', 'Active roster'], [
            [$source->name, $source->periode, $source->status, $sourceCount],
            [$target->name, $target->periode, $target->status, $targetCount],
        ]);

        $blockingSchedules = Schedule::where('academic_year_id', $source->id)
            ->whereNotIn('status', ['completed', 'cancelled'])
            ->orderBy('date')
            ->get();
        if ($blockingSchedules->isNotEmpty()) {
            $this->error(
                $blockingSchedules->count()
                . ' jadwal semester asal belum selesai.'
            );
            $this->table(
                ['ID', 'Tanggal', 'Waktu', 'Status'],
                $blockingSchedules->take(20)->map(function ($schedule) {
                    return [
                        $schedule->id,
                        $schedule->date->format('Y-m-d'),
                        $schedule->start_time . '-' . $schedule->end_time,
                        $schedule->status,
                    ];
                })->all()
            );
            if ($blockingSchedules->count() > 20) {
                $this->line('... dan ' . ($blockingSchedules->count() - 20) . ' jadwal lain.');
            }
            $classification = $scheduleReconciliation->inspect($source);
            $this->line(
                'Klasifikasi aman: '
                . $classification['with_evidence'] . ' completed, '
                . $classification['without_evidence'] . ' cancelled.'
            );

            $outsideSourcePeriod = $blockingSchedules->filter(function ($schedule) use ($source) {
                return $schedule->date->gt($source->end_periode);
            });
            if ($outsideSourcePeriod->isNotEmpty()) {
                $this->warn(
                    $outsideSourcePeriod->count()
                    . ' jadwal berada setelah akhir semester asal ('
                    . $source->end_periode->format('Y-m-d') . ').'
                );
                $this->table(
                    ['ID', 'Tanggal', 'Waktu', 'Status'],
                    $outsideSourcePeriod->map(function ($schedule) {
                        return [
                            $schedule->id,
                            $schedule->date->format('Y-m-d'),
                            $schedule->start_time . '-' . $schedule->end_time,
                            $schedule->status,
                        ];
                    })->all()
                );
                $this->line(
                    'Rentang target: '
                    . $target->start_periode->format('Y-m-d') . ' s/d '
                    . $target->end_periode->format('Y-m-d')
                );
            }
        }

        if (!$this->option('apply')) {
            $this->warn('DRY RUN: tidak ada data diubah. Tambahkan --apply setelah review.');
            return 0;
        }

        if ($this->option('confirm') !== 'REPAIR_SEMESTER_TRANSITION') {
            $this->error('Apply memerlukan --confirm=REPAIR_SEMESTER_TRANSITION.');
            return 2;
        }

        if (app()->environment('production') && !$this->option('force')) {
            $this->error('Production memerlukan backup, maintenance, dan opsi --force.');
            return 2;
        }

        try {
            DB::transaction(function () use (
                $source,
                $target,
                $academicYearService,
                $transitionService,
                $scheduleReconciliation
            ) {
                if ($this->option('move-target-schedules')) {
                    $moved = $scheduleReconciliation
                        ->moveSchedulesInTargetPeriod($source, $target);
                    $this->line($moved . ' jadwal dipindahkan ke semester target.');
                }

                if ($this->option('resolve-past-schedules')) {
                    $resolved = $scheduleReconciliation->resolve($source);
                    $this->line(
                        'Jadwal direkonsiliasi: '
                        . $resolved['completed'] . ' completed, '
                        . $resolved['cancelled'] . ' cancelled.'
                    );
                }

                $closedSource = $source->status === 'closed'
                    ? $source : $academicYearService->close($source);

                if ($source->isOddSemester() && $target->isEvenSemester()) {
                    $transitionService->rollover($closedSource, $target);
                }

                $academicYearService->activate($target);
            });
        } catch (BusinessRuleException $e) {
            $this->error($e->getMessage());
            foreach ($e->details() as $key => $value) {
                $this->line($key . ': ' . json_encode($value));
            }
            return 1;
        }

        $this->info('Transisi berhasil diperbaiki secara atomik.');
        $this->line('Roster target: ' . $this->activePlacementCount($target));
        return 0;
    }

    private function activePlacementCount(AcademicYear $academicYear)
    {
        return StudentClassroomPlacement::where(
            'academic_year_id',
            $academicYear->id
        )->whereHas('student', function ($query) {
            $query->where('status', 'active');
        })->distinct()->count('student_id');
    }
}
