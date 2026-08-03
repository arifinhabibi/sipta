<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\Classroom;
use App\Models\Instance;
use App\Models\Student;
use App\Models\StudentClassroomPlacement;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ApiContractTest extends TestCase
{
    use RefreshDatabase;

    private $instance;
    private $academicYear;
    private $user;
    private $teacher;

    protected function setUp(): void
    {
        parent::setUp();

        $this->instance = Instance::create(['name' => 'API Contract School']);
        $this->academicYear = AcademicYear::create([
            'instance_id' => $this->instance->id,
            'name' => '2026/2027',
            'periode' => 'ganjil',
            'start_periode' => '2026-07-01',
            'end_periode' => '2026-12-31',
            'is_active' => true,
            'status' => 'active',
        ]);
        $this->user = User::create([
            'username' => 'api-admin',
            'password' => Hash::make('secret123'),
            'role' => 'admin',
        ]);
        $this->teacher = Teacher::create([
            'user_id' => $this->user->id,
            'instance_id' => $this->instance->id,
            'full_name' => 'API Admin',
            'gender' => 'male',
        ]);
    }

    public function test_login_refresh_and_logout_share_the_frontend_contract()
    {
        $login = $this->postJson('/api/v1/auth/sign-in', [
            'username' => 'api-admin',
            'password' => 'secret123',
        ])->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => [
                    'access_token',
                    'refresh_token',
                    'token_type',
                    'expires_in',
                    'instance',
                    'academic_year',
                    'user',
                ],
            ]);

        $oldRefreshToken = $login->json('data.refresh_token');
        $refresh = $this->postJson('/api/v1/auth/refresh', [
            'refresh_token' => $oldRefreshToken,
        ])->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => [
                    'access_token',
                    'refresh_token',
                    'token_type',
                    'expires_in',
                ],
            ]);

        $this->postJson('/api/v1/auth/refresh', [
            'refresh_token' => $oldRefreshToken,
        ])->assertUnauthorized();

        $this->withToken($refresh->json('data.access_token'))
            ->deleteJson('/api/v1/auth/sign-out', [
                'refresh_token' => $refresh->json('data.refresh_token'),
            ])
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_classroom_detail_uses_placements_for_requested_semester()
    {
        $classroom = Classroom::create([
            'instance_id' => $this->instance->id,
            'teacher_id' => $this->teacher->id,
            'name' => 'Kelas API',
            'capacity' => 20,
        ]);
        $student = Student::create([
            'instance_id' => $this->instance->id,
            'fullname' => 'Student Contract',
            'gender' => 'female',
        ]);
        StudentClassroomPlacement::create([
            'student_id' => $student->id,
            'classroom_id' => $classroom->id,
            'academic_year_id' => $this->academicYear->id,
            'is_current' => true,
        ]);

        $accessToken = $this->user
            ->createToken('contract-test', ['access'])
            ->plainTextToken;

        $this->withToken($accessToken)->getJson(
            '/api/v1/classrooms/' . $classroom->id
            . '?academic_year_id=' . $this->academicYear->id
        )->assertOk()
            ->assertJsonPath('data.id', $classroom->id)
            ->assertJsonPath('data.academic_year.id', $this->academicYear->id)
            ->assertJsonPath('data.students.0.id', $student->id);
    }

    public function test_odd_to_even_transition_preserves_roster_and_activates_target()
    {
        $target = AcademicYear::create([
            'instance_id' => $this->instance->id,
            'name' => $this->academicYear->name,
            'periode' => 'genap',
            'start_periode' => '2027-01-01',
            'end_periode' => '2027-06-30',
            'is_active' => false,
            'status' => 'draft',
        ]);
        $classroom = Classroom::create([
            'instance_id' => $this->instance->id,
            'teacher_id' => $this->teacher->id,
            'name' => 'Kelas Transition',
            'capacity' => 20,
        ]);
        $student = Student::create([
            'instance_id' => $this->instance->id,
            'fullname' => 'Student Transition',
            'gender' => 'male',
        ]);
        StudentClassroomPlacement::create([
            'student_id' => $student->id,
            'classroom_id' => $classroom->id,
            'academic_year_id' => $this->academicYear->id,
            'is_current' => true,
        ]);

        $accessToken = $this->user
            ->createToken('transition-test', ['access'])
            ->plainTextToken;

        $this->withToken($accessToken)->postJson(
            '/api/v1/admin/academic-years/' . $this->academicYear->id . '/transition',
            ['target_academic_year_id' => $target->id]
        )->assertOk()
            ->assertJsonPath('data.placement_count', 1)
            ->assertJsonPath('data.target.id', $target->id);

        $this->assertDatabaseHas('student_classroom_placements', [
            'student_id' => $student->id,
            'academic_year_id' => $target->id,
            'classroom_id' => $classroom->id,
            'is_current' => true,
        ]);
        $this->assertFalse($this->academicYear->fresh()->is_active);
        $this->assertSame('closed', $this->academicYear->fresh()->status);
        $this->assertTrue($target->fresh()->is_active);
    }
}
