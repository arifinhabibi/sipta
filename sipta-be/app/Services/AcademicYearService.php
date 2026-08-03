<?php

namespace App\Services;

use App\Exceptions\BusinessRuleException;
use App\Models\AcademicYear;
use App\Models\StudentClassroomPlacement;
use Illuminate\Support\Facades\DB;

class AcademicYearService
{
    public function activeForInstance($instanceId)
    {
        return AcademicYear::where('instance_id', $instanceId)
            ->active()
            ->first();
    }

    public function activeForInstanceOrFail($instanceId)
    {
        $academicYear = $this->activeForInstance($instanceId);

        if (!$academicYear) {
            throw new BusinessRuleException(
                'Tidak ada tahun akademik aktif untuk instance ini.'
            );
        }

        return $academicYear;
    }

    public function activate(AcademicYear $academicYear)
    {
        if ($academicYear->status === 'closed') {
            throw new BusinessRuleException(
                'Semester yang sudah ditutup tidak dapat diaktifkan kembali.'
            );
        }

        $this->assertPlacementContinuity($academicYear);

        return DB::transaction(function () use ($academicYear) {
            AcademicYear::where('instance_id', $academicYear->instance_id)
                ->lockForUpdate()
                ->get();

            AcademicYear::where('instance_id', $academicYear->instance_id)
                ->where('id', '!=', $academicYear->id)
                ->update(['is_active' => false]);

            AcademicYear::where('instance_id', $academicYear->instance_id)
                ->where('id', '!=', $academicYear->id)
                ->where('status', 'active')
                ->update(['status' => 'draft']);

            $academicYear->update([
                'is_active' => true,
                'status' => 'active',
                'closed_at' => null,
            ]);

            DB::table('student_classroom_placements')
                ->whereIn('academic_year_id', function ($query) use ($academicYear) {
                    $query->select('id')
                        ->from('academic_years')
                        ->where('instance_id', $academicYear->instance_id);
                })
                ->update(['is_current' => false]);

            DB::table('student_classroom_placements')
                ->where('academic_year_id', $academicYear->id)
                ->update(['is_current' => true]);

            return $academicYear->fresh();
        });
    }

    private function assertPlacementContinuity(AcademicYear $target)
    {
        $source = AcademicYear::where('instance_id', $target->instance_id)
            ->where('start_periode', '<', $target->start_periode)
            ->orderByDesc('start_periode')
            ->first();

        if (!$source) {
            return;
        }

        $sourceStudentIds = StudentClassroomPlacement::where(
            'academic_year_id',
            $source->id
        )->whereHas('student', function ($query) {
            $query->where('status', 'active');
        })->pluck('student_id')->unique();

        if ($sourceStudentIds->isEmpty()) {
            return;
        }

        $placedTargetCount = StudentClassroomPlacement::where(
            'academic_year_id',
            $target->id
        )->whereIn('student_id', $sourceStudentIds)->distinct()->count('student_id');

        if ($placedTargetCount === $sourceStudentIds->count()) {
            return;
        }

        $missingCount = $sourceStudentIds->count() - $placedTargetCount;
        $message = $target->isEvenSemester()
            ? 'Roster semester genap belum disalin. Jalankan transisi ganjil ke genap terlebih dahulu.'
            : 'Keputusan kenaikan kelas belum lengkap. Selesaikan promosi seluruh siswa aktif sebelum mengaktifkan semester berikutnya.';

        throw new BusinessRuleException($message, [
            'source_academic_year_id' => $source->id,
            'target_academic_year_id' => $target->id,
            'missing_student_count' => $missingCount,
        ]);
    }

    public function close(AcademicYear $academicYear)
    {
        if ($academicYear->schedules()
            ->whereNotIn('status', ['completed', 'cancelled'])
            ->exists()) {
            throw new BusinessRuleException(
                'Semester belum dapat ditutup karena masih ada jadwal yang belum diselesaikan.'
            );
        }

        return DB::transaction(function () use ($academicYear) {
            $academicYear->update([
                'is_active' => false,
                'status' => 'closed',
                'closed_at' => now(),
            ]);

            return $academicYear->fresh();
        });
    }
}
