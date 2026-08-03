<?php

namespace Tests\Feature;

use App\Services\DuplicateRepairService;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class DuplicateRepairDatabaseTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::create('student_attendances', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('student_id');
            $table->string('schedule_id')->nullable();
            $table->string('status');
            $table->text('note')->nullable();
            $table->timestamps();
        });

        Schema::create('teacher_attendances', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('teacher_id');
            $table->string('schedule_id')->nullable();
            $table->string('type');
            $table->string('status');
            $table->string('longitude')->nullable();
            $table->string('latitude')->nullable();
            $table->string('real_time_photo')->nullable();
            $table->string('gmaps')->nullable();
            $table->string('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('student_accomplishments', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('student_id');
            $table->string('accomplishment_id');
            $table->boolean('is_capable');
            $table->unsignedInteger('score')->nullable();
            $table->text('note')->nullable();
            $table->timestamps();
        });
    }

    protected function tearDown(): void
    {
        Schema::dropIfExists('student_accomplishments');
        Schema::dropIfExists('teacher_attendances');
        Schema::dropIfExists('student_attendances');

        parent::tearDown();
    }

    public function test_repair_keeps_latest_payload_and_is_idempotent()
    {
        DB::table('student_attendances')->insert([
            [
                'id' => 'old-attendance',
                'student_id' => 'student-1',
                'schedule_id' => 'schedule-1',
                'status' => 'absent',
                'note' => null,
                'created_at' => '2026-01-01 10:00:00',
                'updated_at' => '2026-01-01 10:00:00',
            ],
            [
                'id' => 'new-attendance',
                'student_id' => 'student-1',
                'schedule_id' => 'schedule-1',
                'status' => 'present',
                'note' => null,
                'created_at' => '2026-01-01 10:00:00',
                'updated_at' => '2026-01-02 10:00:00',
            ],
        ]);

        DB::table('teacher_attendances')->insert([
            $this->teacherAttendance('old-teacher', 'old.jpg', '2026-01-01'),
            $this->teacherAttendance('new-teacher', 'new.jpg', '2026-01-02'),
        ]);

        DB::table('student_accomplishments')->insert([
            $this->assessment('old-assessment', false, '2026-01-01'),
            $this->assessment('new-assessment', true, '2026-01-02'),
        ]);

        $service = app(DuplicateRepairService::class);
        $first = $service->repair();
        $second = $service->repair();

        $this->assertSame(1, $first['tables']['student_attendances']['groups']);
        $this->assertSame(1, $first['tables']['teacher_attendances']['groups']);
        $this->assertSame(1, $first['tables']['student_accomplishments']['groups']);
        $this->assertSame(0, $second['tables']['student_attendances']['groups']);
        $this->assertSame(0, $second['tables']['teacher_attendances']['groups']);
        $this->assertSame(0, $second['tables']['student_accomplishments']['groups']);

        $this->assertDatabaseHas('student_attendances', [
            'id' => 'new-attendance',
            'status' => 'present',
        ]);
        $this->assertDatabaseHas('teacher_attendances', [
            'id' => 'new-teacher',
            'real_time_photo' => 'new.jpg',
        ]);
        $this->assertDatabaseHas('student_accomplishments', [
            'id' => 'new-assessment',
            'is_capable' => true,
        ]);
    }

    private function teacherAttendance($id, $photo, $date)
    {
        return [
            'id' => $id,
            'teacher_id' => 'teacher-1',
            'schedule_id' => 'schedule-1',
            'type' => 'check_in',
            'status' => 'present',
            'longitude' => null,
            'latitude' => null,
            'real_time_photo' => $photo,
            'gmaps' => null,
            'notes' => null,
            'created_at' => $date . ' 10:00:00',
            'updated_at' => $date . ' 10:00:00',
        ];
    }

    private function assessment($id, $capable, $date)
    {
        return [
            'id' => $id,
            'student_id' => 'student-1',
            'accomplishment_id' => 'accomplishment-1',
            'is_capable' => $capable,
            'score' => null,
            'note' => null,
            'created_at' => $date . ' 10:00:00',
            'updated_at' => $date . ' 10:00:00',
        ];
    }
}
