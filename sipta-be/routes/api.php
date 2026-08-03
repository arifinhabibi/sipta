<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ScheduleController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\TeacherController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\StudentPerformanceController;
use App\Http\Controllers\AcademicYearWorkflowController;

Route::prefix("v1")->group(function () {

    Route::prefix("auth")->group(function () {
        Route::post("sign-in", [AuthController::class, 'signIn']);
        Route::post("refresh", [AuthController::class, 'refresh']);
    });

    Route::middleware(['auth:sanctum'])->group(function () {
        Route::prefix("auth")->group(function () {
            Route::get("/refresh/{token}", [AuthController::class, 'refreshToken']);
            Route::delete("sign-out", [AuthController::class, 'signOut']);
            Route::put('change-password', [AuthController::class, 'changePassword']);
        });

        // Schedules
        Route::prefix("schedules")->group(function () {
            Route::get('/today', [ScheduleController::class, 'today']);
            Route::get('/', [ScheduleController::class, 'index']);
            Route::get('/{schedule_id}', [ScheduleController::class, 'show']);

            Route::post('/{schedule_id}/accomplishments', [ScheduleController::class, 'createAccomplish']);

            Route::prefix("subjects")->group(function () {
                Route::get('/get', [ScheduleController::class, 'subjects']);
                Route::post('/', [ScheduleController::class, 'subjectCreate']);
                Route::get('/{subject_id}', [ScheduleController::class, 'subjectShow']);
                Route::put('/{subject_id}', [ScheduleController::class, 'subjectUpdate']);
                Route::delete('/{subject_id}', [ScheduleController::class, 'subjectDelete']);
            });
        });

        // Teachers
        Route::prefix("teachers")->group(function () {
            Route::get('/', [TeacherController::class, 'index']);
            Route::get('/{teacher_id}', [TeacherController::class, 'show']);
            Route::post('/{teacher_id}', [TeacherController::class, 'update']);

            Route::prefix("attendances")->group(function () {
                Route::get('/all', [TeacherController::class, 'allAttendance']);
                Route::post('/create', [TeacherController::class, 'createAttendance']);
                Route::get('/{teacher_id}', [TeacherController::class, 'showAttendance']);
                Route::put('/{teacher_id}', [TeacherController::class, 'updateAttendance']);
                Route::delete('/{teacher_id}', [TeacherController::class, 'deleteAttendance']);
            });

            Route::prefix("classrooms")->group(function () {
                Route::get('/target-upgrade', [TeacherController::class, 'targetUpgrade']);
                Route::get('/{classroom_id}', [TeacherController::class, 'showClassroom']);
            });
        });

        // Students
        Route::prefix("students")->group(function () {
            Route::post(
                '/promoted',
                [StudentController::class, 'promoteStudents']
            )->middleware('admin.rule');
            Route::post('/place-students', [StudentController::class, 'placeStudents']);

            Route::prefix("attendances")->group(function () {
                Route::get('/', [StudentController::class, 'allAttendance']);
                Route::post('/', [StudentController::class, 'createAttendance']);
                Route::get('/{student_id}', [StudentController::class, 'showAttendance']);
                Route::put('/{student_id}', [StudentController::class, 'updateAttendance']);
                Route::delete('/{student_id}', [StudentController::class, 'deleteAttendance']);
            });

            Route::get('/', [StudentController::class, 'index']);
            Route::post('/', [StudentController::class, 'create']);
            Route::get('/{student_id}', [StudentController::class, 'show']);
            Route::post('/{student_id}/update', [StudentController::class, 'update']);
            Route::delete('/{student_id}', [StudentController::class, 'delete']);
        });

        Route::get('/classrooms', [AdminController::class, 'getStudentsByClassroom']);
        Route::get('/classrooms/{classroom_id}', [AdminController::class, 'showClassroom']);

        Route::get('/me', [AuthController::class, 'me']);

        Route::prefix('reports')->group(function () {
            Route::get('/attendances-teacher', [ReportController::class, 'attendancesTeacher']);
            // Transitional response contract used by the current frontend.
            Route::get('/perfomance-students/student/{student_id}', [ReportController::class, 'performanceStudentsByStudent']);
            Route::get('/perfomance-students/{classroom_id}', [ReportController::class, 'performanceStudents']);
            Route::get('/perfomance-students/student/{student_id}/export/pdf', [ReportController::class, 'exportPerformanceStudentPdf']);
            Route::put('/perfomance-students/{student_id}', [ReportController::class, 'updatePerformanceStudent']);

            // Correctly-spelled aliases. Legacy "perfomance" routes remain
            // temporarily for existing clients.
            Route::get('/performance-students/student/{student_id}', [StudentPerformanceController::class, 'student']);
            Route::get('/performance-students/{classroom_id}', [StudentPerformanceController::class, 'classroom']);
            Route::get('/performance-students/student/{student_id}/export/pdf', [StudentPerformanceController::class, 'exportPdf']);
            Route::put('/performance-students/{student_id}', [ReportController::class, 'updatePerformanceStudent']);
            Route::get('/academic-year-summary', [ReportController::class, 'academicYearSummary']);
        });

        Route::get('/instance/academic-years', [AdminController::class, 'getAcademicYears']);

        Route::get('/incomplete-schedules', [ScheduleController::class, 'incompleteSchedules']);

        // Admin
        Route::middleware(['admin.rule'])->group(function () {
            Route::prefix("admin")->group(function () {

                Route::post('/teachers', [TeacherController::class, 'create']);
                Route::delete('/teachers/{teacher_id}', [TeacherController::class, 'delete']);

                Route::post('/classrooms', [AdminController::class, 'createClassroom']);
                Route::put('/classrooms/{classroom_id}', [AdminController::class, 'updateClassroom']);
                Route::delete('/classrooms/{classroom_id}', [AdminController::class, 'deleteClassroom']);

                Route::post('/schedules', [ScheduleController::class, 'create']);
                Route::put('/schedules/{schedule_id}', [ScheduleController::class, 'update']);
                Route::delete('/schedules/{schedule_id}', [ScheduleController::class, 'delete']);
                Route::put('/incomplete-schedules', [ScheduleController::class, 'updateAttandanceTeacher']);
                Route::put('/schedules/completion/bulk', [ScheduleController::class, 'markMultipleAsCompleted']);

                Route::post('/instance', [AdminController::class, 'updateInstance']);

                Route::post('/instance/academic-year', [AdminController::class, 'createAcademicYear']);
                Route::put('/instance/academic-year/{academic_year_id}', [AdminController::class, 'updateAcademicYear']);
                Route::delete('/instance/academic-year/{academic_year_id}', [AdminController::class, 'deleteAcademicYear']);
                Route::post(
                    '/academic-years/{source_academic_year_id}/rollover',
                    [AcademicYearWorkflowController::class, 'rollover']
                );
                Route::post(
                    '/academic-years/{source_academic_year_id}/transition',
                    [AcademicYearWorkflowController::class, 'transition']
                );
                Route::post(
                    '/academic-years/{academic_year_id}/close',
                    [AcademicYearWorkflowController::class, 'close']
                );


            Route::get('/attendance-teachers/export', [ReportController::class, 'exportAttendancesTeacher']);
            });
        });
    });
});
