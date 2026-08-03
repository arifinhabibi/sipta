<?php

namespace App\Http\Controllers;

use App\Models\Classroom;
use App\Models\Teacher;
use App\Models\AcademicYear;
use App\Models\TeacherAttendance;
use App\Models\StudentClassroomPlacement;
use App\Models\User;
use App\Services\AcademicYearService;
use App\Services\TeacherAttendanceService;
use App\Exceptions\BusinessRuleException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
// use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Response;

class TeacherController extends Controller
{
    private $academicYearService;
    private $teacherAttendanceService;

    public function __construct(
        AcademicYearService $academicYearService,
        TeacherAttendanceService $teacherAttendanceService
    )
    {
        $this->academicYearService = $academicYearService;
        $this->teacherAttendanceService = $teacherAttendanceService;
    }

    public function index()
    {
        $teachers = Teacher::where(
            'instance_id',
            Auth::user()->teacher->instance_id
        )->get();
        return Response::success('Data has been loaded!', 200, $teachers);
    }

    public function create(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'full_name' => 'required|string|max:255',
            'gender' => 'required|in:male,female',
            'birth_date' => 'required|date_format:Y-m-d',
            'phone' => 'required|string|max:20',
            'address' => 'required|string',
            'degree' => 'required|string|max:100',
            'photo' => 'nullable|image|mimes:jpg,jpeg,png|max:2048'
        ]);

        if ($validator->fails()) {
            return Response::badRequest('Bad Request!', [
                'errors' => $validator->errors()
            ]);
        }

        try {
            // Start transaction untuk memastikan konsistensi data
            DB::beginTransaction();

            $data = $validator->validated();

            // Generate username dari full_name
            $username = $this->generateUsername($data['full_name']);

            // Create user account
            $userAccount = User::create([
                'username' => $username,
                'password' => Hash::make($username),
                'role' => 'teacher', // atau sesuaikan dengan role yang ada di sistem
            ]);

            // Handle photo upload
            $folderName = 'teachers/' . Str::slug($data['full_name'], '_');
            if ($request->hasFile('photo')) {
                $file = $request->file('photo');
                $filename = 'photo_' . time() . '.' . $file->getClientOriginalExtension();
                $filePath = $file->storeAs($folderName, $filename, 'public');
                $data['photo'] = $filePath;
            }

            // Create teacher record
            $teacher = Teacher::create([
                'user_id' => $userAccount->id,
                'instance_id' =>  Auth::user()->teacher->instance->id,
                'full_name' => $data['full_name'],
                'gender' => $data['gender'],
                'birth_date' => $data['birth_date'],
                'phone' => $data['phone'],
                'address' => $data['address'],
                'degree' => $data['degree'],
                'photo' => $data['photo'] ?? null
            ]);

            DB::commit();

            // Log::info("Teacher created successfully", [
            //     'teacher_id' => $teacher->id,
            //     'username' => $username,
            //     'user_id' => $userAccount->id
            // ]);

            return Response::success("Teacher has been created successfully!", 201, [
                'teacher' => $teacher,
                'login_credentials' => [
                    'username' => $username,
                    'password' => $username
                ]
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            // Log::error('Failed to create teacher: ' . $e->getMessage());

            return Response::error("Failed to create teacher: " . $e->getMessage());
        }
    }

    /**
     * Generate unique username dari full_name
     */
    private function generateUsername($fullName)
    {
        // Clean full_name dan ambil kata pertama
        $nameParts = explode(' ', trim($fullName));
        $baseUsername = Str::slug($nameParts[0], '');

        // Jika username terlalu pendek, tambahkan kata kedua
        if (strlen($baseUsername) < 3 && count($nameParts) > 1) {
            $baseUsername .= Str::slug($nameParts[1], '');
        }

        $username = $baseUsername;
        $counter = 1;

        // Cek uniqueness
        while (User::where('username', $username)->exists()) {
            $username = $baseUsername . $counter;
            $counter++;

            // Safety limit
            if ($counter > 100) {
                $username = $baseUsername . '_' . time();
                break;
            }
        }

        return $username;
    }

    public function show($teacher_id)
    {
        $teacher = Teacher::where(
            'instance_id',
            Auth::user()->teacher->instance_id
        )->with(['classrooms', 'schedules'])->find($teacher_id);

        if (!$teacher) {
            return Response::notFound('Teacher not found!');
        }

        return Response::success('Data has been loaded!', 200, $teacher);
    }

    public function update(Request $request, $teacher_id)
    {
        if (
            Auth::user()->role === 'teacher'
            && Auth::user()->teacher->id !== $teacher_id
        ) {
            return Response::unprocessable(
                'Teacher hanya dapat mengubah profilnya sendiri.'
            );
        }

        $teacher = Teacher::where(
            'instance_id',
            Auth::user()->teacher->instance_id
        )->find($teacher_id);

        if (!$teacher) {
            return Response::notFound("Teacher not found!");
        }

        $validator = Validator::make($request->all(), [
            'full_name' => 'sometimes|required|string|max:255',
            'gender' => 'sometimes|required|in:male,female',
            'birth_date' => 'sometimes|required|date_format:Y-m-d',
            'phone' => 'sometimes|required|string|max:20',
            'address' => 'sometimes|required|string',
            'degree' => 'sometimes|required|string|max:100',
            'photo' => 'nullable|image|mimes:jpg,jpeg,png|max:2048'
        ]);

        if ($validator->fails()) {
            return Response::badRequest('Bad Request!', [
                'errors' => $validator->errors()
            ]);
        }

        try {
            $data = $validator->validated();

            // Log::info('Starting teacher update', ['teacher_id' => $teacher_id]);

            // Handle file uploads - REPLACE FILE SAJA
            $this->handleTeacherFileUploads($request, $teacher, $data);

            // Update teacher data
            $teacher->update($data);

            $teacher->refresh();

            // Log::info("Teacher updated successfully");

            return Response::success("Teacher has been updated successfully!", 200, [
                'teacher' => $teacher
            ]);
        } catch (\Exception $e) {
            // Log::error('Failed to update teacher: ' . $e->getMessage());
            return Response::error("Failed to update teacher: " . $e->getMessage());
        }
    }

    /**
     * Handle file uploads for teacher update - REPLACE FILE SAJA
     */
    private function handleTeacherFileUploads($request, $teacher, &$data)
    {
        if ($request->hasFile('photo')) {
            try {
                // Log::info('Processing photo upload');

                // Delete old file if exists
                if ($teacher->photo && Storage::disk('public')->exists($teacher->photo)) {
                    // Log::info('Deleting old photo: ' . $teacher->photo);
                    Storage::disk('public')->delete($teacher->photo);
                }

                // Gunakan folder yang sama berdasarkan full_name yang ada
                $folderName = 'teachers/' . Str::slug($teacher->full_name, '_');

                // Pastikan folder exists
                if (!Storage::disk('public')->exists($folderName)) {
                    Storage::disk('public')->makeDirectory($folderName);
                    // Log::info('Created directory: ' . $folderName);
                }

                // Upload new file
                $file = $request->file('photo');
                $filename = 'photo_' . time() . '.' . $file->getClientOriginalExtension();
                $filePath = $file->storeAs($folderName, $filename, 'public');
                $data['photo'] = $filePath;

                // Log::info("Uploaded new photo: " . $filePath);
            } catch (\Exception $e) {
                // Log::error("Failed to upload teacher photo: " . $e->getMessage());
                // Jika upload gagal, pertahankan photo lama
                $data['photo'] = $teacher->photo;
            }
        } else {
            // Log::info('No new photo file uploaded');
            // Jika tidak ada file baru, pertahankan photo lama
            if (!isset($data['photo'])) {
                $data['photo'] = $teacher->photo;
            }
        }
    }

    public function delete($teacher_id)
    {
        try {
            $teacher = Teacher::where(
                'instance_id',
                Auth::user()->teacher->instance_id
            )->find($teacher_id);

            if (!$teacher) {
                return Response::notFound("Teacher not found!");
            }

            // Log::info('Deleting teacher: ' . $teacher->full_name);

            DB::transaction(function () use ($teacher) {
                $teacher->update(['status' => 'inactive']);
                $teacher->user()->update(['is_active' => false]);
            });

            return Response::success(
                "Teacher berhasil dinonaktifkan tanpa menghapus histori."
            );
        } catch (\Exception $e) {
            // Log::error('Failed to delete teacher: ' . $e->getMessage());
            return Response::error("Failed to delete teacher: " . $e->getMessage());
        }
    }

    public function allAttendance()
    {
        $attendances = TeacherAttendance::with([
            'teacher:id,full_name,gender,degree,photo',
            'schedule:id,subject_id,classroom_id,date,start_time,end_time',

        ])
            ->where('teacher_id', Auth::user()->teacher->id)
            ->get();

        return Response::success('Data has been loaded!', 200, $attendances);
    }


    public function createAttendance(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'schedule_id' => 'required|uuid|exists:schedules,id',
            'type' => 'required|in:check_in,check_out',
            'longitude' => 'required|numeric',
            'latitude' => 'required|numeric',
            'real_time_photo' => 'required|image|mimes:jpg,jpeg,png|max:2048',
            'gmaps' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return Response::badRequest('Bad Request!', [
                'errors' => $validator->errors()
            ]);
        }

        $schedule = \App\Models\Schedule::where(
            'teacher_id',
            Auth::user()->teacher->id
        )->find($request->schedule_id);

        if (!$schedule) {
            return Response::unprocessable(
                'Schedule bukan milik teacher yang sedang login.'
            );
        }

        $path = $request->file('real_time_photo')->store('attendance_photos', 'public');

        try {
            $attendance = $this->teacherAttendanceService->record(
                Auth::user()->teacher,
                $schedule,
                $request->type,
                [
                'longitude' => $request->longitude,
                'latitude' => $request->latitude,
                'real_time_photo' => $path,
                'gmaps' => $request->gmaps,
                ]
            );
        } catch (BusinessRuleException $e) {
            return Response::unprocessable($e->getMessage(), $e->details());
        }

        return Response::success("Data has been stored!", 200, $attendance);
    }


    public function showAttendance($teacher_id)
    {
        $teacher = Teacher::where(
            'instance_id',
            Auth::user()->teacher->instance_id
        )->find($teacher_id);

        if (!$teacher) {
            return Response::notFound('Teacher not found!');
        }

        $attendances = TeacherAttendance::with('schedule')
            ->where('teacher_id', $teacher->id)
            ->latest()
            ->get();

        return Response::success('Data has been loaded!', 200, $attendances);
    }

    public function updateAttendance(Request $request, $teacher_id)
    {
        $validator = Validator::make($request->all(), [
            'schedule_id' => 'required|uuid|exists:schedules,id',
            'type' => 'required|in:check_in,check_out',
            'status' => 'required|in:present,absent,late,sick,permission',
            'notes' => 'nullable|string|max:225',
        ]);

        if ($validator->fails()) {
            return Response::badRequest(
                'Bad Request!',
                $validator->errors()
            );
        }

        $teacher = Teacher::where(
            'instance_id',
            Auth::user()->teacher->instance_id
        )->find($teacher_id);

        if (!$teacher) {
            return Response::notFound('Teacher not found!');
        }

        $attendance = TeacherAttendance::where('teacher_id', $teacher->id)
            ->where('schedule_id', $request->schedule_id)
            ->where('type', $request->type)
            ->first();

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

    public function deleteAttendance(Request $request, $teacher_id)
    {
        $request->validate([
            'schedule_id' => 'required|uuid|exists:schedules,id',
            'type' => 'required|in:check_in,check_out',
        ]);

        $teacher = Teacher::where(
            'instance_id',
            Auth::user()->teacher->instance_id
        )->find($teacher_id);

        if (!$teacher) {
            return Response::notFound('Teacher not found!');
        }

        $deleted = TeacherAttendance::where('teacher_id', $teacher->id)
            ->where('schedule_id', $request->schedule_id)
            ->where('type', $request->type)
            ->delete();

        if (!$deleted) {
            return Response::notFound('Attendance not found!');
        }

        return Response::success('Attendance berhasil dihapus.');
    }

    public function targetUpgrade()
    {
        $user = Auth::user();

        // 1. Dapatkan instance user
        if (!$user->teacher || !$user->teacher->instance) {
            return Response::error("User doesn't have instance!", 400);
        }
        
        $instanceId = $user->teacher->instance->id;

        // 2. Ambil academic year target (tahun akademik berikutnya)
        $currentAcademicYear = AcademicYear::where('instance_id', $instanceId)
            ->where('is_active', true)
            ->first();

        if (!$currentAcademicYear) {
            return Response::error("Tidak ada tahun akademik aktif!", 400);
        }

        if (!$currentAcademicYear->isEvenSemester()) {
            return Response::unprocessable(
                'Kenaikan kelas hanya tersedia pada semester genap.'
            );
        }

        // Cari tahun akademik target (setelah periode saat ini)
        $targetAcademicYear = AcademicYear::where('instance_id', $instanceId)
            ->where('start_periode', '>', $currentAcademicYear->end_periode)
            ->orderBy('start_periode', 'asc')
            ->first();

        // Jika tidak ada, gunakan logic untuk membuat tahun akademik berikutnya
        // (sama seperti di promotedStudents)
        if (!$targetAcademicYear) {
            return Response::unprocessable(
                'Tahun akademik tujuan belum dibuat. Buat tahun akademik tujuan terlebih dahulu.'
            );
        }

        // 3. Query classrooms untuk tahun akademik target
        // Note: Karena classroom tidak punya academic_year_id, kita ambil semua classroom di instance
        // Lalu filter yang cocok untuk target (biasanya kelas tingkat lebih tinggi)
        $query = Classroom::with(['teacher', 'instance'])
            ->where('instance_id', $instanceId);

        // Filter untuk teacher role - jika teacher hanya bisa lihat kelas di instance mereka
        // if ($user->role == "teacher") {
        //     $query->where('teacher_id', $user->teacher->id);
        // }

        $classrooms = $query->get();

        // 4. Ambil students dari placement untuk tahun akademik target
        if ($classrooms->isNotEmpty()) {
            $classroomIds = $classrooms->pluck('id');
            
            // Ambil placements untuk tahun akademik target
            $placements = StudentClassroomPlacement::with('student')
                ->whereIn('classroom_id', $classroomIds)
                ->where('academic_year_id', $targetAcademicYear->id)
                ->get()
                ->groupBy('classroom_id');

            // Attach students ke masing-masing classroom
            foreach ($classrooms as $classroom) {
                $classroomPlacements = $placements->get($classroom->id, collect());
                
                // Ambil students dari placements
                $students = $classroomPlacements->pluck('student')->filter();
                
                // Simpan sebagai relation
                $classroom->setRelation('students', $students);
                
                // Tambahkan info kapasitas yang tersedia
                $currentStudentsCount = $students->count();
                $classroom->available_capacity = $classroom->capacity - $currentStudentsCount;
                $classroom->current_students_count = $currentStudentsCount;
            }
        } else {
            // Set students kosong jika tidak ada classroom
            foreach ($classrooms as $classroom) {
                $classroom->setRelation('students', collect());
                $classroom->available_capacity = $classroom->capacity;
                $classroom->current_students_count = 0;
            }
        }

        // 5. Tambahkan info tahun akademik target ke response
        $responseData = [
            'classrooms' => $classrooms,
            'target_academic_year' => [
                'id' => $targetAcademicYear->id,
                'name' => $targetAcademicYear->name,
                'periode' => $targetAcademicYear->periode,
                'start_periode' => $targetAcademicYear->start_periode,
                'end_periode' => $targetAcademicYear->end_periode
            ],
            'current_academic_year' => [
                'id' => $currentAcademicYear->id,
                'name' => $currentAcademicYear->name,
                'periode' => $currentAcademicYear->periode
            ]
        ];

        return Response::success("Data has been loaded!", 200, $responseData);
    }

    public function showClassroom($classroom_id)
    {
        $classroom = Classroom::where('id', $classroom_id)
            ->where('instance_id', Auth::user()->teacher->instance_id)
            ->with(['teacher', 'students'])
            ->first();

        if (!$classroom) {
            return Response::error("Data not found!");
        }

        return Response::success("Data has been loaded!", 200, $classroom);
    }
}
