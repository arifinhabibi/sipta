<?php

namespace App\Http\Controllers;

use App\Exceptions\BusinessRuleException;
use App\Models\Schedule;
use App\Models\Student;
use App\Models\AcademicYear;
use App\Models\Classroom;
use App\Models\StudentClassroomPlacement;
use App\Services\AcademicYearService;
use App\Services\PromoteStudentsService;
use App\Services\RecordStudentAttendanceService;
use App\Services\StudentPlacementService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Response;
use Illuminate\Support\Str;
// use Illuminate\Support\Facades\Log;


class StudentController extends Controller
{
    private $academicYearService;
    private $placementService;
    private $attendanceService;
    private $promoteStudentsService;

    public function __construct(
        AcademicYearService $academicYearService,
        StudentPlacementService $placementService,
        RecordStudentAttendanceService $attendanceService,
        PromoteStudentsService $promoteStudentsService
    ) {
        $this->academicYearService = $academicYearService;
        $this->placementService = $placementService;
        $this->attendanceService = $attendanceService;
        $this->promoteStudentsService = $promoteStudentsService;
    }

    public function index()
    {
        $instanceId = Auth::user()->teacher->instance_id;
        $academicYear = $this->academicYearService->activeForInstance($instanceId);

        $students = Student::forInstance($instanceId)
            ->with(['placements' => function ($query) use ($academicYear) {
                if ($academicYear) {
                    $query->where('academic_year_id', $academicYear->id);
                }
                $query->with('classroom');
            }])
            ->orderBy('fullname')
            ->get();

        return Response::success('Data has been loaded!', 200, $students);
    }

    public function show($student_id)
    {
        $instanceId = Auth::user()->teacher->instance_id;
        $student = Student::forInstance($instanceId)
            ->with(['placements.classroom', 'placements.academicYear'])
            ->find($student_id);

        if (!$student) {
            return Response::notFound('Student not found!');
        }

        return Response::success('Data has been loaded!', 200, $student);
    }


    public function create(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'classroom_id' => 'required|uuid|exists:classrooms,id',
            'fullname' => 'required|string',
            'birth_place' => 'nullable|string',
            'birth_date' => 'nullable|date_format:Y-m-d',
            'gender' => 'required|in:male,female',
            'father_name' => 'nullable|string',
            'mother_name' => 'nullable|string',
            'address' => 'nullable|string',
            'phone' => 'nullable|string',
            'photo' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
            'birth_certificate' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
            'family_card' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
            'id_card_father' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
            'id_card_mother' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
        ]);

        if ($validator->fails()) {
            return Response::badRequest('Bad Request!', [
                'errors' => $validator->errors()
            ]);
        }

        $data = $validator->validated();
        unset($data['classroom_id']);
        $instanceId = Auth::user()->teacher->instance_id;
        $data['instance_id'] = $instanceId;
        $folderName = 'students/' . Str::slug($data['fullname'], '_');

        foreach ([
            'photo',
            'birth_certificate',
            'family_card',
            'id_card_father',
            'id_card_mother',
        ] as $field) {
            if ($request->hasFile($field)) {
                $file = $request->file($field);
                $filename = $field . '_' . time() . '.' .
                    $file->getClientOriginalExtension();
                $data[$field] = $file->storeAs(
                    $folderName,
                    $filename,
                    'public'
                );
            }
        }

        try {
            $academicYear = $this->academicYearService
                ->activeForInstanceOrFail($instanceId);
            $classroom = Classroom::forInstance($instanceId)
                ->find($request->classroom_id);

            if (!$classroom) {
                throw new BusinessRuleException(
                    'Kelas tidak ditemukan pada instance ini.'
                );
            }

            $student = DB::transaction(function () use (
                $data,
                $classroom,
                $academicYear
            ) {
                $student = Student::create($data);
                $this->placementService->place(
                    $student,
                    $classroom,
                    $academicYear
                );

                return $student;
            });

            return Response::success(
                "Data siswa berhasil disimpan dan ditempatkan di kelas {$classroom->name}!",
                201,
                $student->load('currentPlacement.classroom')
            );
        } catch (BusinessRuleException $e) {
            return Response::unprocessable($e->getMessage(), $e->details());
        }
    }


    public function update(Request $request, $student_id)
    {
        $instanceId = Auth::user()->teacher->instance_id;
        $student = Student::forInstance($instanceId)->find($student_id);

        if (!$student) {
            return Response::notFound("Student not found!");
        }

        $validator = Validator::make($request->all(), [
            'classroom_id' => 'sometimes|required|uuid|exists:classrooms,id',
            'status' => 'sometimes|required|in:active,inactive',
            'fullname' => 'sometimes|required|string',
            'birth_place' => 'nullable|string',
            'birth_date' => 'nullable|date_format:Y-m-d',
            'gender' => 'sometimes|required|in:male,female',
            'father_name' => 'nullable|string',
            'mother_name' => 'nullable|string',
            'address' => 'nullable|string',
            'phone' => 'nullable|string',
            'photo' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
            'birth_certificate' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
            'family_card' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
            'id_card_father' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
            'id_card_mother' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
        ]);

        if ($validator->fails()) {
            return Response::badRequest('Bad Request!', [
                'errors' => $validator->errors()
            ]);
        }

        $data = $validator->validated();
        $classroomId = isset($data['classroom_id'])
            ? $data['classroom_id']
            : null;
        unset($data['classroom_id']);

        $folderName = 'students/' . Str::slug(
            isset($data['fullname']) ? $data['fullname'] : $student->fullname,
            '_'
        );

        try {
            $this->handleFileUploads($request, $student, $data, $folderName);

            DB::transaction(function () use (
                $student,
                $data,
                $classroomId,
                $instanceId
            ) {
                $student->update($data);

                if ($classroomId) {
                    $academicYear = $this->academicYearService
                        ->activeForInstanceOrFail($instanceId);
                    $classroom = Classroom::forInstance($instanceId)
                        ->find($classroomId);

                    if (!$classroom) {
                        throw new BusinessRuleException(
                            'Kelas tidak ditemukan pada instance ini.'
                        );
                    }

                    $this->placementService->place(
                        $student,
                        $classroom,
                        $academicYear
                    );
                }
            });

            return Response::success(
                "Student data has been updated!",
                200,
                $student->fresh()->load('currentPlacement.classroom')
            );
        } catch (BusinessRuleException $e) {
            return Response::unprocessable($e->getMessage(), $e->details());
        }
    }

    private function handleFileUploads($request, $student, &$data, $folderName)
    {
        $fileFields = [
            'photo',
            'birth_certificate',
            'family_card',
            'id_card_father',
            'id_card_mother'
        ];

        foreach ($fileFields as $field) {
            if ($request->hasFile($field)) {
                try {
                    // Log::info("Processing file upload for: " . $field);

                    // Delete old file if exists
                    if ($student->$field && Storage::disk('public')->exists($student->$field)) {
                        // Log::info("Deleting old file: " . $student->$field);
                        Storage::disk('public')->delete($student->$field);
                    } else {
                        // Log::info("No old file to delete for: " . $field);
                    }

                    // Upload new file dengan nama yang unik
                    $file = $request->file($field);
                    $filename = $field . '_' . time() . '.' . $file->getClientOriginalExtension();
                    $filePath = $file->storeAs($folderName, $filename, 'public');

                    $data[$field] = $filePath;

                    // Log::info("File {$field} uploaded successfully: " . $filePath);
                } catch (\Exception $e) {
                    // Log::error("Failed to upload {$field}: " . $e->getMessage());
                    unset($data[$field]);
                }
            } else {
                // Log::info("No new file for: " . $field);
                // Jika tidak ada file baru, pertahankan nilai lama
                if (!isset($data[$field])) {
                    $data[$field] = $student->$field;
                }
            }
        }
    }

    public function delete($student_id)
    {
        try {
            $student = Student::forInstance(
                Auth::user()->teacher->instance_id
            )->find($student_id);

            if (!$student) {
                return Response::notFound("Student not found!");
            }

            // Log::info('=== DELETE STUDENT START ===');
            // Log::info('Student ID: ' . $student_id);
            // Log::info('Student Name: ' . $student->fullname);

            $student->update(['status' => 'inactive']);

            return Response::success(
                "Student berhasil dinonaktifkan tanpa menghapus histori."
            );
        } catch (\Exception $e) {
            // Log::error('Delete student failed: ' . $e->getMessage());
            return Response::error("Failed to delete student: " . $e->getMessage());
        }
    }

    /**
     * Delete all student files from storage
     */
    private function deleteStudentFiles($student)
    {
        $fileFields = [
            'photo',
            'birth_certificate',
            'family_card',
            'id_card_father',
            'id_card_mother'
        ];

        $deletedFiles = [];
        $failedFiles = [];

        foreach ($fileFields as $field) {
            if ($student->$field && Storage::disk('public')->exists($student->$field)) {
                try {
                    Storage::disk('public')->delete($student->$field);
                    $deletedFiles[] = $student->$field;
                    // Log::info("Deleted file: " . $student->$field);
                } catch (\Exception $e) {
                    $failedFiles[] = $student->$field;
                    // Log::error("Failed to delete file {$student->$field}: " . $e->getMessage());
                }
            }
        }

        // Try to delete the folder if it's empty
        try {
            $folderPath = 'students/' . Str::slug($student->fullname, '_');
            if (Storage::disk('public')->exists($folderPath)) {
                // Check if folder is empty
                $filesInFolder = Storage::disk('public')->files($folderPath);
                if (empty($filesInFolder)) {
                    Storage::disk('public')->deleteDirectory($folderPath);
                    // Log::info("Deleted empty folder: " . $folderPath);
                }
            }
        } catch (\Exception $e) {
            // Log::error("Failed to delete folder: " . $e->getMessage());
        }

        // Log::info("File deletion summary - Deleted: " . count($deletedFiles) . ", Failed: " . count($failedFiles));
    }

    /**
     * Delete all related records
     */
    private function deleteRelatedRecords($student)
    {
        try {
            // Delete student attendances
            $attendanceCount = StudentAttendance::where('student_id', $student->id)->delete();
            // Log::info("Deleted {$attendanceCount} attendance records");

            // Delete student accomplishments
            $accomplishmentCount = StudentAccomplishment::where('student_id', $student->id)->delete();
            // Log::info("Deleted {$accomplishmentCount} accomplishment records");

            // Add other related records here if needed
            // Example: grades, reports, etc.

        } catch (\Exception $e) {
            // Log::error("Failed to delete related records: " . $e->getMessage());
            // Continue with student deletion even if related records fail
        }
    }

    public function allAttendance()
    {
        $instanceId = Auth::user()->teacher->instance_id;
        $attendances = \App\Models\StudentAttendance::with([
            'student',
            'schedule.subject',
            'schedule.classroom',
        ])
            ->whereHas('schedule.academicYear', function ($query) use ($instanceId) {
                $query->where('instance_id', $instanceId);
            })
            ->latest()
            ->get();

        return Response::success('Data has been loaded!', 200, $attendances);
    }

    public function createAttendance(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'schedule_id' => 'required|uuid|exists:schedules,id',
            'students' => 'required|array|min:1',
            'students.*.attendance' => 'required|in:present,sick,permission,absent',
            'students.*.note' => 'nullable|string',
            'students.*.student_id' => 'required|uuid|exists:students,id',
            'students.*.accomplishments' => 'required|array',
            'students.*.accomplishments.*.accomplishment_id' => 'required|uuid|exists:accomplishments,id',
            'students.*.accomplishments.*.is_capable' => 'required|boolean',
            'students.*.accomplishments.*.score' => 'nullable|integer|min:0|max:100',
            'students.*.accomplishments.*.note' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return Response::badRequest('Bad Request!', [
                'errors' => $validator->errors()
            ]);
        }

        $instanceId = Auth::user()->teacher->instance_id;
        $schedule = Schedule::whereHas(
            'academicYear',
            function ($query) use ($instanceId) {
                $query->where('instance_id', $instanceId);
            }
        )->find($request->schedule_id);

        if (!$schedule) {
            return Response::notFound('Schedule not found for this instance.');
        }

        try {
            $result = $this->attendanceService->record(
                $schedule,
                $validator->validated()['students']
            );

            return Response::success('Attendance berhasil disimpan.', 200, $result);
        } catch (BusinessRuleException $e) {
            return Response::unprocessable($e->getMessage(), $e->details());
        }
    }

    public function showAttendance($student_id)
    {
        $student = Student::forInstance(
            Auth::user()->teacher->instance_id
        )->with('attendances.schedule')->find($student_id);

        if (!$student) {
            return Response::notFound('Student not found!');
        }

        return Response::success(
            'Data has been loaded!',
            200,
            $student->attendances
        );
    }

    public function updateAttendance(Request $request, $student_id)
    {
        $validator = Validator::make($request->all(), [
            'schedule_id' => 'required|uuid|exists:schedules,id',
            'status' => 'required|in:present,absent,sick,permission',
            'note' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return Response::badRequest(
                'Bad Request!',
                $validator->errors()
            );
        }

        $student = Student::forInstance(
            Auth::user()->teacher->instance_id
        )->find($student_id);

        if (!$student) {
            return Response::notFound('Student not found!');
        }

        $attendance = \App\Models\StudentAttendance::where(
            'student_id',
            $student->id
        )->where('schedule_id', $request->schedule_id)->first();

        if (!$attendance) {
            return Response::notFound('Attendance not found!');
        }

        $attendance->update($validator->validated());

        return Response::success(
            'Attendance berhasil diperbarui.',
            200,
            $attendance
        );
    }

    public function deleteAttendance(Request $request, $student_id)
    {
        $request->validate([
            'schedule_id' => 'required|uuid|exists:schedules,id',
        ]);

        $student = Student::forInstance(
            Auth::user()->teacher->instance_id
        )->find($student_id);

        if (!$student) {
            return Response::notFound('Student not found!');
        }

        $deleted = \App\Models\StudentAttendance::where(
            'student_id',
            $student->id
        )->where('schedule_id', $request->schedule_id)->delete();

        if (!$deleted) {
            return Response::notFound('Attendance not found!');
        }

        return Response::success('Attendance berhasil dihapus.');
    }

    public function placeStudents(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|mimes:csv,txt|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Invalid file uploaded',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $path = $request->file('file')->getRealPath();
            $handle = fopen($path, 'r');

            if (!$handle) {
                return response()->json(['message' => 'Failed to open file.'], 500);
            }

            // Deteksi delimiter
            $sample = fgets($handle);
            $delimiter = substr_count($sample, ';') > substr_count($sample, ',') ? ';' : ',';
            rewind($handle);

            // Baca header
            $header = fgetcsv($handle, 0, $delimiter);
            if (!$header) {
                fclose($handle);
                return response()->json(['message' => 'CSV header not found.'], 400);
            }

            // Normalisasi header
            $header = array_map(fn($h) => strtolower(str_replace(' ', '_', trim($h))), $header);
            
            // Validasi header wajib
            $requiredHeaders = ['student_id', 'classroom_id', 'academic_year_id'];
            foreach ($requiredHeaders as $required) {
                if (!in_array($required, $header)) {
                    fclose($handle);
                    return response()->json([
                        'message' => 'Invalid CSV format',
                        'errors' => ["Missing required column: {$required}"]
                    ], 422);
                }
            }

            $imported = 0;
            $skipped = 0;
            $errors = [];
            $instanceId = Auth::user()->teacher->instance_id;

            while (($row = fgetcsv($handle, 0, $delimiter)) !== false) {
                if (count(array_filter($row)) === 0) {
                    $skipped++;
                    continue;
                }

                if (count($row) < count($header)) {
                    $row = array_pad($row, count($header), null);
                }

                $data = @array_combine($header, $row);
                if (!$data) {
                    $skipped++;
                    $errors[] = "Row " . ($imported + $skipped) . ": Invalid row format";
                    continue;
                }

                // Validasi data wajib
                if (empty($data['student_id']) || empty($data['classroom_id']) || empty($data['academic_year_id'])) {
                    $skipped++;
                    $errors[] = "Row " . ($imported + $skipped) . ": Missing required data";
                    continue;
                }

                try {
                    $validator = Validator::make($data, [
                        'student_id' => 'required|uuid',
                        'classroom_id' => 'required|uuid',
                        'academic_year_id' => 'required|uuid',
                    ]);

                    if ($validator->fails()) {
                        $skipped++;
                        $errors[] = "Row " . ($imported + $skipped) . ": " . implode(', ', $validator->errors()->all());
                        continue;
                    }

                    $student = Student::forInstance($instanceId)
                        ->find($data['student_id']);
                    $classroom = Classroom::forInstance($instanceId)
                        ->find($data['classroom_id']);
                    $academicYear = AcademicYear::where(
                        'instance_id',
                        $instanceId
                    )->find($data['academic_year_id']);

                    if (!$student || !$classroom || !$academicYear) {
                        throw new BusinessRuleException(
                            'Student, classroom, atau academic year tidak ditemukan pada instance ini.'
                        );
                    }

                    $this->placementService->place(
                        $student,
                        $classroom,
                        $academicYear
                    );
                    $imported++;
                } catch (\Throwable $e) {
                    $skipped++;
                    $errors[] = "Row " . ($imported + $skipped) . ": " . $e->getMessage();
                    continue;
                }
            }

            fclose($handle);

            $response = [
                'success' => true,
                'message' => "Successfully placed {$imported} students. Skipped {$skipped} invalid rows.",
                'data' => [
                    'imported' => $imported,
                    'skipped' => $skipped,
                ]
            ];

            if (!empty($errors)) {
                $response['errors'] = array_slice($errors, 0, 10); // Batasi jumlah error yang ditampilkan
                if (count($errors) > 10) {
                    $response['errors'][] = '... and ' . (count($errors) - 10) . ' more errors';
                }
            }

            return response()->json($response);
        } catch (\Throwable $th) {
            return response()->json([
                'message' => 'Internal server error.',
                'error' => config('app.debug') ? $th->getMessage() : null
            ], 500);
        }
    }

    public function promoteStudents(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'student_ids' => 'required|array|min:1',
            'student_ids.*' => 'required|uuid|exists:students,id',
            'source_academic_year_id' =>
                'required|uuid|exists:academic_years,id',
            'target_classroom_id' => 'required|uuid|exists:classrooms,id',
            'target_academic_year_id' => 'required|uuid|exists:academic_years,id',
            'override_reason' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return Response::badRequest('Validasi gagal!', [
                'errors' => $validator->errors()
            ]);
        }

        $instanceId = Auth::user()->teacher->instance_id;

        try {
            $sourceAcademicYear = AcademicYear::where(
                'instance_id',
                $instanceId
            )->find($request->source_academic_year_id);

            if (!$sourceAcademicYear) {
                throw new BusinessRuleException(
                    'Semester sumber tidak ditemukan pada instance ini.'
                );
            }

            $targetAcademicYear = AcademicYear::where(
                'instance_id',
                $instanceId
            )->find($request->target_academic_year_id);

            if (!$targetAcademicYear) {
                throw new BusinessRuleException(
                    'Tahun akademik tujuan tidak ditemukan.'
                );
            }

            $targetClassroom = Classroom::forInstance($instanceId)
                ->find($request->target_classroom_id);

            if (!$targetClassroom) {
                throw new BusinessRuleException(
                    'Kelas tujuan tidak ditemukan pada instance ini.'
                );
            }

            $placements = $this->promoteStudentsService->promote(
                $validator->validated()['student_ids'],
                $sourceAcademicYear,
                $targetAcademicYear,
                $targetClassroom,
                $request->override_reason
            );

            return Response::success(
                'Siswa berhasil dipromosikan.',
                200,
                [
                    'promoted_count' => $placements->count(),
                    'source_academic_year' => $sourceAcademicYear,
                    'target_academic_year' => $targetAcademicYear,
                    'target_classroom' => $targetClassroom,
                    'placements' => $placements,
                ]
            );
        } catch (BusinessRuleException $e) {
            return Response::unprocessable($e->getMessage(), $e->details());
        }
    }

  /**
   * Legacy promotion implementation retained temporarily for response-shape
   * reference. New requests use promoteStudents().
   *
   * @deprecated
   */
  private function legacyPromotedStudents(Request $request)
    {
        try {
            // Validasi input
            $validator = Validator::make($request->all(), [
                'student_ids' => 'required|array|min:1',
                'student_ids.*' => 'required|uuid|exists:students,id',
                'target_classroom_id' => 'required|uuid|exists:classrooms,id',
            ]);

            if ($validator->fails()) {
                return Response::badRequest('Validasi gagal!', [
                    'errors' => $validator->errors()
                ]);
            }

            $data = $validator->validated();
            $promotedStudentIds = $data['student_ids'];
            $targetClassroomId = $data['target_classroom_id'];

            // 1. Cari tahun akademik aktif saat ini (is_active: true)
            $currentAcademicYear = AcademicYear::where('is_active', true)->first();
            
            if (!$currentAcademicYear) {
                return Response::error('Tidak ada tahun akademik aktif!', 422);
            }

            // 2. Cari tahun akademik target (setelah periode tahun akademik saat ini berakhir)
            $targetAcademicYear = AcademicYear::where('start_periode', '>', $currentAcademicYear->end_periode)
                ->orderBy('start_periode', 'asc')
                ->first();

            if (!$targetAcademicYear) {
                return Response::error('Tahun akademik target tidak ditemukan!', 422);
            }

            // 3. Cek kelas tujuan
            $targetClassroom = Classroom::find($targetClassroomId);
            if (!$targetClassroom) {
                return Response::notFound('Kelas tujuan tidak ditemukan!');
            }

            // 4. Ambil semua student placement dari classroom saat ini dengan pengecekan status
            $currentPromotedPlacements = StudentClassroomPlacement::whereIn('student_id', $promotedStudentIds)
                ->where('academic_year_id', $currentAcademicYear->id)
                ->with('student') // Load relasi student untuk cek status
                ->get();

            // 5. Identifikasi semua classroom asal
            $sourceClassroomIds = $currentPromotedPlacements->pluck('classroom_id')->unique()->filter()->toArray();
            
            if (empty($sourceClassroomIds)) {
                return Response::error('Siswa yang dipilih belum memiliki penempatan di tahun akademik saat ini!', 422);
            }

            // 6. Validasi: Cek apakah ada siswa dengan status inactive
            $inactiveStudents = [];
            foreach ($currentPromotedPlacements as $placement) {
                if ($placement->student && $placement->student->status === 'inactive') {
                    $inactiveStudents[] = [
                        'student_id' => $placement->student_id,
                        'name' => $placement->student->name ?? 'Unknown',
                        'nis' => $placement->student->nis ?? 'Unknown',
                        'status' => 'inactive'
                    ];
                }
            }

            // Jika ada siswa dengan status inactive, kembalikan error
            if (!empty($inactiveStudents)) {
                return Response::badRequest('Terdapat siswa dengan status inactive yang tidak dapat dimutasi!', [
                    'inactive_students' => $inactiveStudents,
                    'inactive_count' => count($inactiveStudents)
                ]);
            }

            // 7. Ambil SEMUA student dari classroom asal saat ini dengan pengecekan status
            $allCurrentPlacements = StudentClassroomPlacement::whereIn('classroom_id', $sourceClassroomIds)
                ->where('academic_year_id', $currentAcademicYear->id)
                ->with('student') // Load relasi student
                ->get();

            $successPromotedCount = 0;
            $successNonPromotedCount = 0;
            $failedStudents = [];
            $alreadyExistStudents = [];
            $skippedStudents = []; // Siswa yang sudah ada dan tidak direquest (skip)
            $processedStudents = [];
            $inactiveSkippedStudents = []; // Siswa dengan status inactive yang di-skip

            // 8. Proses SEMUA student dari classroom asal
            foreach ($allCurrentPlacements as $currentPlacement) {
                $studentId = $currentPlacement->student_id;
                $sourceClassroomId = $currentPlacement->classroom_id;
                
                // Cek status siswa
                $isStudentActive = $currentPlacement->student && $currentPlacement->student->status === 'active';
                
                // Cek apakah student ini termasuk yang dipromosikan
                $isPromotedStudent = in_array($studentId, $promotedStudentIds);
                
                // Skip siswa dengan status inactive
                if (!$isStudentActive) {
                    $inactiveSkippedStudents[] = [
                        'student_id' => $studentId,
                        'name' => $currentPlacement->student->name ?? 'Unknown',
                        'nis' => $currentPlacement->student->nis ?? 'Unknown',
                        'status' => $currentPlacement->student->status ?? 'unknown',
                        'is_promoted' => $isPromotedStudent,
                        'action' => 'skipped - status inactive'
                    ];
                    continue;
                }
                
                // Tentukan classroom tujuan
                $destinationClassroomId = $isPromotedStudent ? $targetClassroomId : $sourceClassroomId;
                
                // Cek apakah student sudah memiliki placement di tahun akademik target
                $existingTargetPlacement = StudentClassroomPlacement::where('student_id', $studentId)
                    ->where('academic_year_id', $targetAcademicYear->id)
                    ->first();

                if ($existingTargetPlacement) {
                    // JIKA SISWA SUDAH ADA DI TAHUN TARGET:
                    if ($isPromotedStudent) {
                        // JIKA SISWA DIPROMOSIKAN: UPDATE classroom_id
                        try {
                            $existingTargetPlacement->update([
                                'classroom_id' => $destinationClassroomId,
                                'is_current' => true,
                            ]);
                            
                            $alreadyExistStudents[] = [
                                'student_id' => $studentId,
                                'old_classroom_id' => $existingTargetPlacement->getOriginal('classroom_id'),
                                'new_classroom_id' => $destinationClassroomId,
                                'is_promoted' => true,
                                'action' => 'updated'
                            ];
                            
                            $processedStudents[] = $studentId;
                            $successPromotedCount++;
                            
                        } catch (\Throwable $e) {
                            $failedStudents[] = [
                                'student_id' => $studentId,
                                'error' => 'Gagal update placement: ' . $e->getMessage(),
                                'is_promoted' => true
                            ];
                        }
                    } else {
                        // JIKA SISWA TIDAK DIPROMOSIKAN: SKIP (tidak update)
                        $skippedStudents[] = [
                            'student_id' => $studentId,
                            'classroom_id' => $existingTargetPlacement->classroom_id,
                            'is_promoted' => false,
                            'action' => 'skipped - already exists'
                        ];
                    }
                    continue;
                }
                
                // JIKA SISWA BELUM ADA DI TAHUN TARGET: BUAT BARU
                try {
                    // Cari student (sudah di-load melalui with('student'))
                    $student = $currentPlacement->student;
                    if (!$student) {
                        if ($isPromotedStudent) {
                            $failedStudents[] = [
                                'student_id' => $studentId,
                                'error' => 'Siswa tidak ditemukan',
                                'is_promoted' => true
                            ];
                        }
                        continue;
                    }
                    
                    // Tandai placement lama sebagai tidak aktif
                    $currentPlacement->update([
                        'is_current' => false,
                    ]);

                    // Buat placement baru di tahun akademik target
                    StudentClassroomPlacement::create([
                        'student_id' => $studentId,
                        'classroom_id' => $destinationClassroomId,
                        'academic_year_id' => $targetAcademicYear->id,
                        'is_current' => true,
                    ]);

                    $processedStudents[] = $studentId;
                    
                    if ($isPromotedStudent) {
                        $successPromotedCount++;
                    } else {
                        $successNonPromotedCount++;
                    }
                    
                } catch (\Throwable $e) {
                    if ($isPromotedStudent) {
                        $failedStudents[] = [
                            'student_id' => $studentId,
                            'error' => $e->getMessage(),
                            'is_promoted' => true
                        ];
                    }
                    continue;
                }
            }

            // Response sukses
            $message = "Berhasil menaikkan {$successPromotedCount} siswa ke kelas {$targetClassroom->name}";
            
            if ($successNonPromotedCount > 0) {
                $message .= " dan membuat penempatan untuk {$successNonPromotedCount} siswa lainnya";
            }
            
            if (count($alreadyExistStudents) > 0) {
                $message .= " (" . count($alreadyExistStudents) . " siswa sudah memiliki penempatan di tahun akademik target dan berhasil diupdate)";
            }
            
            if (count($skippedStudents) > 0) {
                $message .= " (" . count($skippedStudents) . " siswa sudah ada di tahun target dan tidak diupdate)";
            }
            
            if (count($inactiveSkippedStudents) > 0) {
                $message .= " (" . count($inactiveSkippedStudents) . " siswa dengan status inactive tidak diproses)";
            }
            
            if (count($failedStudents) > 0) {
                $message .= " (" . count($failedStudents) . " gagal)";
            }

            // Data response
            $responseData = [
                'promoted_count' => $successPromotedCount,
                'non_promoted_processed' => $successNonPromotedCount,
                'failed_count' => count($failedStudents),
                'already_exist_count' => count($alreadyExistStudents),
                'skipped_count' => count($skippedStudents),
                'inactive_skipped_count' => count($inactiveSkippedStudents),
                'total_processed' => count($processedStudents),
                'from_academic_year' => [
                    'id' => $currentAcademicYear->id,
                    'name' => $currentAcademicYear->name,
                    'periode' => $currentAcademicYear->periode,
                    'start_periode' => $currentAcademicYear->start_periode,
                    'end_periode' => $currentAcademicYear->end_periode
                ],
                'to_academic_year' => [
                    'id' => $targetAcademicYear->id,
                    'name' => $targetAcademicYear->name,
                    'periode' => $targetAcademicYear->periode,
                    'start_periode' => $targetAcademicYear->start_periode,
                    'end_periode' => $targetAcademicYear->end_periode
                ],
                'target_classroom' => [
                    'id' => $targetClassroom->id,
                    'name' => $targetClassroom->name,
                    'capacity' => $targetClassroom->capacity,
                    'academic_year_id' => $targetAcademicYear->id,
                ]
            ];

            // Tambahkan detail jika ada error atau sudah ada
            if (!empty($alreadyExistStudents)) {
                $responseData['already_exist_students'] = array_slice($alreadyExistStudents, 0, 5);
                if (count($alreadyExistStudents) > 5) {
                    $responseData['already_exist_students'][] = [
                        'message' => '... dan ' . (count($alreadyExistStudents) - 5) . ' siswa lainnya'
                    ];
                }
            }

            if (!empty($skippedStudents)) {
                $responseData['skipped_students'] = array_slice($skippedStudents, 0, 5);
                if (count($skippedStudents) > 5) {
                    $responseData['skipped_students'][] = [
                        'message' => '... dan ' . (count($skippedStudents) - 5) . ' siswa lainnya'
                    ];
                }
            }

            if (!empty($inactiveSkippedStudents)) {
                $responseData['inactive_skipped_students'] = array_slice($inactiveSkippedStudents, 0, 5);
                if (count($inactiveSkippedStudents) > 5) {
                    $responseData['inactive_skipped_students'][] = [
                        'message' => '... dan ' . (count($inactiveSkippedStudents) - 5) . ' siswa lainnya'
                    ];
                }
            }

            if (!empty($failedStudents)) {
                $responseData['failed_students'] = array_slice($failedStudents, 0, 5);
                if (count($failedStudents) > 5) {
                    $responseData['failed_students'][] = [
                        'message' => '... dan ' . (count($failedStudents) - 5) . ' siswa lainnya gagal'
                    ];
                }
            }

            return Response::success($message, 200, $responseData);
            
        } catch (\Throwable $th) {
            return Response::error(
                'Terjadi kesalahan internal: ' . (config('app.debug') ? $th->getMessage() : ''),
                500
            );
        }
    }

}
