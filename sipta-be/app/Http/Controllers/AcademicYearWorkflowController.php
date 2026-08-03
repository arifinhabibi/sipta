<?php

namespace App\Http\Controllers;

use App\Exceptions\BusinessRuleException;
use App\Models\AcademicYear;
use App\Services\AcademicYearService;
use App\Services\SemesterTransitionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Response;

class AcademicYearWorkflowController extends Controller
{
    public function transition(
        Request $request,
        $sourceAcademicYearId,
        SemesterTransitionService $transitionService,
        AcademicYearService $academicYearService
    ) {
        $validator = Validator::make($request->all(), [
            'target_academic_year_id' =>
                'required|uuid|exists:academic_years,id',
        ]);
        if ($validator->fails()) {
            return Response::badRequest('Validasi gagal.', $validator->errors());
        }

        $instanceId = Auth::user()->teacher->instance_id;
        $source = AcademicYear::where('instance_id', $instanceId)
            ->find($sourceAcademicYearId);
        $target = AcademicYear::where('instance_id', $instanceId)
            ->find($request->target_academic_year_id);

        if (!$source || !$target) {
            return Response::notFound('Semester asal atau tujuan tidak ditemukan.');
        }

        try {
            $result = DB::transaction(function () use (
                $source,
                $target,
                $transitionService,
                $academicYearService
            ) {
                if ($source->status !== 'closed') {
                    $source = $academicYearService->close($source);
                }

                $placements = $source->isOddSemester() && $target->isEvenSemester()
                    ? $transitionService->rollover($source, $target)
                    : $target->placements()->get();
                $target = $academicYearService->activate($target);

                return [
                    'placement_count' => $placements->count(),
                    'source' => $source->fresh(),
                    'target' => $target,
                ];
            });

            return Response::success(
                'Transisi semester berhasil dan roster semester tujuan telah diaktifkan.',
                200,
                $result
            );
        } catch (BusinessRuleException $e) {
            return Response::unprocessable($e->getMessage(), $e->details());
        }
    }

    public function rollover(
        Request $request,
        $sourceAcademicYearId,
        SemesterTransitionService $service
    ) {
        $validator = Validator::make($request->all(), [
            'target_academic_year_id' =>
                'required|uuid|exists:academic_years,id',
        ]);
        if ($validator->fails()) {
            return Response::badRequest('Validasi gagal.', $validator->errors());
        }

        $instanceId = Auth::user()->teacher->instance_id;
        $source = AcademicYear::where('instance_id', $instanceId)
            ->find($sourceAcademicYearId);
        $target = AcademicYear::where('instance_id', $instanceId)
            ->find($request->target_academic_year_id);
        if (!$source || !$target) {
            return Response::notFound('Semester asal atau tujuan tidak ditemukan.');
        }

        try {
            $placements = $service->rollover($source, $target);
            return Response::success('Rollover semester berhasil.', 200, [
                'placement_count' => $placements->count(),
                'source' => $source,
                'target' => $target,
            ]);
        } catch (BusinessRuleException $e) {
            return Response::unprocessable($e->getMessage(), $e->details());
        }
    }

    public function close(
        $academicYearId,
        AcademicYearService $service
    ) {
        $academicYear = AcademicYear::where(
            'instance_id',
            Auth::user()->teacher->instance_id
        )->find($academicYearId);
        if (!$academicYear) {
            return Response::notFound('Semester tidak ditemukan.');
        }

        try {
            return Response::success(
                'Semester berhasil ditutup.',
                200,
                $service->close($academicYear)
            );
        } catch (BusinessRuleException $e) {
            return Response::unprocessable($e->getMessage(), $e->details());
        }
    }
}
