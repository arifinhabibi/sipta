<?php

namespace App\Services;

use App\Exceptions\BusinessRuleException;
use App\Models\AcademicYear;
use App\Models\Schedule;
use Illuminate\Support\Facades\DB;

class HistoricalScheduleReconciliationService
{
    public function moveSchedulesInTargetPeriod(
        AcademicYear $source,
        AcademicYear $target
    ): int {
        if ($source->instance_id !== $target->instance_id) {
            throw new BusinessRuleException(
                'Semester asal dan tujuan harus berada pada instance yang sama.'
            );
        }

        return Schedule::where('academic_year_id', $source->id)
            ->whereBetween('date', [
                $target->start_periode,
                $target->end_periode,
            ])->update(['academic_year_id' => $target->id]);
    }

    public function inspect(AcademicYear $academicYear): array
    {
        $base = Schedule::where('academic_year_id', $academicYear->id)
            ->whereNotIn('status', ['completed', 'cancelled'])
            ->whereDate('date', '<=', $academicYear->end_periode);

        $withEvidence = (clone $base)->where(function ($query) {
            $this->withActivityEvidence($query);
        })->count();

        return [
            'with_evidence' => $withEvidence,
            'without_evidence' => (clone $base)->count() - $withEvidence,
        ];
    }

    public function resolve(AcademicYear $academicYear): array
    {
        if ($academicYear->end_periode->isFuture()) {
            throw new BusinessRuleException(
                'Jadwal tidak dapat direkonsiliasi sebelum periode semester berakhir.'
            );
        }

        return DB::transaction(function () use ($academicYear) {
            $base = Schedule::where('academic_year_id', $academicYear->id)
                ->whereNotIn('status', ['completed', 'cancelled'])
                ->whereDate('date', '<=', $academicYear->end_periode);

            $evidenceIds = (clone $base)->where(function ($query) {
                $this->withActivityEvidence($query);
            })->lockForUpdate()->pluck('id');

            $cancelledIds = (clone $base)
                ->whereNotIn('id', $evidenceIds)
                ->lockForUpdate()
                ->pluck('id');

            if ($evidenceIds->isNotEmpty()) {
                Schedule::whereIn('id', $evidenceIds)->update([
                    'status' => 'completed',
                    'is_completed' => true,
                    'completed_at' => now(),
                ]);
            }
            if ($cancelledIds->isNotEmpty()) {
                Schedule::whereIn('id', $cancelledIds)->update([
                    'status' => 'cancelled',
                    'is_completed' => false,
                    'completed_at' => null,
                ]);
            }

            return [
                'completed' => $evidenceIds->count(),
                'cancelled' => $cancelledIds->count(),
            ];
        });
    }

    private function withActivityEvidence($query)
    {
        $query->whereHas('teacher_attendances')
            ->orWhereHas('studentAttendances')
            ->orWhereHas('accomplishments.studentAssessments');
    }
}
