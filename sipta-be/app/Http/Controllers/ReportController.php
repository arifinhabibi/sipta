<?php

namespace App\Http\Controllers;

use App\Models\Classroom;
use App\Models\Student;
use App\Models\TeacherAttendance;
use App\Models\Teacher;
use App\Models\AcademicYear;
use App\Models\StudentAttendance;
use App\Models\StudentAccomplishment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Response;
use App\Exports\TeacherAttendanceExport;
use Maatwebsite\Excel\Facades\Excel;
use App\Models\StudentClassroomPlacement;
// use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use App\Services\PerformanceScoreService;


class ReportController extends Controller
{
    private $performanceScoreService;

    public function __construct(PerformanceScoreService $performanceScoreService)
    {
        $this->performanceScoreService = $performanceScoreService;
    }
    /**
     * Get teacher attendance data
     */
    public function attendancesTeacher(Request $request)
    {
        $request->validate([
            'start_date' => 'required|date_format:Y-m-d',
            'end_date' => 'required|date_format:Y-m-d|after_or_equal:start_date',
            'teacher_id' => 'nullable|exists:teachers,id',
            'academic_year_id' => 'nullable|exists:academic_years,id'
        ]);

        $user = Auth::user();
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');
        $requestedTeacherId = $request->query('teacher_id');
        $requestedAcademicYearId = $request->query('academic_year_id');

        $isAdmin = $user->role === 'admin';
        $isTeacher = $user->role === 'teacher';

        if ($isTeacher) {
            $user->load('teacher.instance.academicYears');

            $teacherId = $user->teacher->id;
            $teacherData = $this->getTeacherData($user->teacher);

            // Menggunakan helper yang diperbarui
            $activeAcademicYear = $this->getActiveAcademicYearFromUser($user);

            $instanceData = $user->teacher->instance ?
                collect($user->teacher->instance->toArray())->except('academic_years')->toArray() : null;
        } else if ($isAdmin) {
            if ($requestedTeacherId) {
                $teacher = Teacher::with('instance.academicYears')->find($requestedTeacherId);
                if (!$teacher) {
                    return Response::error("Teacher not found");
                }
                $teacherId = $teacher->id;
                $teacherData = $this->getTeacherData($teacher);

                // Menggunakan helper yang diperbarui
                $activeAcademicYear = $this->getActiveAcademicYearFromUser(null, $teacher);

                $instanceData = $teacher->instance ?
                    collect($teacher->instance->toArray())->except('academic_years')->toArray() : null;
            } else {
                $teacherId = null;
                $teacherData = null;

                if ($requestedAcademicYearId) {
                    $activeAcademicYear = AcademicYear::where(
                        'instance_id',
                        $user->teacher->instance_id
                    )->find($requestedAcademicYearId);
                    if (!$activeAcademicYear) {
                        return Response::error("Academic year not found");
                    }
                } else {
                    // Menggunakan helper yang diperbarui untuk admin
                    $activeAcademicYear = $this->getActiveAcademicYearFromUser($user);
                }

                $instanceData = null;
            }
        } else {
            return Response::error("Unauthorized role");
        }

        if (!$activeAcademicYear) {
            return Response::error("No active academic year found");
        }

        $query = TeacherAttendance::with([
            'teacher',
            'schedule.subject',
            'schedule.classroom'
        ])->whereHas('schedule', function ($q) use ($activeAcademicYear) {
            $q->where('academic_year_id', $activeAcademicYear->id);
        });

        if ($isTeacher || ($isAdmin && $teacherId)) {
            $query->where('teacher_id', $teacherId);
        }

        // Filter berdasarkan date range
        $query->whereBetween('created_at', [
            $startDate . ' 00:00:00',
            $endDate . ' 23:59:59'
        ]);

        $attendances = $query->orderBy('created_at', 'desc')->get();

        $formattedData = $attendances->map(function ($attendance) {
            return [
                'id' => $attendance->id,
                'teacher_id' => $attendance->teacher_id,
                'teacher_name' => $attendance->teacher->full_name ?? 'N/A',
                'schedule_id' => $attendance->schedule_id,
                'schedule_date' => $attendance->schedule->date ?? 'N/A',
                'subject_name' => $attendance->schedule->subject->name ?? 'N/A',
                'classroom_name' => $attendance->schedule->classroom->name ?? 'N/A',
                'schedule_time' => $attendance->schedule ?
                    $attendance->schedule->start_time . ' - ' . $attendance->schedule->end_time : 'N/A',
                'type' => $attendance->type,
                'status' => $attendance->status,
                'longitude' => $attendance->longitude,
                'latitude' => $attendance->latitude,
                'real_time_photo' => $attendance->real_time_photo,
                'gmaps' => $attendance->gmaps,
                'created_at' => $attendance->created_at->format('Y-m-d H:i:s'),
                'updated_at' => $attendance->updated_at->format('Y-m-d H:i:s'),
            ];
        });

        $summary = [
            'total_attendances' => $attendances->count(),
            'present_count' => $attendances->where('status', 'present')->count(),
            'absent_count' => $attendances->where('status', 'absent')->count(),
            'late_count' => $attendances->where('status', 'late')->count(),
            'sick_count' => $attendances->where('status', 'sick')->count(),
            'permission_count' => $attendances->where('status', 'permission')->count(),
            'check_in_count' => $attendances->where('type', 'check_in')->count(),
            'check_out_count' => $attendances->where('type', 'check_out')->count(),
        ];

        $responseData = [
            'date_range' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
            'user_role' => $user->role,
            'academic_year' => [
                'id' => $activeAcademicYear->id,
                'name' => $activeAcademicYear->name,
                'periode' => $activeAcademicYear->periode,
                'start_periode' => $activeAcademicYear->start_periode,
                'end_periode' => $activeAcademicYear->end_periode,
                'is_active' => $activeAcademicYear->is_active,
            ],
            'summary' => $summary,
            'attendances' => $formattedData,
        ];

        if ($teacherData) {
            $responseData['teacher'] = $teacherData;
        }

        if ($instanceData) {
            $responseData['instance'] = $instanceData;
        }

        return Response::success('Data has been loaded', 200, $responseData);
    }

  /**
     * Export teacher attendance report to Excel
     * Hanya mengambil data dengan type = 'check_in'
     */
    public function exportAttendancesTeacher(Request $request)
    {
        $request->validate([
            'start_date' => 'required|date_format:Y-m-d',
            'end_date' => 'required|date_format:Y-m-d|after_or_equal:start_date',
            'teacher_id' => 'nullable|exists:teachers,id',
            'academic_year_id' => 'nullable|exists:academic_years,id'
        ]);

        $user = Auth::user();
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');
        $requestedTeacherId = $request->query('teacher_id');
        $requestedAcademicYearId = $request->query('academic_year_id');

        $isAdmin = $user->role === 'admin';
        $isTeacher = $user->role === 'teacher';

        if ($isTeacher) {
            $user->load('teacher.instance.academicYears');
            $teacherId = $user->teacher->id;
            $teacherName = $user->teacher->full_name;
            $activeAcademicYear = $this->getActiveAcademicYearFromUser($user);
        } else if ($isAdmin) {
            if ($requestedTeacherId) {
                $teacher = Teacher::find($requestedTeacherId);
                if (!$teacher) {
                    return response()->json(['error' => 'Teacher not found'], 404);
                }
                $teacherId = $teacher->id;
                $teacherName = $teacher->full_name;
                $activeAcademicYear = $this->getActiveAcademicYearFromUser(null, $teacher);
            } else {
                $teacherId = null;
                $teacherName = null;
                if ($requestedAcademicYearId) {
                    $activeAcademicYear = AcademicYear::where(
                        'instance_id',
                        $user->teacher->instance_id
                    )->find($requestedAcademicYearId);
                    if (!$activeAcademicYear) {
                        return response()->json(['error' => 'Academic year not found'], 404);
                    }
                } else {
                    $activeAcademicYear = $this->getActiveAcademicYearFromUser($user);
                }
            }
        } else {
            return response()->json(['error' => 'Unauthorized role'], 403);
        }

        if (!$activeAcademicYear) {
            return response()->json(['error' => 'No active academic year found'], 404);
        }

        // Hanya ambil data dengan type = 'check_in'
        $query = TeacherAttendance::with(['teacher', 'schedule.subject', 'schedule.classroom'])
            ->where('type', 'check_in')
            ->whereHas('schedule', function ($q) use ($activeAcademicYear) {
                $q->where('academic_year_id', $activeAcademicYear->id);
            });

        if ($teacherId) {
            $query->where('teacher_id', $teacherId);
        }

        $query->whereBetween('created_at', [
            $startDate . ' 00:00:00',
            $endDate . ' 23:59:59'
        ]);

        $attendances = $query->orderBy('created_at', 'desc')->get();

        // Format data untuk export
        $exportData = $attendances->map(function ($attendance, $index) {
            $statusMap = [
                'present' => 'Hadir',
                'absent' => 'Absen',
                'late' => 'Terlambat',
                'sick' => 'Sakit',
                'permission' => 'Izin'
            ];
            $status = $statusMap[$attendance->status] ?? $attendance->status;

            // Format tanggal dari created_at (Y-m-d)
            $date = $attendance->created_at ? Carbon::parse($attendance->created_at)->format('Y-m-d') : '-';
            
            // Waktu check_in dari created_at (format H:i) - hanya untuk status Hadir/Terlambat
            $checkInTime = $attendance->created_at ? Carbon::parse($attendance->created_at)->format('H:i') : '-';
            
            // Format schedule_time untuk menentukan sesi
            $scheduleTime = 'N/A';
            if ($attendance->schedule) {
                $startTime = $attendance->schedule->start_time ?? '';
                $endTime = $attendance->schedule->end_time ?? '';
                if ($startTime && $endTime) {
                    $scheduleTime = $startTime . ' - ' . $endTime;
                } elseif ($startTime) {
                    $scheduleTime = $startTime;
                }
            }

            return [
                'no' => $index + 1,
                'teacher_id' => $attendance->teacher_id,
                'schedule_id' => $attendance->schedule_id,
                'teacher_name' => $attendance->teacher->full_name ?? 'N/A',
                'type' => $attendance->type,
                'date' => $date,
                'check_in_time' => $checkInTime,
                'status' => $status,
                'schedule_time' => $scheduleTime,
            ];
        });

        // Hitung summary
        $summary = [
            'total_attendances' => $attendances->count(),
            'present_count' => $attendances->where('status', 'present')->count(),
            'absent_count' => $attendances->where('status', 'absent')->count(),
            'late_count' => $attendances->where('status', 'late')->count(),
            'sick_count' => $attendances->where('status', 'sick')->count(),
            'permission_count' => $attendances->where('status', 'permission')->count(),
        ];

        $start = Carbon::parse($startDate);
        $end = Carbon::parse($endDate);
        $filename = 'laporan-absensi-guru' . 
                    ($teacherName ? '-' . preg_replace('/[^a-zA-Z0-9]/', '_', $teacherName) : '') . 
                    '-' . $start->format('Ymd') . '-' . $end->format('Ymd') . '.xlsx';

        return Excel::download(
            new TeacherAttendanceExport(
                $exportData,
                $startDate,
                $endDate,
                $activeAcademicYear->name,
                $teacherName,
                $summary
            ),
            $filename
        );
    }

   
     public function performanceStudents(Request $request, $classroomId)
    {
        $user = Auth::user();

        // ===============================
        // 1. Ambil academic year aktif
        // ===============================
        $activeAcademicYear = $this->getActiveAcademicYearFromUser($user);

        if (!$activeAcademicYear) {
            return Response::error('No active academic year found');
        }

        // ===============================
        // 2. Ambil classroom berdasarkan ID
        // ===============================
        $classroom = Classroom::with(['teacher'])->find($classroomId); // Hapus 'students' dari with
        
        if (!$classroom) {
            return Response::error('Classroom not found');
        }

        // Check authorization untuk teacher
        if ($user->role === 'teacher') {
            if ($classroom->teacher_id !== $user->teacher->id) {
                return Response::error('You are not authorized to view this classroom');
            }
        }

        // ===============================
        // 3. Ambil students dari StudentClassroomPlacement
        // ===============================
        $placements = StudentClassroomPlacement::with('student')
            ->where('classroom_id', $classroomId)
            ->where('academic_year_id', $activeAcademicYear->id)
            ->get();

        $students = $placements->pluck('student')
                    ->filter(function($student) {
                        return $student && $student->status === 'active';
                    });

        if ($students->isEmpty()) {
            return Response::success('No students found in this classroom for current academic year', 200, [
                'classroom' => [
                    'id' => $classroom->id,
                    'name' => $classroom->name,
                    'teacher' => [
                        'id' => $classroom->teacher->id ?? null,
                        'full_name' => $classroom->teacher->fullname ?? null
                    ]
                ],
                'academic_year' => [
                    'id' => $activeAcademicYear->id,
                    'name' => $activeAcademicYear->name,
                    'periode' => $activeAcademicYear->periode
                ],
                'summary' => [
                    'total_students' => 0,
                    'average_final_score' => 0,
                    'top_student' => null
                ],
                'students' => []
            ]);
        }

        $studentsData = [];

        // ===============================
        // 4. Loop melalui setiap student
        // ===============================
        foreach ($students as $student) {
            // ===============================
            // 5. Attendance per student (by academic year)
            // ===============================
            $attendances = StudentAttendance::with([
                'schedule',
                'schedule.subject'
            ])
            ->where('student_id', $student->id)
            ->whereHas('schedule', function ($q) use ($activeAcademicYear, $classroomId) {
                $q->where('academic_year_id', $activeAcademicYear->id);
                $q->where('classroom_id', $classroomId);
            })
            ->get();

            $attendanceData = [];
            $presentCount = 0;
            $totalAttendance = $attendances->count();

            // Bucket nilai
            $scoreBucket = [
                'knowledge' => [],
                'creativity1' => [],
                'creativity2' => [],
                'attitude'    => [],
                'skill'       => []
            ];

            foreach ($attendances as $attendance) {
                if ($attendance->status === 'present') {
                    $presentCount++;
                }

                // ===============================
                // 6. Accomplishment via accomplishment.schedule
                // ===============================
                $accomplishments = StudentAccomplishment::with('accomplishment')
                    ->where('student_id', $student->id)
                    ->whereHas('accomplishment', function ($q) use ($attendance) {
                        $q->where('schedule_id', $attendance->schedule_id);
                    })
                    ->get();

                $accomplishmentData = [];

                foreach ($accomplishments as $item) {
                    if (!$item->accomplishment) {
                        continue;
                    }

                $type = $item->accomplishment->type;

                    // Override type: jika skill dan subject mengandung UTS -> creativity1, jika UAS -> creativity2
                    $subjectName = $attendance->schedule->subject->name ?? '';
                    if ($type === 'skill') {
                        if (stripos($subjectName, 'UTS') !== false) {
                            $type = 'creativity1';
                        } elseif (stripos($subjectName, 'UAS') !== false) {
                            $type = 'creativity2';
                        }
                    }

                    $accomplishmentData[] = [
                        'id'         => $item->id,
                        'name'       => $item->accomplishment->name,
                        'type'       => $type,
                        'score'      => (int) $item->score,
                        'is_capable' => (bool) $item->is_capable
                    ];

                    if (isset($scoreBucket[$type])) {
                        $scoreBucket[$type][] = $item->score;
                    }
                }

                if (!$attendance->schedule || !$attendance->schedule->subject) {
                    continue;
                }

                // $attendanceData[] = [
                //     'status'   => $attendance->status,
                //     'schedule' => [
                //         'id'         => $attendance->schedule->id,
                //         'date'       => $attendance->schedule->date,
                //         'start_time' => $attendance->schedule->start_time,
                //         'end_time'   => $attendance->schedule->end_time,
                //         'subject'    => [
                //             'id'   => $attendance->schedule->subject->id,
                //             'name' => $attendance->schedule->subject->name,
                //             'accomplishments' => $accomplishmentData
                //         ]
                //     ]
                // ];
            }

            // ===============================
            // 7. Attendance percentage
            // ===============================
            $attendancePercentage = $totalAttendance > 0
                ? round(($presentCount / $totalAttendance) * 100, 2)
                : 0;

            // ===============================
            // 8. Average score per type
            // ===============================
            $avg = function ($scores) {
                return count($scores) > 0 ? array_sum($scores) / count($scores) : 0;
            };

            $avgScores = [
                'knowledge' => $avg($scoreBucket['knowledge']),
                'creativity1' => $avg($scoreBucket['creativity1']),
                'creativity2' => $avg($scoreBucket['creativity2']),
                'attitude'    => $avg($scoreBucket['attitude']),
                'skill'       => $avg($scoreBucket['skill']),
            ];

            // ===============================
            // 9. Final score
            // ===============================
            $finalScore = $this->performanceScoreService->calculate(
                $attendancePercentage,
                $avgScores
            );

            $studentsData[] = [
                'id'        => $student->id,
                'fullname' => $student->fullname,
                // 'attendances' => $attendanceData,
                'summary' => [
                    'attendance_percentage' => $attendancePercentage,
                    'final_score' => round($finalScore, 2),
                    'average_scores' => [
                        'knowledge' => round($avgScores['knowledge'], 2),
                        'creativity1' => round($avgScores['creativity1'], 2),
                        'creativity2' => round($avgScores['creativity2'], 2),
                        'attitude'    => round($avgScores['attitude'], 2),
                        'skill'       => round($avgScores['skill'], 2)
                    ]
                ]
            ];
        }

        // ===============================
        // 10. Ranking untuk classroom ini saja
        // ===============================
        usort($studentsData, function ($a, $b) {
            return $b['summary']['final_score'] <=> $a['summary']['final_score'];
        });

        foreach ($studentsData as $i => $student) {
            $studentsData[$i]['summary']['rank'] = $i + 1;
        }

        $response = [
            'classroom' => [
                'id'      => $classroom->id,
                'name'    => $classroom->name,
                'teacher' => [
                    'id' => $classroom->teacher->id ?? null,
                    'full_name' => $classroom->teacher->fullname ?? null
                ]
            ],
            'academic_year' => [
                'id' => $activeAcademicYear->id,
                'name' => $activeAcademicYear->name,
                'periode' => $activeAcademicYear->periode
            ],
            'summary' => [
                'total_students' => count($studentsData),
                'average_final_score' => count($studentsData) > 0 
                    ? round(collect($studentsData)->avg(function($student) {
                        return $student['summary']['final_score'];
                    }), 2)
                    : 0,
                'top_student' => count($studentsData) > 0 ? [
                    'id' => $studentsData[0]['id'],
                    'fullname' => $studentsData[0]['fullname'],
                    'final_score' => $studentsData[0]['summary']['final_score']
                ] : null
            ],
            'students' => $studentsData
        ];

        // Log::info('Performance Students Response for Classroom ID: ' . $classroomId, [
        //     'total_students' => count($studentsData),
        //     'classroom_name' => $classroom->name
        // ]);

        return Response::success('Data has been loaded', 200, $response);
    }

    public function performanceStudentsByStudent(Request $request, $studentId)
    {
        $user = Auth::user();

        // ===============================
        // 1. Ambil academic year aktif
        // ===============================
        $activeAcademicYear = $this->getActiveAcademicYearFromUser($user);

        if (!$activeAcademicYear) {
            return Response::error('No active academic year found');
        }

        // ===============================
        // 2. Ambil student berdasarkan ID
        // ===============================
        $student = Student::find($studentId);
        
        if (!$student) {
            return Response::error('Student not found');
        }

        // ===============================
        // 3. Ambil classroom placement student
        // ===============================
        $placement = StudentClassroomPlacement::with('classroom.teacher')
            ->where('student_id', $studentId)
            ->where('academic_year_id', $activeAcademicYear->id)
            ->first();

        if (!$placement) {
            return Response::error('Student is not placed in any classroom for current academic year');
        }

        $classroom = $placement->classroom;

        // Check authorization untuk teacher
        if ($user->role === 'teacher') {
            if ($classroom->teacher_id !== $user->teacher->id) {
                return Response::error('You are not authorized to view this student');
            }
        }

        // ===============================
        // 4. Attendance student (by academic year)
        // ===============================
        $attendances = StudentAttendance::with([
            'schedule',
            'schedule.subject'
        ])
        ->where('student_id', $student->id)
        ->whereHas('schedule', function ($q) use ($activeAcademicYear, $classroom) {
            $q->where('academic_year_id', $activeAcademicYear->id);
            $q->where('classroom_id', $classroom->id);
        })
        ->orderBy('created_at', 'desc')
        ->get();

        $attendanceData = [];
        $presentCount = 0;
        $totalAttendance = $attendances->count();

        // Bucket nilai
        $scoreBucket = [
            'knowledge' => [],
            'creativity1' => [],
            'creativity2' => [],
            'attitude'    => [],
            'skill'       => []
        ];

        foreach ($attendances as $attendance) {
            if ($attendance->status === 'present') {
                $presentCount++;
            }

            // ===============================
            // 5. Accomplishment via accomplishment.schedule
            // ===============================
            $accomplishments = StudentAccomplishment::with('accomplishment')
                ->where('student_id', $student->id)
                ->whereHas('accomplishment', function ($q) use ($attendance) {
                    $q->where('schedule_id', $attendance->schedule_id);
                })
                ->get();

            $accomplishmentData = [];

            foreach ($accomplishments as $item) {
                if (!$item->accomplishment) {
                    continue;
                }

                $type = $item->accomplishment->type;

                    // Override type: jika skill dan subject mengandung UTS -> creativity1, jika UAS -> creativity2
                    $subjectName = $attendance->schedule->subject->name ?? '';
                    if ($type === 'skill') {
                        if (stripos($subjectName, 'UTS') !== false) {
                            $type = 'creativity1';
                        } elseif (stripos($subjectName, 'UAS') !== false) {
                            $type = 'creativity2';
                        }
                    }

                    $accomplishmentData[] = [
                    'id'         => $item->id,
                    'name'       => $item->accomplishment->name,
                    'type'       => $type,
                    'score'      => (int) $item->score,
                    'is_capable' => (bool) $item->is_capable
                ];

                if (isset($scoreBucket[$type])) {
                    $scoreBucket[$type][] = $item->score;
                }
            }

            if (!$attendance->schedule || !$attendance->schedule->subject) {
                continue;
            }
            
            $attendanceData[] = [
                'id'         => $attendance->id,
                'status'     => $attendance->status,
                'created_at' => $attendance->created_at->format('Y-m-d H:i:s'),
                'schedule'   => [
                    'id'         => $attendance->schedule->id,
                    'date'       => $attendance->schedule->date,
                    'start_time' => $attendance->schedule->start_time,
                    'end_time'   => $attendance->schedule->end_time,
                    'subject'    => [
                        'id'   => $attendance->schedule->subject->id,
                        'name' => $attendance->schedule->subject->name,
                        'accomplishments' => $accomplishmentData
                    ]
                ]
            ];
        }

        // ===============================
        // 6. Attendance percentage
        // ===============================
        $attendancePercentage = $totalAttendance > 0
            ? round(($presentCount / $totalAttendance) * 100, 2)
            : 0;

        // ===============================
        // 7. Average score per type
        // ===============================
        $avg = function ($scores) {
            return count($scores) > 0 ? array_sum($scores) / count($scores) : 0;
        };

        $avgScores = [
            'knowledge' => $avg($scoreBucket['knowledge']),
            'creativity1' => $avg($scoreBucket['creativity1']),
            'creativity2' => $avg($scoreBucket['creativity2']),
            'attitude'    => $avg($scoreBucket['attitude']),
            'skill'       => $avg($scoreBucket['skill']),
        ];

        // ===============================
        // 8. Final score
        // ===============================
        $finalScore = $this->performanceScoreService->calculate(
            $attendancePercentage,
            $avgScores
        );

        // ===============================
        // 9. Response
        // ===============================
        $response = [
            'student' => [
                'id'        => $student->id,
                'fullname'  => $student->fullname,
                'gender'    => $student->gender ?? null,
                'birth_date' => $student->birth_date ?? null,
                'phone'     => $student->phone ?? null,
                'address'   => $student->address ?? null,
                'photo'     => $student->photo ?? null,
                'status'    => $student->status ?? null,
            ],
            'classroom' => [
                'id'      => $classroom->id,
                'name'    => $classroom->name,
                'teacher' => [
                    'id' => $classroom->teacher->id ?? null,
                    'full_name' => $classroom->teacher->fullname ?? null
                ]
            ],
            'academic_year' => [
                'id' => $activeAcademicYear->id,
                'name' => $activeAcademicYear->name,
                'periode' => $activeAcademicYear->periode
            ],
            'summary' => [
                'total_attendance' => $totalAttendance,
                'present_count' => $presentCount,
                'attendance_percentage' => $attendancePercentage,
                'final_score' => round($finalScore, 2),
                'average_scores' => [
                    'knowledge' => round($avgScores['knowledge'], 2),
                    'creativity1' => round($avgScores['creativity1'], 2),
                    'creativity2' => round($avgScores['creativity2'], 2),
                    'attitude'    => round($avgScores['attitude'], 2),
                    'skill'       => round($avgScores['skill'], 2)
                ]
            ],
            'attendances' => $attendanceData
        ];

        return Response::success('Student performance data has been loaded', 200, $response);
    }

    public function exportPerformanceStudentPdf(Request $request, $studentId)
    {
        $user = Auth::user();

        // ===============================
        // 1. Ambil academic year aktif
        // ===============================
        $activeAcademicYear = $this->getActiveAcademicYearFromUser($user);

        if (!$activeAcademicYear) {
            return Response::error('No active academic year found');
        }

        // ===============================
        // 2. Ambil student berdasarkan ID
        // ===============================
        $student = Student::find($studentId);

        if (!$student) {
            return Response::error('Student not found');
        }

        // ===============================
        // 3. Ambil classroom placement student
        // ===============================
        $placement = StudentClassroomPlacement::with(['classroom.teacher', 'classroom.instance'])
            ->where('student_id', $studentId)
            ->where('academic_year_id', $activeAcademicYear->id)
            ->first();

        if (!$placement) {
            return Response::error('Student is not placed in any classroom for current academic year');
        }

        $classroom = $placement->classroom;

        // Check authorization untuk teacher
        if ($user->role === 'teacher') {
            if ($classroom->teacher_id !== $user->teacher->id) {
                return Response::error('You are not authorized to view this student');
            }
        }

        $instance = null;
        if ($classroom->instance) {
            $instance = $classroom->instance;
        } elseif ($user->role === 'teacher' && $user->teacher && $user->teacher->instance) {
            $instance = $user->teacher->instance;
        }

        // ===============================
        // 4. Attendance student (by academic year) - using JOIN for ordering
        // ===============================
        $attendances = StudentAttendance::select('student_attendances.*')
            ->join('schedules', 'student_attendances.schedule_id', '=', 'schedules.id')
            ->with([
                'schedule',
                'schedule.subject'
            ])
            ->where('student_attendances.student_id', $student->id)
            ->where('schedules.academic_year_id', $activeAcademicYear->id)
            ->where('schedules.classroom_id', $classroom->id)
            ->orderBy('schedules.date', 'asc')
            ->get();

        $presentCount = 0;
        $totalAttendance = $attendances->count();

        // Bucket nilai berdasarkan tipe
        $scoreBucket = [
            'knowledge' => [],
            'creativity1' => [],
            'creativity2' => [],
            'attitude'    => [],
            'skill'       => []
        ];

        $attendanceDetails = [];

        foreach ($attendances as $attendance) {
            if ($attendance->status === 'present') {
                $presentCount++;
            }

            // Ambil accomplishments untuk attendance ini
            $accomplishments = StudentAccomplishment::with('accomplishment')
                ->where('student_id', $student->id)
                ->whereHas('accomplishment', function ($q) use ($attendance) {
                    $q->where('schedule_id', $attendance->schedule_id);
                })
                ->get();

            $accomplishmentData = [];

            foreach ($accomplishments as $item) {
                if (!$item->accomplishment) {
                    continue;
                }

                $type = $item->accomplishment->type;

                // Override type: jika skill dan subject mengandung UTS -> creativity1, jika UAS -> creativity2
                $subjectName = $attendance->schedule->subject->name ?? '';
                if ($type === 'skill') {
                    if (stripos($subjectName, 'UTS') !== false) {
                        $type = 'creativity1';
                    } elseif (stripos($subjectName, 'UAS') !== false) {
                        $type = 'creativity2';
                    }
                }

                // Mapping type dari accomplishments ke bucket
                $bucketKey = null;
                if ($type === 'creativity1' || $type === 'creativity') {
                    $bucketKey = 'creativity1';
                } elseif ($type === 'creativity2') {
                    $bucketKey = 'creativity2';
                } elseif ($type === 'attitude') {
                    $bucketKey = 'attitude';
                } elseif ($type === 'skill') {
                    $bucketKey = 'skill';
                } elseif ($type === 'knowledge') {
                    $bucketKey = 'knowledge';
                }

                if ($bucketKey && $item->score !== null) {
                    $scoreBucket[$bucketKey][] = (int) $item->score;
                }

                $accomplishmentData[] = [
                    'id'         => $item->id,
                    'name'       => $item->accomplishment->name,
                    'type'       => $type,
                    'score'      => $item->score,
                    'is_capable' => $item->is_capable,
                ];
            }

            if ($attendance->schedule && $attendance->schedule->subject) {
                $attendanceDetails[] = [
                    'date'           => $attendance->schedule->date,
                    'subject'        => $attendance->schedule->subject->name,
                    'status'         => $attendance->status,
                    'accomplishments' => $accomplishmentData,
                ];
            }
        }

        // ===============================
        // 5. Attendance percentage
        // ===============================
        $attendancePercentage = $totalAttendance > 0
            ? round(($presentCount / $totalAttendance) * 100, 2)
            : 0;

        $attendanceSummary = [
            'total'      => $totalAttendance,
            'present'    => $presentCount,
            'absent'     => $attendances->where('status', 'absent')->count(),
            'sick'       => $attendances->where('status', 'sick')->count(),
            'permission' => $attendances->where('status', 'permission')->count(),
            'late'       => $attendances->where('status', 'late')->count(),
            'percentage' => $attendancePercentage,
        ];

        // ===============================
        // 6. Average score per type
        // ===============================
        $avg = function ($scores) {
            return count($scores) > 0 ? array_sum($scores) / count($scores) : 0;
        };

        $averageScores = [
            'knowledge' => round($avg($scoreBucket['knowledge']), 2),
            'creativity1' => round($avg($scoreBucket['creativity1']), 2),
            'creativity2' => round($avg($scoreBucket['creativity2']), 2),
            'attitude'    => round($avg($scoreBucket['attitude']), 2),
            'skill'       => round($avg($scoreBucket['skill']), 2),
        ];

        // ===============================
        // 7. Final score
        // ===============================
        $finalScore = $this->performanceScoreService->calculate(
            $attendancePercentage,
            $averageScores
        );

        // ===============================
        // 8. Rank di kelas
        // ===============================
        $rank = null;
        try {
            // Hitung ranking berdasarkan final score semua siswa di kelas yang sama
            $allPlacements = StudentClassroomPlacement::with('student')
                ->where('classroom_id', $classroom->id)
                ->where('academic_year_id', $activeAcademicYear->id)
                ->get();

            $allStudents = $allPlacements->pluck('student')->filter(function($s) {
                return $s && $s->status === 'active';
            });

            $allScores = [];
            foreach ($allStudents as $s) {
                if ($s->id === $student->id) {
                    $allScores[] = $finalScore;
                    continue;
                }

                // Hitung final score untuk setiap student
                $sAttendances = StudentAttendance::where('student_id', $s->id)
                    ->whereHas('schedule', function ($q) use ($activeAcademicYear, $classroom) {
                        $q->where('academic_year_id', $activeAcademicYear->id);
                        $q->where('classroom_id', $classroom->id);
                    })
                    ->get();

                $sPresent = $sAttendances->where('status', 'present')->count();
                $sTotal = $sAttendances->count();
                $sPerc = $sTotal > 0 ? ($sPresent / $sTotal) * 100 : 0;

                $sBucket = [
                    'knowledge' => [],
                    'creativity1' => [],
                    'creativity2' => [],
                    'attitude' => [],
                    'skill' => [],
                ];
                foreach ($sAttendances as $sa) {
                    $sAccs = StudentAccomplishment::with('accomplishment')
                        ->where('student_id', $s->id)
                        ->whereHas('accomplishment', function ($q) use ($sa) {
                            $q->where('schedule_id', $sa->schedule_id);
                        })
                        ->get();
                    foreach ($sAccs as $item) {
                        if (!$item->accomplishment || $item->score === null) continue;
                        $t = $item->accomplishment->type;
                        $bk = null;
                        if ($t === 'creativity1' || $t === 'creativity') $bk = 'creativity1';
                        elseif ($t === 'creativity2') $bk = 'creativity2';
                        elseif ($t === 'attitude') $bk = 'attitude';
                        elseif ($t === 'skill') $bk = 'skill';
                        elseif ($t === 'knowledge') $bk = 'knowledge';
                        if ($bk) $sBucket[$bk][] = (int) $item->score;
                    }
                }

                $sAvg = function ($scores) { return count($scores) > 0 ? array_sum($scores) / count($scores) : 0; };
                $sFinal = $this->performanceScoreService->calculate(
                    $sPerc,
                    [
                        'knowledge' => $sAvg($sBucket['knowledge']),
                        'creativity1' => $sAvg($sBucket['creativity1']),
                        'creativity2' => $sAvg($sBucket['creativity2']),
                        'attitude' => $sAvg($sBucket['attitude']),
                        'skill' => $sAvg($sBucket['skill']),
                    ]
                );

                $allScores[] = $sFinal;
            }

            rsort($allScores);
            $rank = array_search($finalScore, $allScores) + 1;
        } catch (\Exception $e) {
            $rank = null;
        }

        // ===============================
        // 9. Generate PDF
        // ===============================
        $data = [
            'student'             => $student,
            'classroom'           => $classroom,
            'academicYear'        => $activeAcademicYear,
            'instance'            => $instance,
            'attendanceSummary'   => $attendanceSummary,
            'averageScores'       => $averageScores,
            'finalScore'          => round($finalScore, 2),
            'rank'                => $rank,
            'attendanceDetails'   => $attendanceDetails,
        ];

        $pdf = \PDF::loadView('export.performance-student', $data);
        $pdf->setPaper('A4', 'portrait');

        $filename = 'laporan-perkembangan-' . $student->fullname . '-' . $activeAcademicYear->name . '.pdf';
        $filename = preg_replace('/[^a-zA-Z0-9\-\._]/', '_', $filename);

        return $pdf->download($filename);
    }

    /**
     * Classroom report - Perbaikan untuk mengambil students dari placement
     */
    public function classroomReport(Request $request, $classroomId)
    {
        $user = Auth::user();
        
        // Menggunakan helper yang diperbarui
        $activeAcademicYear = $this->getActiveAcademicYearFromUser($user);
        
        if (!$activeAcademicYear) {
            return Response::error('No active academic year found');
        }

        $classroom = Classroom::with(['teacher'])->find($classroomId); // Hapus 'students'
        
        if (!$classroom) {
            return Response::error('Classroom not found');
        }

        // Check teacher access
        if ($user->role === 'teacher' && $classroom->teacher_id !== $user->teacher->id) {
            return Response::error('You are not authorized to view this classroom');
        }

        $startDate = $request->query('start_date', $activeAcademicYear->start_periode);
        $endDate = $request->query('end_date', $activeAcademicYear->end_periode);

        // ===============================
        // Ambil students dari placement
        // ===============================
        $placements = StudentClassroomPlacement::with('student')
            ->where('classroom_id', $classroomId)
            ->where('academic_year_id', $activeAcademicYear->id)
            ->get();

        $students = $placements->pluck('student')->filter();

        // Query attendance untuk students ini
        $studentAttendances = StudentAttendance::with(['student'])
            ->whereIn('student_id', $students->pluck('id'))
            ->whereHas('schedule', function ($q) use ($classroomId, $activeAcademicYear, $startDate, $endDate) {
                $q->where('classroom_id', $classroomId)
                  ->where('academic_year_id', $activeAcademicYear->id)
                  ->whereBetween('date', [$startDate, $endDate]);
            })
            ->get()
            ->groupBy('student_id');

        $studentsData = [];
        foreach ($students as $student) {
            $attendances = $studentAttendances->get($student->id, collect());
            
            $studentsData[] = [
                'id' => $student->id,
                'fullname' => $student->fullname,
                'attendance_count' => $attendances->count(),
                'present_count' => $attendances->where('status', 'present')->count(),
                'attendance_percentage' => $attendances->count() > 0 
                    ? round(($attendances->where('status', 'present')->count() / $attendances->count()) * 100, 2)
                    : 0,
            ];
        }

        $responseData = [
            'classroom' => [
                'id' => $classroom->id,
                'name' => $classroom->name,
                'teacher' => $classroom->teacher,
            ],
            'academic_year' => [
                'id' => $activeAcademicYear->id,
                'name' => $activeAcademicYear->name,
                'periode' => $activeAcademicYear->periode,
            ],
            'date_range' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
            'students' => $studentsData,
            'summary' => [
                'total_students' => count($studentsData),
                'average_attendance' => count($studentsData) > 0 
                    ? round(collect($studentsData)->avg('attendance_percentage'), 2)
                    : 0,
            ],
        ];

        return Response::success('Classroom report loaded', 200, $responseData);
    }

    /**
     * Helper method untuk mendapatkan students dari placement
     */
    private function getStudentsFromPlacement($classroomId, $academicYearId)
    {
        $placements = StudentClassroomPlacement::with('student')
            ->where('classroom_id', $classroomId)
            ->where('academic_year_id', $academicYearId)
            ->get();
        
        return $placements->pluck('student')->filter()->values();
    }

    /**
     * Daily report for admin/teacher
     */
    public function dailyReport(Request $request)
    {
        $user = Auth::user();
        
        // Menggunakan helper yang diperbarui
        $activeAcademicYear = $this->getActiveAcademicYearFromUser($user);
        
        if (!$activeAcademicYear) {
            return Response::error('No active academic year found');
        }

        $date = $request->query('date', Carbon::today()->format('Y-m-d'));
        
        $filterInfo = $this->getFilterInfo('daily', $activeAcademicYear);
        
        // Query logic here...
        // Contoh:
        $teacherAttendances = TeacherAttendance::with(['teacher', 'schedule'])
            ->whereDate('created_at', $date)
            ->whereHas('schedule', function ($q) use ($activeAcademicYear) {
                $q->where('academic_year_id', $activeAcademicYear->id);
            })
            ->get();

        $studentAttendances = StudentAttendance::with(['student', 'schedule'])
            ->whereDate('created_at', $date)
            ->whereHas('schedule', function ($q) use ($activeAcademicYear) {
                $q->where('academic_year_id', $activeAcademicYear->id);
            })
            ->get();

        $responseData = [
            'report_date' => $date,
            'academic_year' => [
                'id' => $activeAcademicYear->id,
                'name' => $activeAcademicYear->name,
            ],
            'filter_info' => $filterInfo,
            'teacher_attendances' => [
                'total' => $teacherAttendances->count(),
                'present' => $teacherAttendances->where('status', 'present')->count(),
                'absent' => $teacherAttendances->where('status', 'absent')->count(),
            ],
            'student_attendances' => [
                'total' => $studentAttendances->count(),
                'present' => $studentAttendances->where('status', 'present')->count(),
                'absent' => $studentAttendances->where('status', 'absent')->count(),
            ],
        ];

        return Response::success('Daily report loaded', 200, $responseData);
    }

    /**
     * Weekly report for admin/teacher
     */
    public function weeklyReport(Request $request)
    {
        $user = Auth::user();
        
        // Menggunakan helper yang diperbarui
        $activeAcademicYear = $this->getActiveAcademicYearFromUser($user);
        
        if (!$activeAcademicYear) {
            return Response::error('No active academic year found');
        }

        $weekRange = $this->getWeekRange($activeAcademicYear);
        $filterInfo = $this->getFilterInfo('week', $activeAcademicYear);
        
        $startDate = $weekRange['start']->format('Y-m-d');
        $endDate = $weekRange['end']->format('Y-m-d');

        // Query logic here...
        $teacherAttendances = TeacherAttendance::with(['teacher', 'schedule'])
            ->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->whereHas('schedule', function ($q) use ($activeAcademicYear) {
                $q->where('academic_year_id', $activeAcademicYear->id);
            })
            ->get();

        $studentAttendances = StudentAttendance::with(['student', 'schedule'])
            ->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->whereHas('schedule', function ($q) use ($activeAcademicYear) {
                $q->where('academic_year_id', $activeAcademicYear->id);
            })
            ->get();

        $responseData = [
            'week_range' => [
                'start' => $startDate,
                'end' => $endDate,
            ],
            'academic_year' => [
                'id' => $activeAcademicYear->id,
                'name' => $activeAcademicYear->name,
            ],
            'filter_info' => $filterInfo,
            'teacher_attendances' => [
                'total' => $teacherAttendances->count(),
                'present' => $teacherAttendances->where('status', 'present')->count(),
                'absent' => $teacherAttendances->where('status', 'absent')->count(),
            ],
            'student_attendances' => [
                'total' => $studentAttendances->count(),
                'present' => $studentAttendances->where('status', 'present')->count(),
                'absent' => $studentAttendances->where('status', 'absent')->count(),
            ],
        ];

        return Response::success('Weekly report loaded', 200, $responseData);
    }

    /**
     * Monthly report for admin/teacher
     */
    public function monthlyReport(Request $request)
    {
        $user = Auth::user();
        
        // Menggunakan helper yang diperbarui
        $activeAcademicYear = $this->getActiveAcademicYearFromUser($user);
        
        if (!$activeAcademicYear) {
            return Response::error('No active academic year found');
        }

        $monthRange = $this->getMonthRange($activeAcademicYear);
        $filterInfo = $this->getFilterInfo('month', $activeAcademicYear);
        
        $month = $monthRange['month'];
        $year = $monthRange['year'];

        // Query logic here...
        $teacherAttendances = TeacherAttendance::with(['teacher', 'schedule'])
            ->whereMonth('created_at', $month)
            ->whereYear('created_at', $year)
            ->whereHas('schedule', function ($q) use ($activeAcademicYear) {
                $q->where('academic_year_id', $activeAcademicYear->id);
            })
            ->get();

        $studentAttendances = StudentAttendance::with(['student', 'schedule'])
            ->whereMonth('created_at', $month)
            ->whereYear('created_at', $year)
            ->whereHas('schedule', function ($q) use ($activeAcademicYear) {
                $q->where('academic_year_id', $activeAcademicYear->id);
            })
            ->get();

        $responseData = [
            'month' => $month,
            'year' => $year,
            'academic_year' => [
                'id' => $activeAcademicYear->id,
                'name' => $activeAcademicYear->name,
            ],
            'filter_info' => $filterInfo,
            'teacher_attendances' => [
                'total' => $teacherAttendances->count(),
                'present' => $teacherAttendances->where('status', 'present')->count(),
                'absent' => $teacherAttendances->where('status', 'absent')->count(),
            ],
            'student_attendances' => [
                'total' => $studentAttendances->count(),
                'present' => $studentAttendances->where('status', 'present')->count(),
                'absent' => $studentAttendances->where('status', 'absent')->count(),
            ],
        ];

        return Response::success('Monthly report loaded', 200, $responseData);
    }

    public function updatePerformanceStudent(Request $request, $studentId)
    {
        $user = Auth::user();

        // Hanya admin atau teacher yang boleh mengakses
        if (!in_array($user->role, ['admin', 'teacher'])) {
            return Response::error('Unauthorized', 403);
        }

        // Validasi input
        $validator = Validator::make($request->all(), [
            'accomplishmentStudentId' =>
                'required|uuid|exists:student_accomplishments,id',
            'newScore' => 'required|numeric|min:0|max:100',
            'isCapable' => 'sometimes|boolean'
        ]);

        if ($validator->fails()) {
            return Response::error('Validasi penilaian gagal.', 422, $validator->errors());
            
        }

        $activeAcademicYear = $this->getActiveAcademicYearFromUser($user);
        if (!$activeAcademicYear) {
            return Response::error('No active academic year found', 422);
        }

        $instanceId = $user->teacher->instance_id;
        $accomplishmentStudent = StudentAccomplishment::where(
            'student_id',
            $studentId
        )
            ->whereHas('accomplishment.schedule', function ($query) use ($activeAcademicYear, $instanceId) {
                $query->where('academic_year_id', $activeAcademicYear->id)
                    ->whereHas('classroom', function ($classroomQuery) use ($instanceId) {
                        $classroomQuery->where('instance_id', $instanceId);
                    });
            })
            ->with('accomplishment')
            ->find($request->accomplishmentStudentId);

        if (!$accomplishmentStudent) {
            return Response::error(
                'Assessment tidak ditemukan untuk siswa dan tahun akademik ini.',
                404
            );
        }

        // Update data
        $accomplishmentStudent->score = $request->input('newScore');
        if ($accomplishmentStudent->accomplishment->type === "skill") {
            $accomplishmentStudent->is_capable =
                $request->newScore >= config(
                    'santrack.assessment.skill_passing_score'
                );
        } else {
            $accomplishmentStudent->is_capable = $request->has('isCapable')
                ? $request->boolean('isCapable')
                : $accomplishmentStudent->is_capable;
        }
        $accomplishmentStudent->rated_at = now();
        $accomplishmentStudent->save();
        return Response::success('Student performance updated successfully', 200, [
            'accomplishmentStudentId' => $accomplishmentStudent->id,
            'studentId' => $accomplishmentStudent->student_id,
            'accomplishmentName' => $accomplishmentStudent->accomplishment->name,
            'type' => $accomplishmentStudent->accomplishment->type,
            'newScore' => $accomplishmentStudent->score,
            'isCapable' => $accomplishmentStudent->is_capable
        ]);
    }

   

    /**
     * Academic Year Summary Report
     */
    public function academicYearSummary(Request $request)
    {
        $user = Auth::user();
        
        // Menggunakan helper yang diperbarui
        $activeAcademicYear = $this->getActiveAcademicYearFromUser($user);
        
        if (!$activeAcademicYear) {
            return Response::error('No active academic year found');
        }

        // Summary data for academic year
        $teacherAttendanceSummary = TeacherAttendance::selectRaw('
                COUNT(*) as total,
                SUM(CASE WHEN status = "present" THEN 1 ELSE 0 END) as present,
                SUM(CASE WHEN status = "absent" THEN 1 ELSE 0 END) as absent,
                SUM(CASE WHEN status = "late" THEN 1 ELSE 0 END) as late,
                SUM(CASE WHEN status = "sick" THEN 1 ELSE 0 END) as sick,
                SUM(CASE WHEN status = "permission" THEN 1 ELSE 0 END) as permission
            ')
            ->whereHas('schedule', function ($q) use ($activeAcademicYear) {
                $q->where('academic_year_id', $activeAcademicYear->id);
            })
            ->first();

        $studentAttendanceSummary = StudentAttendance::selectRaw('
                COUNT(*) as total,
                SUM(CASE WHEN status = "present" THEN 1 ELSE 0 END) as present,
                SUM(CASE WHEN status = "absent" THEN 1 ELSE 0 END) as absent,
                SUM(CASE WHEN status = "late" THEN 1 ELSE 0 END) as late,
                SUM(CASE WHEN status = "sick" THEN 1 ELSE 0 END) as sick,
                SUM(CASE WHEN status = "permission" THEN 1 ELSE 0 END) as permission
            ')
            ->whereHas('schedule', function ($q) use ($activeAcademicYear) {
                $q->where('academic_year_id', $activeAcademicYear->id);
            })
            ->first();

        $classroomCount = StudentClassroomPlacement::where(
            'academic_year_id',
            $activeAcademicYear->id
        )->distinct('classroom_id')->count('classroom_id');
        $teacherCount = Teacher::whereHas('schedules', function ($q) use ($activeAcademicYear) {
            $q->where('academic_year_id', $activeAcademicYear->id);
        })->distinct()->count();
        $studentCount = StudentClassroomPlacement::where(
            'academic_year_id',
            $activeAcademicYear->id
        )->distinct('student_id')->count('student_id');

        $responseData = [
            'academic_year' => [
                'id' => $activeAcademicYear->id,
                'name' => $activeAcademicYear->name,
                'periode' => $activeAcademicYear->periode,
                'start_periode' => $activeAcademicYear->start_periode,
                'end_periode' => $activeAcademicYear->end_periode,
                'is_active' => $activeAcademicYear->is_active,
            ],
            'statistics' => [
                'classrooms' => $classroomCount,
                'teachers' => $teacherCount,
                'students' => $studentCount,
            ],
            'teacher_attendance' => [
                'total' => $teacherAttendanceSummary->total ?? 0,
                'present' => $teacherAttendanceSummary->present ?? 0,
                'absent' => $teacherAttendanceSummary->absent ?? 0,
                'late' => $teacherAttendanceSummary->late ?? 0,
                'sick' => $teacherAttendanceSummary->sick ?? 0,
                'permission' => $teacherAttendanceSummary->permission ?? 0,
                'attendance_rate' => ($teacherAttendanceSummary->total ?? 0) > 0 
                    ? round((($teacherAttendanceSummary->present ?? 0) / ($teacherAttendanceSummary->total ?? 0)) * 100, 2)
                    : 0,
            ],
            'student_attendance' => [
                'total' => $studentAttendanceSummary->total ?? 0,
                'present' => $studentAttendanceSummary->present ?? 0,
                'absent' => $studentAttendanceSummary->absent ?? 0,
                'late' => $studentAttendanceSummary->late ?? 0,
                'sick' => $studentAttendanceSummary->sick ?? 0,
                'permission' => $studentAttendanceSummary->permission ?? 0,
                'attendance_rate' => ($studentAttendanceSummary->total ?? 0) > 0 
                    ? round((($studentAttendanceSummary->present ?? 0) / ($studentAttendanceSummary->total ?? 0)) * 100, 2)
                    : 0,
            ],
        ];

        return Response::success('Academic year summary loaded', 200, $responseData);
    }

    /**
     * Helper method untuk mendapatkan academic year aktif dari user
     * Menggunakan relasi: user → teacher → instance → academicYears (with is_active = true)
     */
    private function getActiveAcademicYearFromUser($user, $teacher = null)
    {
        // Jika teacher object diberikan langsung (untuk kasus admin melihat teacher tertentu)
        if ($teacher && $teacher instanceof Teacher) {
            $teacher->load('instance.academicYears');
            
            if ($teacher->instance && $teacher->instance->academicYears) {
                return $teacher->instance->academicYears
                    ->where('is_active', true)
                    ->first();
            }
            return null;
        }
        
        // Jika user adalah teacher
        if ($user && $user->role === 'teacher') {
            // Pastikan relasi sudah diload
            if (!$user->relationLoaded('teacher')) {
                $user->load('teacher.instance.academicYears');
            }
            
            if ($user->teacher && $user->teacher->instance && $user->teacher->instance->academicYears) {
                return $user->teacher->instance->academicYears
                    ->where('is_active', true)
                    ->first();
            }
            return null;
        }
        
        // Admin tetap menggunakan instance profilnya, bukan academic year global.
        if ($user && $user->role === 'admin') {
            return AcademicYear::where(
                'instance_id',
                $user->teacher->instance_id
            )->where('is_active', true)->first();
        }
        
        return null;
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
     * Helper methods untuk date ranges
     */
    private function getReportDate($academicYear, $period)
    {
        $today = Carbon::today();
        $startPeriode = Carbon::parse($academicYear->start_periode);
        $endPeriode = Carbon::parse($academicYear->end_periode);

        return $today->between($startPeriode, $endPeriode) ? $today : $startPeriode;
    }

    private function getWeekRange($academicYear)
    {
        $today = Carbon::today();
        $startPeriode = Carbon::parse($academicYear->start_periode);
        $endPeriode = Carbon::parse($academicYear->end_periode);

        if ($today->between($startPeriode, $endPeriode)) {
            $startOfWeek = $today->copy()->startOfWeek();
            $endOfWeek = $today->copy()->endOfWeek();
        } else {
            $startOfWeek = $startPeriode->copy()->startOfWeek();
            $endOfWeek = $startPeriode->copy()->endOfWeek();
        }

        return ['start' => $startOfWeek, 'end' => $endOfWeek];
    }

    private function getMonthRange($academicYear)
    {
        $today = Carbon::today();
        $startPeriode = Carbon::parse($academicYear->start_periode);
        $endPeriode = Carbon::parse($academicYear->end_periode);

        if ($today->between($startPeriode, $endPeriode)) {
            $reportMonth = $today->month;
            $reportYear = $today->year;
        } else {
            $reportMonth = $startPeriode->month;
            $reportYear = $startPeriode->year;
        }

        return ['month' => $reportMonth, 'year' => $reportYear];
    }

    private function getFilterInfo($period, $academicYear)
    {
        $startPeriode = Carbon::parse($academicYear->start_periode);
        $endPeriode = Carbon::parse($academicYear->end_periode);
        $today = Carbon::today();

        switch ($period) {
            case 'daily':
                $reportDate = $today->between($startPeriode, $endPeriode) ? $today : $startPeriode;
                return [
                    'type' => 'daily',
                    'date' => $reportDate->toDateString(),
                    'description' => 'Laporan harian tanggal ' . $reportDate->format('d F Y')
                ];

            case 'week':
                $weekRange = $this->getWeekRange($academicYear);
                return [
                    'type' => 'weekly',
                    'week_start' => $weekRange['start']->toDateString(),
                    'week_end' => $weekRange['end']->toDateString(),
                    'description' => 'Laporan mingguan ' . $weekRange['start']->format('d M') . ' - ' . $weekRange['end']->format('d M Y')
                ];

            case 'month':
                $monthRange = $this->getMonthRange($academicYear);
                return [
                    'type' => 'monthly',
                    'month' => $monthRange['month'],
                    'year' => $monthRange['year'],
                    'description' => 'Laporan bulanan ' . Carbon::create()->month($monthRange['month'])->monthName . ' ' . $monthRange['year']
                ];

            default:
                return ['type' => 'unknown'];
        }
    }

    private function getDateRangeInfo($startDate, $endDate)
    {
        $start = Carbon::parse($startDate);
        $end = Carbon::parse($endDate);
        
        $daysDiff = $start->diffInDays($end) + 1;
        
        return [
            'description' => "Periode: " . $start->format('d F Y') . " - " . $end->format('d F Y'),
            'days_count' => $daysDiff,
            'start_date_formatted' => $start->format('d F Y'),
            'end_date_formatted' => $end->format('d F Y'),
        ];
    }
}
