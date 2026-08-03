<?php

namespace App\Http\Controllers;

use App\Exceptions\BusinessRuleException;
use App\Models\Accomplishment;
use App\Models\Schedule;
use App\Models\Subject;
use App\Models\AcademicYear;
use App\Models\Teacher;
use Carbon\CarbonPeriod;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Response;
use App\Models\TeacherAttendance;
use App\Services\AcademicYearService;
use App\Services\ScheduleService;


class ScheduleController extends Controller
{
    private $academicYearService;
    private $scheduleService;

    public function __construct(
        AcademicYearService $academicYearService,
        ScheduleService $scheduleService
    ) {
        $this->academicYearService = $academicYearService;
        $this->scheduleService = $scheduleService;
    }

    public function index(Request $request)
    {
        $user = Auth::user();
        $isAdmin = $user->role === 'admin';
        $isTeacher = $user->role === 'teacher';

        // Untuk teacher, gunakan teacher_id dari user yang login
        if ($isTeacher) {
            $user->load('teacher.instance.academicYears');
            $teacherId = $user->teacher->id;
            $teacherData = $this->getTeacherData($user->teacher);

            // Dapatkan academic year aktif dari instance teacher
            $activeAcademicYear = null;
            if ($user->teacher->instance && $user->teacher->instance->academicYears) {
                $activeAcademicYear = $user->teacher->instance->academicYears
                    ->where('is_active', true)
                    ->first();
            }

            $instanceData = $user->teacher->instance ?
                collect($user->teacher->instance->toArray())->except('academic_years')->toArray() : null;
        } else if ($isAdmin) {
            // Untuk admin, tentukan academic year yang akan digunakan
            // Bisa dari request atau default active
            $requestedAcademicYearId = $request->query('academic_year_id');

            if ($requestedAcademicYearId) {
                // Jika ada academic_year_id parameter, gunakan yang diminta
                $activeAcademicYear = $this->findAcademicYearForCurrentInstance(
                    $requestedAcademicYearId
                );
                if (!$activeAcademicYear) {
                    return Response::error("Academic year not found");
                }
            } else {
                // Jika tidak ada, gunakan academic year aktif default
                $activeAcademicYear = $this->getDefaultAcademicYear();
            }

            $teacherId = null; // Admin bisa lihat semua teacher
            $teacherData = null;
            $instanceData = null;
        } else {
            return Response::error("Unauthorized role");
        }

        // Jika tidak ada academic year aktif, return error
        if (!$activeAcademicYear) {
            return Response::error("No active academic year found");
        }

        $academicYearId = $activeAcademicYear->id;
        $today = now()->toDateString();

        $query = Schedule::with([
            'subject:id,name,code,description,instance_id',
            'teacher:id,full_name,gender,degree,photo',
            'classroom:id,name,room_number,capacity,description',
            'teacher_attendances:id,schedule_id,type',
            'accomplishments:id,name,type'
        ])
            ->where('academic_year_id', $academicYearId)
            ->orderBy('date', 'asc')
            ->orderBy('start_time', 'asc');

        // Filter by teacher_id untuk teacher atau jika admin memilih teacher tertentu
        if ($isTeacher) {
            $query->where('teacher_id', $teacherId);
        } else if ($isAdmin && $request->has('teacher_id')) {
            $query->where('teacher_id', $request->query('teacher_id'));
        }

        $schedules = $query->get();

        // Format response data
        $responseData = [
            'academic_year' => [
                'id' => $activeAcademicYear->id,
                'name' => $activeAcademicYear->name,
                'periode' => $activeAcademicYear->periode,
                'start_periode' => $activeAcademicYear->start_periode,
                'end_periode' => $activeAcademicYear->end_periode,
                'is_active' => $activeAcademicYear->is_active,
            ],
            'schedules' => $schedules
        ];

        // Tambahkan teacher data jika spesifik teacher
        if ($teacherData) {
            $responseData['teacher'] = $teacherData;
        }

        // Tambahkan instance data jika available
        if ($instanceData) {
            $responseData['instance'] = $instanceData;
        }

        return Response::success('Data has been loaded!', 200, $schedules);
    }

    public function today(Request $request)
    {
        $user = Auth::user();
        $isAdmin = $user->role === 'admin';
        $isTeacher = $user->role === 'teacher';

        // Untuk teacher, gunakan teacher_id dari user yang login
        if ($isTeacher) {
            $user->load('teacher.instance.academicYears');
            $teacherId = $user->teacher->id;

            // Dapatkan academic year aktif dari instance teacher
            $activeAcademicYear = null;
            if ($user->teacher->instance && $user->teacher->instance->academicYears) {
                $activeAcademicYear = $user->teacher->instance->academicYears
                    ->where('is_active', true)
                    ->first();
            }
        } else if ($isAdmin) {
            // Untuk admin, tentukan academic year yang akan digunakan
            $requestedAcademicYearId = $request->query('academic_year_id');

            if ($requestedAcademicYearId) {
                $activeAcademicYear = $this->findAcademicYearForCurrentInstance(
                    $requestedAcademicYearId
                );
                if (!$activeAcademicYear) {
                    return Response::error("Academic year not found");
                }
            } else {
                $activeAcademicYear = $this->getDefaultAcademicYear();
            }

            $teacherId = $request->query('teacher_id'); // Admin bisa pilih teacher tertentu
        } else {
            return Response::error("Unauthorized role");
        }

        // Jika tidak ada academic year aktif, return error
        if (!$activeAcademicYear) {
            return Response::error("No active academic year found");
        }

        $academicYearId = $activeAcademicYear->id;

        $query = Schedule::with([
            'subject:id,name,code,description',
            'teacher:id,full_name,gender,degree,photo',
            'classroom:id,name,room_number,capacity,description',
            'teacher_attendances:id,schedule_id,type,created_at',
            'accomplishments:id,schedule_id,name,type'
        ])
            ->where('academic_year_id', $academicYearId)
            ->whereDate('date', Carbon::today());

        // Filter by teacher_id
        if ($isTeacher) {
            $query->where('teacher_id', $teacherId);
        } else if ($isAdmin && $teacherId) {
            $query->where('teacher_id', $teacherId);
        }

        $schedules = $query->get();

        return Response::success('Data has been loaded!', 200, $schedules);
    }

      public function create(Request $request)
    {
        $user = Auth::user();
        $isAdmin = $user->role === 'admin';
        $isTeacher = $user->role === 'teacher';

        // Tentukan academic year yang akan digunakan
        if ($isTeacher) {
            $user->load('teacher.instance.academicYears');

            // Dapatkan academic year aktif dari instance teacher
            $activeAcademicYear = null;
            if ($user->teacher->instance && $user->teacher->instance->academicYears) {
                $activeAcademicYear = $user->teacher->instance->academicYears
                    ->where('is_active', true)
                    ->first();
            }
        } else if ($isAdmin) {
            // Admin harus menyertakan academic_year_id dalam request
            $validator = Validator::make($request->all(), [
                'academic_year_id' => 'required|uuid|exists:academic_years,id'
            ]);

            if ($validator->fails()) {
                return Response::badRequest('Academic year ID is required for admin!', [
                    "errors" => $validator->errors()
                ]);
            }

            $activeAcademicYear = $this->findAcademicYearForCurrentInstance(
                $request->academic_year_id
            );
        } else {
            return Response::error("Unauthorized role");
        }

        // Jika tidak ada academic year, return error
        if (!$activeAcademicYear) {
            return Response::error("No academic year found");
        }

        $validator = Validator::make($request->all(), [
            'subject_id'  => 'required|uuid|exists:subjects,id',
            'teacher_id'  => 'required|uuid|exists:teachers,id',
            'classroom_id' => 'required|uuid|exists:classrooms,id',
            'date' => 'required|date_format:Y-m-d', // Ganti day dengan date
            'start_time'    => 'required|date_format:H:i',
            'end_time'      => 'required|date_format:H:i|after:start_time',
            'assessment_period' => 'sometimes|in:regular,uts,uas',
        ]);

        if ($validator->fails()) {
            return Response::badRequest('Bad Request!', [
                "errors" => $validator->errors()
            ]);
        }

        $data = $validator->validated();

        try {
            $schedule = $this->scheduleService->create(
                $data,
                $activeAcademicYear
            );

            return Response::success(
                'Schedule berhasil dibuat.',
                201,
                $schedule
            );
        } catch (BusinessRuleException $e) {
            return Response::unprocessable($e->getMessage(), $e->details());
        }
    }

    public function update(Request $request, $schedule_id)
    {
        $schedule = Schedule::whereHas('academicYear', function ($query) {
            $query->where(
                'instance_id',
                Auth::user()->teacher->instance_id
            );
        })->find($schedule_id);
        if (!$schedule) {
            return Response::notFound();
        }

        $user = Auth::user();
        $isAdmin = $user->role === 'admin';
        $isTeacher = $user->role === 'teacher';

        // Tentukan academic year
        if ($isTeacher) {
            $user->load('teacher.instance.academicYears');
            $activeAcademicYear = null;
            if ($user->teacher->instance && $user->teacher->instance->academicYears) {
                $activeAcademicYear = $user->teacher->instance->academicYears
                    ->where('is_active', true)
                    ->first();
            }
        } else if ($isAdmin) {
            // Admin bisa update academic year jika perlu
            if ($request->has('academic_year_id')) {
                $activeAcademicYear = $this->findAcademicYearForCurrentInstance(
                    $request->academic_year_id
                );
                if (!$activeAcademicYear) {
                    return Response::error("Academic year not found");
                }
            } else {
                // Jika tidak disediakan, gunakan academic year yang sama
                $activeAcademicYear = $this->findAcademicYearForCurrentInstance(
                    $schedule->academic_year_id
                );
            }
        }

        if (!$activeAcademicYear) {
            return Response::error("No academic year found");
        }

        $validator = Validator::make($request->all(), [
            'subject_id'  => 'required|uuid|exists:subjects,id',
            'teacher_id'  => 'required|uuid|exists:teachers,id',
            'classroom_id' => 'required|uuid|exists:classrooms,id',
            'date' => 'required|date_format:Y-m-d',
            'start_time'    => 'required|date_format:H:i',
            'end_time'      => 'required|date_format:H:i|after:start_time',
            'assessment_period' => 'sometimes|in:regular,uts,uas',
        ]);

        if ($validator->fails()) {
            return Response::badRequest('Bad Request!', [
                "errors" => $validator->errors()
            ]);
        }

        $data = $validator->validated();

        try {
            $schedule = $this->scheduleService->update(
                $schedule,
                $data,
                $activeAcademicYear
            );

            return Response::success(
                'Schedule berhasil diperbarui.',
                200,
                $schedule
            );
        } catch (BusinessRuleException $e) {
            return Response::unprocessable($e->getMessage(), $e->details());
        }
    }

    public function show($schedule_id)
{
    

    $schedule = Schedule::where('id', $schedule_id)->with([
        'subject:id,name,code,description',
        'teacher:id,full_name,gender,degree,photo',
        'classroom:id,name,room_number,capacity,description',
        'classroom.placements.student' => function($query) {
            $query->where('status', 'active'); // Filter hanya student active
        },
        'classroom.placements.student.attendances' => function($query) use ($schedule_id) {
            $query->where('schedule_id', $schedule_id); // Filter attendances untuk schedule ini
        },
        'teacher_attendances:id,schedule_id,type',
        'accomplishments:id,schedule_id,name,type'
    ])->first();

    if (!$schedule) {
        return Response::error("Data not found!");
    }
    
    $currentAcademicYear = $schedule->academicYear;
    if (!$currentAcademicYear) {
        return Response::error('Tidak ada tahun akademik aktif!', 422);
    }
    // Transform data untuk response yang lebih rapi
    $formattedSchedule = $schedule->toArray();
    
    // Ambil hanya students dari placements yang aktif
    if ($schedule->classroom && $schedule->classroom->placements) {
        $activeStudents = $schedule->classroom->placements
            ->where('academic_year_id', $currentAcademicYear->id)
            ->pluck('student')
            ->filter() // Hilangkan null
            ->values() // Reset index array
            ->toArray();
        
        $formattedSchedule['classroom']['students'] = $activeStudents;
        unset($formattedSchedule['classroom']['placements']); // Hapus placements dari response jika tidak diperlukan
    }
    
    return Response::success('Data has been loaded!', 200, $formattedSchedule);
}

    

    public function delete($id)
    {
        $user = Auth::user();

        // Hanya admin yang bisa menghapus
        if ($user->role !== 'admin') {
            return Response::error("Unauthorized. Only admin can delete schedules");
        }

        // Cari schedule yang akan dihapus
        $schedule = Schedule::whereHas('academicYear', function ($query) {
            $query->where(
                'instance_id',
                Auth::user()->teacher->instance_id
            );
        })->find($id);

        if (!$schedule) {
            return Response::error("Schedule not found");
        }

        try {
            // Hapus schedule
            $schedule->delete();

            return Response::success('Schedule has been deleted successfully!');
        } catch (\Exception $e) {
            return Response::error("Failed to delete schedule");
        }
    }

    public function subjects(Request $request)
    {
        $user = Auth::user();

        // Load teacher dengan instance
        $user->load('teacher.instance');

        if (!$user->teacher) {
            return Response::error("Teacher data not found");
        }

        // Dapatkan instance_id dari teacher
        $instanceId = $user->teacher->instance_id;

        if (!$instanceId) {
            return Response::error("Teacher doesn't belong to any instance");
        }

        // Ambil subjects berdasarkan instance_id, bukan academic_year_id
        $subjects = Subject::where('instance_id', $instanceId)->get();

        if ($subjects->isEmpty()) {
            return Response::success("No subjects found for this instance", 200, []);
        }

        return Response::success("Data has been loaded!", 200, $subjects);
    }

       public function subjectCreate(Request $request)
    {
        $user = Auth::user();

        // Load teacher dengan instance
        $user->load('teacher.instance');

        if (!$user->teacher) {
            return Response::error("Teacher data not found");
        }

        // Dapatkan instance_id dari teacher
        $instanceId = $user->teacher->instance_id;

        if (!$instanceId) {
            return Response::error("Teacher doesn't belong to any instance");
        }

        $validator = Validator::make($request->all(), [
            'name' => [
                'required',
                Rule::unique('subjects', 'name')->where(function ($query) use ($instanceId) {
                    return $query->where('instance_id', $instanceId);
                }),
            ],
            'code' => [
                'nullable',
                Rule::unique('subjects', 'code')->where(function ($query) use ($instanceId) {
                    return $query->where('instance_id', $instanceId);
                }),
            ],
            'description' => 'nullable'
        ]);

        if ($validator->fails()) {
            return Response::badRequest('Bad Request!', [
                'errors' => $validator->errors()
            ]);
        }

        Subject::create([
            'instance_id' => $instanceId,
            'name' => $request->name,
            'code' => $request->code,
            'description' => $request->description
        ]);

        return Response::success('Subject has been created successfully!');
    }


    public function subjectShow($subject_id)
    {
        $subject = Subject::forInstance(
            Auth::user()->teacher->instance_id
        )->find($subject_id);

        if (!$subject) {
            return Response::notFound('Subject not found!');
        }

        return Response::success('Data has been loaded!', 200, $subject);
    }

   public function subjectUpdate(Request $request, $subject_id)
    {
        $user = Auth::user();

        // Load teacher dengan instance
        $user->load('teacher.instance');

        if (!$user->teacher) {
            return Response::error("Teacher data not found");
        }

        $subject = Subject::find($subject_id);
        if (!$subject) {
            return Response::notFound();
        }

        // Validasi bahwa subject belongs to teacher's instance
        if ($subject->instance_id !== $user->teacher->instance_id) {
            return Response::error("You don't have access to this subject");
        }

        $validator = Validator::make($request->all(), [
            'name' => [
                'required',
                Rule::unique('subjects', 'name')
                    ->where(function ($query) use ($user) {
                        return $query->where(
                            'instance_id',
                            $user->teacher->instance_id
                        );
                    })
                    ->ignore($subject_id),
            ],
            'code' => [
                'nullable',
                Rule::unique('subjects', 'code')
                    ->where(function ($query) use ($user) {
                        return $query->where(
                            'instance_id',
                            $user->teacher->instance_id
                        );
                    })
                    ->ignore($subject_id),
            ],
            'description' => 'nullable'
        ]);

        if ($validator->fails()) {
            return Response::badRequest('Bad Request!', [
                'errors' => $validator->errors()
            ]);
        }

        $subject->update($validator->validated());

        return Response::success('Subject has been updated!');
    }


      public function subjectDelete($subject_id)
    {
        $user = Auth::user();

        // Load teacher dengan instance
        $user->load('teacher.instance');

        if (!$user->teacher) {
            return Response::error("Teacher data not found");
        }

        $subject = Subject::find($subject_id);
        if (!$subject) {
            return Response::notFound();
        }

        // Validasi bahwa subject belongs to teacher's instance
        if ($subject->instance_id !== $user->teacher->instance_id) {
            return Response::error("You don't have access to this subject");
        }

        if ($subject->schedules()->exists()) {
            return Response::conflict(
                'Subject sudah digunakan oleh jadwal dan tidak dapat dihapus.'
            );
        }

        $subject->delete();
        return Response::success('Subject has been deleted!');
    }
    public function createAccomplish(Request $request, $schedule_id)
    {
        $schedule = Schedule::whereHas('academicYear', function ($query) {
            $query->where(
                'instance_id',
                Auth::user()->teacher->instance_id
            );
        })->find($schedule_id);

        if (!$schedule) {
            return Response::notFound();
        }

        $validator = Validator::make($request->all(), [
            'accomplishments' => 'required|array',
            'accomplishments.*.name' => 'required|string|max:255',
            'accomplishments.*.type' => 'required|string|in:knowledge,skill,attitude,creativity',
        ]);

        if ($validator->fails()) {
            return Response::badRequest('Bad Request!',  [
                "errors" => $validator->errors()
            ]);
        }

        foreach ($request->accomplishments as $accomplish) {
            Accomplishment::create([
                'schedule_id' => $schedule->id,
                'name' => $accomplish['name'],
                'type' => $accomplish['type']
            ]);
        }

        return Response::success('Data has been stored!');
    }

    /**
     * Helper method untuk mendapatkan data teacher
     */
    private function getTeacherData($teacher)
    {
        return [
            'id' => $teacher->id,
            'user_id' => $teacher->user_id,
            'instance_id' => $teacher->instance_id,
            'full_name' => $teacher->full_name,
            'gender' => $teacher->gender,
            'birth_date' => $teacher->birth_date,
            'phone' => $teacher->phone,
            'address' => $teacher->address,
            'degree' => $teacher->degree,
            'photo' => $teacher->photo,
            'status' => $teacher->status,
            'created_at' => $teacher->created_at,
            'updated_at' => $teacher->updated_at,
        ];
    }

    /**
     * Helper method untuk mendapatkan academic year default (untuk admin)
     */
    private function getDefaultAcademicYear()
    {
        return $this->academicYearService->activeForInstance(
            Auth::user()->teacher->instance_id
        );
    }

    private function findAcademicYearForCurrentInstance($academicYearId)
    {
        return AcademicYear::where(
            'instance_id',
            Auth::user()->teacher->instance_id
        )->find($academicYearId);
    }

    /**
     * Get all schedules with is_completed = false
     */
    public function incompleteSchedules(Request $request)
    {
        $user = Auth::user();
        $isAdmin = $user->role === 'admin';
        $isTeacher = $user->role === 'teacher';

        // Untuk teacher, gunakan teacher_id dari user yang login
        if ($isTeacher) {
            $user->load('teacher.instance.academicYears');
            $teacherId = $user->teacher->id;
            
            // Dapatkan academic year aktif dari instance teacher
            $activeAcademicYear = null;
            if ($user->teacher->instance && $user->teacher->instance->academicYears) {
                $activeAcademicYear = $user->teacher->instance->academicYears
                    ->where('is_active', true)
                    ->first();
            }
        } else if ($isAdmin) {
            // Untuk admin, tentukan academic year yang akan digunakan
            $requestedAcademicYearId = $request->query('academic_year_id');

            if ($requestedAcademicYearId) {
                $activeAcademicYear = $this->findAcademicYearForCurrentInstance(
                    $requestedAcademicYearId
                );
                if (!$activeAcademicYear) {
                    return Response::error("Academic year not found");
                }
            } else {
                $activeAcademicYear = $this->getDefaultAcademicYear();
            }

            $teacherId = $request->query('teacher_id'); // Admin bisa pilih teacher tertentu
        } else {
            return Response::error("Unauthorized role");
        }

        // Jika tidak ada academic year aktif, return error
        if (!$activeAcademicYear) {
            return Response::error("No active academic year found");
        }

        $academicYearId = $activeAcademicYear->id;

        $query = Schedule::with([
                'subject:id,name,code,description',
                'teacher:id,full_name,gender,degree,photo',
                'classroom:id,name,room_number,capacity,description',
                'teacher_attendances:id,schedule_id,type,created_at',
                'accomplishments:id,schedule_id,name,type'
            ])
            ->where('academic_year_id', $academicYearId)
            ->where('is_completed', false)
           ->whereDate('date', '<', Carbon::today())
            ->orderBy('date', 'desc')
            ->orderBy('start_time', 'desc');

        // Filter by teacher_id untuk teacher atau jika admin memilih teacher tertentu
        if ($isTeacher) {
            $query->where('teacher_id', $teacherId);

           $query->whereHas('teacher_attendances', function ($q) {
                $q->where('type', 'check_in');
            })->whereHas('teacher_attendances', function ($q) {
                $q->where('type', 'check_out');
            });

        }


        // Filter tambahan berdasarkan tanggal jika diperlukan
        if ($request->has('start_date')) {
            $query->whereDate('date', '>=', $request->query('start_date'));
        }
        
        if ($request->has('end_date')) {
            $query->whereDate('date', '<=', $request->query('end_date'));
        }

        // Filter berdasarkan status kehadiran jika diperlukan
        if ($request->has('has_attendance')) {
            if ($request->query('has_attendance') == 'true') {
                $query->whereHas('teacher_attendances');
            } else {
                $query->whereDoesntHave('teacher_attendances');
            }
        }

        $schedules = $query->get();

        $schedules = $query->get()->map(function ($item) {
            $item->date = Carbon::parse($item->date)->translatedFormat('d M Y');
            return $item;
        });


        // Format response data
        $responseData = [
            'academic_year' => [
                'id' => $activeAcademicYear->id,
                'name' => $activeAcademicYear->name,
                'periode' => $activeAcademicYear->periode,
                'start_periode' => $activeAcademicYear->start_periode,
                'end_periode' => $activeAcademicYear->end_periode,
                'is_active' => $activeAcademicYear->is_active,
            ],
            'schedules' => $schedules,
            'count' => $schedules->count(),
            'filters' => [
                'is_completed' => false,
                'teacher_id' => $isTeacher ? $teacherId : ($teacherId ?? 'all'),
                'has_attendance' => $request->query('has_attendance')
            ]
        ];

        // Tambahkan teacher data jika spesifik teacher
        if ($isTeacher) {
            $responseData['teacher'] = $this->getTeacherData($user->teacher);
        }

        return Response::success('Incomplete schedules loaded successfully!', 200, $responseData);
    }

   

    /**
     * Update schedule completion status
     */
    public function updateAttandanceTeacher(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:present,absent,late,sick,permission',
            'notes' => 'nullable',
            'schedule_id' => 'required|uuid',
            'is_completed' => 'required|boolean',
        ]);

        if ($validator->fails()) {
            return Response::badRequest('Bad Request!', [
                "errors" => $validator->errors()
            ]);
        }

        $schedule = Schedule::whereHas('academicYear', function ($query) {
            $query->where(
                'instance_id',
                Auth::user()->teacher->instance_id
            );
        })->find($request->schedule_id);
        
        if (!$schedule) {
            return Response::error("Schedule not found");
        }


        // Cek apakah user memiliki akses untuk mengupdate schedule ini
        $user = Auth::user();
        $isAdmin = $user->role === 'admin';
        $isTeacher = $user->role === 'teacher';

        if ($isTeacher) {
            // Teacher hanya bisa mengupdate schedule miliknya sendiri
            return Response::error("Unauthorized role");
        } 

        // Data dasar untuk attendance
        $attendanceData = [
            'teacher_id'    => $schedule->teacher->id,
            'schedule_id'   => $schedule->id,
            'status'        => $request->status,
            'longitude'     => null,
            'latitude'      => null,
            'real_time_photo' => null,
            'gmaps'         => null,
            'notes'         => $request->notes,
        ];

        DB::transaction(function () use ($attendanceData, $schedule, $request) {
            foreach (['check_in', 'check_out'] as $type) {
                TeacherAttendance::updateOrCreate(
                    [
                        'teacher_id' => $attendanceData['teacher_id'],
                        'schedule_id' => $attendanceData['schedule_id'],
                        'type' => $type,
                    ],
                    array_merge($attendanceData, ['type' => $type])
                );
            }

            if ($request->boolean('is_completed')) {
                $schedule->markCompleted();
            } else {
                $schedule->markScheduled();
            }
        });

        $message = "Check-in and check-out recorded successfully!";

        $message = $request->is_completed 
            ? $message . " Schedule marked as completed!" 
            : $message . " Schedule marked as incomplete!";

        return Response::success($message, 200, $schedule);
    }
    /**
     * Mark multiple schedules as completed
     */
    public function markMultipleAsCompleted(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'schedule_ids' => 'required|array',
            'schedule_ids.*' => 'uuid|exists:schedules,id',
            'is_completed' => 'required|boolean'
        ]);

        if ($validator->fails()) {
            return Response::badRequest('Bad Request!', [
                "errors" => $validator->errors()
            ]);
        }

        $user = Auth::user();
        $isAdmin = $user->role === 'admin';
        $isTeacher = $user->role === 'teacher';

        $query = Schedule::whereIn('id', $request->schedule_ids);

        // Teacher hanya bisa mengupdate schedule miliknya sendiri
        if ($isTeacher) {
            $query->where('teacher_id', $user->teacher->id);
        } elseif (!$isAdmin) {
            return Response::error("Unauthorized role");
        }

        $schedules = $query->get();

        if ($schedules->isEmpty()) {
            return Response::error("No schedules found or unauthorized");
        }

        $updatedCount = $query->update([
            'is_completed' => $request->is_completed,
            'status' => $request->is_completed ? 'completed' : 'scheduled',
            'completed_at' => $request->is_completed ? now() : null
        ]);

        $message = $request->is_completed
            ? "{$updatedCount} schedules marked as completed!"
            : "{$updatedCount} schedules marked as incomplete!";

        return Response::success($message, 200, [
            'updated_count' => $updatedCount
        ]);
    }
}
