<?php

namespace App\Http\Controllers;

use App\Exceptions\BusinessRuleException;
use App\Models\AcademicYear;
use App\Models\Classroom;
use App\Models\Instance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
// use Illuminate\Support\Facades\Log;
use App\Models\StudentClassroomPlacement;
use App\Services\AcademicYearService;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Response;


class AdminController extends Controller
{
    private $academicYearService;

    public function __construct(AcademicYearService $academicYearService)
    {
        $this->academicYearService = $academicYearService;
    }

    public function index()
    {
        return "hello world";
    }

    public function updateClassroom(Request $request, $classroom_id)
    {
        $instanceId = Auth::user()->teacher->instance_id;
        $classroom = Classroom::forInstance($instanceId)->find($classroom_id);

        if (!$classroom) {
            return Response::notFound();
        }

        $validator = Validator::make($request->all(), [
            'teacher_id' => 'required|uuid|exists:teachers,id',
            'name' => 'required|string',
            'room_number' => 'nullable|string',
            'capacity' => 'nullable|numeric',
            'description' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return Response::badRequest('Bad Request!', [
                "errors" => $validator->errors()
            ]);
        }


        $teacherBelongsToInstance = \App\Models\Teacher::where(
            'instance_id',
            $instanceId
        )->where('id', $request->teacher_id)->exists();

        if (!$teacherBelongsToInstance) {
            return Response::unprocessable(
                'Teacher tidak berasal dari instance yang sama.'
            );
        }

        $classroom->update($validator->validated());

        return Response::success("Data success updated!");
    }

    public function updateInstance(Request $request)
    {
        $instance = Instance::find(Auth::user()->teacher->instance->id);
        if (!$instance) {
            return Response::notFound();
        }
        $validator = Validator::make($request->all(), [
            'name' => 'required|string',
            'description' => 'nullable',
            'type_institutions' => 'required|string',
            'latitude' => 'required|string',
            'longitude' => 'required|string',
            'logo' => 'nullable|image|mimes:jpg,jpeg,png|max:2048'
        ]);

        if ($validator->fails()) {
            // Log::error('Validation failed: ', $validator->errors()->toArray());
            return Response::badRequest('Bad Request!', [
                'errors' => $validator->errors()
            ]);
        }

        $folderName = 'instances/' . Str::slug($instance->name, '_');
        $field = 'logo';
        $data = $request->all();
        if ($request->hasFile($field)) {
            try {
                // Log::info("Processing file upload for: " . $field);

                // Delete old file if exists
                if ($instance->$field && Storage::disk('public')->exists($instance->$field)) {
                    // Log::info("Deleting old file: " . $instance->$field);
                    Storage::disk('public')->delete($instance->$field);
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
                $data[$field] = $instance->$field;
            }
        }

        $instance->update($data);

        return Response::success("Data has been updated!");
    }


    public function createClassroom(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'teacher_id' => 'required|uuid|exists:teachers,id',
            'name' => 'required|string',
            'room_number' => 'nullable|string',
            'capacity' => 'nullable|numeric',
            'description' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return Response::badRequest('Bad Request!', [
                "errors" => $validator->errors()
            ]);
        }

        $data = $validator->validated();

        // Set description to '-' if null or empty
        if (empty($data['description'])) {
            $data['description'] = '-';
        }

        $user = Auth::user();
        $instanceId = $user->teacher->instance_id;
        $teacherBelongsToInstance = \App\Models\Teacher::where(
            'instance_id',
            $instanceId
        )->where('id', $data['teacher_id'])->exists();

        if (!$teacherBelongsToInstance) {
            return Response::unprocessable(
                'Teacher tidak berasal dari instance yang sama.'
            );
        }

        $data['instance_id'] = $instanceId;

        Classroom::create($data);
        return Response::success("Data has been stored!");
    }

    public function deleteClassroom($classroom_id)
    {
        $classroom = Classroom::forInstance(
            Auth::user()->teacher->instance_id
        )->find($classroom_id);

        if (!$classroom) {
            return Response::notFound();
        }

        if ($classroom->schedules()->exists() || $classroom->placements()->exists()) {
            return Response::conflict(
                'Kelas sudah memiliki histori dan tidak dapat dihapus. Arsipkan atau ganti nama kelas.'
            );
        }

        $classroom->delete();

        return Response::success('Data has been deleted!');
    }

    public function getStudentsByClassroom()
    {
        $user = Auth::user();
        
        // 1. Dapatkan instance user
        if (!$user->teacher || !$user->teacher->instance) {
            return Response::error("User doesn't have instance!", 400);
        }
        
        $instanceId = $user->teacher->instance->id;

        // 2. Ambil academic year aktif untuk instance ini
        $academicYear = AcademicYear::where('instance_id', $instanceId)
            ->where('is_active', true)
            ->first();

        if (!$academicYear) {
            return Response::error("Tidak ada tahun akademik aktif!", 400);
        }

        // 3. Query classrooms berdasarkan instance user
        $query = Classroom::with([
            'teacher',
            'instance'
        ])->where('instance_id', $instanceId);

        // Filter untuk teacher role
        if ($user->role == 'teacher') {
            $query->where('teacher_id', $user->teacher->id);
        }

        $classrooms = $query->get();

        // 4. Ambil students dari placement untuk academic year aktif
        if ($classrooms->isNotEmpty()) {
            $classroomIds = $classrooms->pluck('id');
            
            // Ambil semua placements beserta students lengkap
            $placements = StudentClassroomPlacement::with('student')
                ->whereIn('classroom_id', $classroomIds)
                ->where('academic_year_id', $academicYear->id)
                ->get()
                ->groupBy('classroom_id');

            // Attach students ke masing-masing classroom
            foreach ($classrooms as $classroom) {
                $classroomPlacements = $placements->get($classroom->id, collect());
                
                // Ambil semua student dari placements
                $students = $classroomPlacements->pluck('student')->filter();
                
                // Simpan sebagai relation
                $classroom->setRelation('students', $students);
            }
        } else {
            // Set students kosong jika tidak ada classroom
            foreach ($classrooms as $classroom) {
                $classroom->setRelation('students', collect());
            }
        }

        return Response::success("Data has been loaded!", 200, $classrooms);
    }

    public function showClassroom(Request $request, $classroom_id)
    {
        $user = Auth::user();
        $instanceId = $user->teacher->instance_id;
        $academicYearId = $request->query('academic_year_id');

        $academicYear = $academicYearId
            ? AcademicYear::where('instance_id', $instanceId)
                ->find($academicYearId)
            : $this->academicYearService->activeForInstance($instanceId);

        if (!$academicYear) {
            return Response::notFound('Semester tidak ditemukan.');
        }

        $classroom = Classroom::forInstance($instanceId)
            ->with(['teacher', 'instance'])
            ->when($user->role === 'teacher', function ($query) use ($user) {
                $query->where('teacher_id', $user->teacher->id);
            })
            ->find($classroom_id);

        if (!$classroom) {
            return Response::notFound('Classroom tidak ditemukan.');
        }

        $students = StudentClassroomPlacement::with('student')
            ->where('academic_year_id', $academicYear->id)
            ->where('classroom_id', $classroom->id)
            ->get()
            ->pluck('student')
            ->filter()
            ->values();

        $classroom->setRelation('students', $students);
        $classroom->academic_year = $academicYear;

        return Response::success('Data has been loaded!', 200, $classroom);
    }

    public function getAcademicYears()
    {
        try {
            $user = Auth::user();

            // Filter academic years by user's instance
            $academicYears = AcademicYear::where('instance_id', $user->teacher->instance->id)
                ->orderBy('created_at', 'desc')
                ->get();

            return Response::success("Data retrieved successfully!", 200, $academicYears);
        } catch (BusinessRuleException $e) {
            return Response::unprocessable($e->getMessage(), $e->details());
        } catch (\Exception $e) {
            // Log::error('Error fetching academic years: ' . $e->getMessage());
            return Response::serverError("Failed to retrieve academic years");
        }
    }

    public function createAcademicYear(Request $request)
    {
        $instanceId = Auth::user()->teacher->instance_id;
        $validator = Validator::make($request->all(), [
            'name' => [
                'required',
                'string',
                Rule::unique('academic_years', 'name')
                    ->where(function ($query) use ($instanceId, $request) {
                        return $query
                            ->where('instance_id', $instanceId)
                            ->where('periode', $request->periode);
                    }),
            ],
            'periode' => 'required|in:ganjil,genap',
            'start_periode' => 'required|date',
            'end_periode' => 'required|date|after:start_periode',
            'is_active' => 'sometimes|boolean',
            'is_promoted' => 'sometimes|boolean'
        ]);

        if ($validator->fails()) {
            return Response::badRequest("Bad Request!", $validator->errors());
        }

        try {
            $user = Auth::user();

            if (!$user || !$user->teacher || !$user->teacher->instance) {
                return Response::badRequest("User tidak valid untuk membuat tahun akademik");
            }

            $instanceId = $user->teacher->instance->id;

            $isActive = $request->boolean('is_active'); // convert ke true/false jelas
            $isPromoted = $request->boolean('is_promoted');

            $data = [
                'name' => $request->name,
                'periode' => $request->periode,
                'start_periode' => $request->start_periode,
                'end_periode' => $request->end_periode,
                'is_active' => false,
                'is_promoted' => $isPromoted,
                'instance_id' => $instanceId
            ];

            $academicYear = DB::transaction(function () use ($data, $isActive) {
                $academicYear = AcademicYear::create($data);

                if ($isActive) {
                    return $this->academicYearService->activate($academicYear);
                }

                return $academicYear;
            });

            return Response::success(
                "Tahun akademik berhasil dibuat!",
                201,
                $academicYear
            );
        } catch (BusinessRuleException $e) {
            return Response::unprocessable($e->getMessage(), $e->details());
        } catch (\Exception $e) {
            // Log::error('Error creating academic year: ' . $e->getMessage());
            return Response::serverError("Gagal membuat tahun akademik");
        }
    }

    public function updateAcademicYear(Request $request, $academic_year_id)
    {
        $user = Auth::user();
        $instanceId = $user->teacher->instance->id;

        // Cari academic year yang belong to user's instance
        $academicYear = AcademicYear::where('id', $academic_year_id)
            ->where('instance_id', $instanceId)
            ->first();

        if (!$academicYear) {
            return Response::notFound("Tahun akademik tidak ditemukan");
        }

        $validator = Validator::make($request->all(), [
            'name' => [
                'sometimes',
                'required',
                'string',
                Rule::unique('academic_years', 'name')
                    ->where(function ($query) use ($instanceId, $request, $academicYear) {
                        return $query
                            ->where('instance_id', $instanceId)
                            ->where(
                                'periode',
                                $request->input('periode', $academicYear->periode)
                            );
                    })
                    ->ignore($academic_year_id),
            ],
            'periode' => 'sometimes|required|in:ganjil,genap',
            'start_periode' => 'sometimes|required|date',
            'end_periode' => 'sometimes|required|date|after:start_periode',
            'is_active' => 'sometimes|boolean'
        ]);

        if ($validator->fails()) {
            return Response::badRequest("Bad Request!", $validator->errors());
        }

        try {
            $data = $validator->validated();
            $shouldActivate = isset($data['is_active']) && $data['is_active'];
            unset($data['is_active']);

            $academicYear->update($data);

            if ($shouldActivate) {
                $academicYear = $this->academicYearService->activate(
                    $academicYear
                );
            } elseif ($request->has('is_active')) {
                $academicYear->update([
                    'is_active' => false,
                    'status' => $academicYear->status === 'closed'
                        ? 'closed' : 'draft',
                ]);
            }

            return Response::success(
                "Tahun akademik berhasil diperbarui!",
                200,
                $academicYear
            );
        } catch (BusinessRuleException $e) {
            return Response::unprocessable($e->getMessage(), $e->details());
        } catch (\Exception $e) {
            // Log::error('Error updating academic year: ' . $e->getMessage());
            return Response::serverError("Gagal memperbarui tahun akademik");
        }
    }

    public function deleteAcademicYear($academic_year_id)
    {
        $user = Auth::user();
        $instanceId = $user->teacher->instance->id;

        // Cari academic year yang belong to user's instance
        $academicYear = AcademicYear::where('id', $academic_year_id)
            ->where('instance_id', $instanceId)
            ->first();

        if (!$academicYear) {
            return Response::notFound("Tahun akademik tidak ditemukan");
        }

        try {
            // Cek jika tahun akademik sedang aktif
            if ($academicYear->is_active) {
                return Response::badRequest("Tidak dapat menghapus tahun akademik yang sedang aktif");
            }

            if (
                $academicYear->schedules()->exists()
                || $academicYear->placements()->exists()
            ) {
                return Response::conflict(
                    'Tahun akademik memiliki histori dan tidak dapat dihapus.'
                );
            }

            $academicYear->delete();

            return Response::success("Tahun akademik berhasil dihapus!");
        } catch (\Exception $e) {
            // Log::error('Error deleting academic year: ' . $e->getMessage());
            return Response::serverError("Gagal menghapus tahun akademik");
        }
    }
}
