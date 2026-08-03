<?php

namespace App\Http\Controllers;

use App\Models\AcademicYear;
use App\Models\Classroom;
use App\Models\Student;
use App\Services\AcademicYearService;
use App\Services\StudentPerformanceService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Response;

class StudentPerformanceController extends Controller
{
    private $academicYears;
    private $performances;

    public function __construct(
        AcademicYearService $academicYears,
        StudentPerformanceService $performances
    ) {
        $this->academicYears = $academicYears;
        $this->performances = $performances;
    }

    public function classroom(Request $request, $classroomId)
    {
        $instanceId = Auth::user()->teacher->instance_id;
        $academicYear = $this->resolveAcademicYear(
            $instanceId,
            $request->query('academic_year_id')
        );
        $classroom = Classroom::forInstance($instanceId)->find($classroomId);
        if (!$classroom) {
            return Response::notFound('Classroom tidak ditemukan.');
        }

        return Response::success('Performa siswa berhasil dihitung.', 200, [
            'academic_year' => $academicYear,
            'subject_weights' => config('santrack.assessment.subject_weights'),
            'attendance_policy' => 'Kehadiran dilaporkan terpisah dan digunakan untuk rekomendasi kenaikan kelas.',
            'students' => $this->performances->forClassroom(
                $classroom,
                $academicYear
            ),
        ]);
    }

    public function student(Request $request, $studentId)
    {
        $instanceId = Auth::user()->teacher->instance_id;
        $student = Student::forInstance($instanceId)->find($studentId);
        if (!$student) {
            return Response::notFound('Student tidak ditemukan.');
        }
        $academicYear = $this->resolveAcademicYear(
            $instanceId,
            $request->query('academic_year_id')
        );

        return Response::success(
            'Performa siswa berhasil dihitung.',
            200,
            $this->performances->forStudent($student, $academicYear)
        );
    }

    public function exportPdf(Request $request, $studentId)
    {
        $instanceId = Auth::user()->teacher->instance_id;
        $student = Student::forInstance($instanceId)->find($studentId);
        if (!$student) {
            return Response::notFound('Student tidak ditemukan.');
        }
        $academicYear = $this->resolveAcademicYear(
            $instanceId,
            $request->query('academic_year_id')
        );
        $performance = $this->performances->forStudent(
            $student,
            $academicYear
        );

        return \PDF::loadView(
            'export.student-performance-term',
            ['performance' => $performance]
        )->setPaper('a4', 'portrait')->download(
            'performa-' . $student->id . '-' . $academicYear->periode . '.pdf'
        );
    }

    private function resolveAcademicYear($instanceId, $academicYearId)
    {
        if ($academicYearId) {
            return AcademicYear::where('instance_id', $instanceId)
                ->findOrFail($academicYearId);
        }

        return $this->academicYears->activeForInstanceOrFail($instanceId);
    }
}
