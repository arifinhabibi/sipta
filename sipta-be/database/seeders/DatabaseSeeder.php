<?php

namespace Database\Seeders;

use App\Models\AcademicYear;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\Teacher;
use App\Models\Classroom;
use App\Models\Instance;
use App\Models\Subject;
use App\Models\Schedule;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        /** ===============================================================
         *  INSTANCE
         *  =============================================================== */
        $instance = Instance::create([
            'name' => 'arrahman',
            'type_institutions' => "tpa",
            'latitude' => '-6.2154197',
            'longitude' => '106.8030891',
        ]);

        /** ===============================================================
         *  ACADEMIC YEARS
         *  =============================================================== */
        $academicYear = AcademicYear::create([
            'instance_id' => $instance->id,
            'name' => '2025/2026',
            'periode' => 'ganjil',
            'start_periode' => '2025-08-16',
            'end_periode' => '2026-01-16',
            'is_active' => true,
            'status' => 'active',
        ]);

        /** ===============================================================
         *  USERS & TEACHERS
         *  =============================================================== */
        $users = User::factory(8)->create();

        $teacherProfiles = [
            [
                'full_name'  => 'El Larry',
                'gender'     => 'male',
                'birth_date' => '1990-01-15',
                'phone'      => '081234567890',
                'address'    => 'Jl. Merdeka No. 1, Jakarta',
                'degree'     => 'S.Pd',
                'photo'      => 'default.jpg',
                'status'     => 'active',
            ],
            [
                'full_name'  => 'John Doe',
                'gender'     => 'male',
                'birth_date' => '1990-01-15',
                'phone'      => '081234567890',
                'address'    => 'Jl. Merdeka No. 1, Jakarta',
                'degree'     => 'S.Pd',
                'photo'      => 'default.jpg',
                'status'     => 'active',
            ],
            [
                'full_name'  => 'Jane Smith',
                'gender'     => 'female',
                'birth_date' => '1992-04-20',
                'phone'      => '081298765432',
                'address'    => 'Jl. Sudirman No. 21, Bandung',
                'degree'     => 'M.Pd',
                'photo'      => 'default.jpg',
                'status'     => 'active',
            ],
            [
                'full_name'  => 'Michael Tan',
                'gender'     => 'male',
                'birth_date' => '1988-07-11',
                'phone'      => '081377788899',
                'address'    => 'Jl. Diponegoro No. 10, Surabaya',
                'degree'     => 'S.Pd',
                'photo'      => 'default.jpg',
                'status'     => 'active',
            ],
            [
                'full_name'  => 'Lisa Wijaya',
                'gender'     => 'female',
                'birth_date' => '1995-12-05',
                'phone'      => '081299911122',
                'address'    => 'Jl. Gajah Mada No. 5, Yogyakarta',
                'degree'     => 'M.Pd',
                'photo'      => 'default.jpg',
                'status'     => 'active',
            ],
            [
                'full_name'  => 'Rizky Pratama',
                'gender'     => 'male',
                'birth_date' => '1987-03-09',
                'phone'      => '081322334455',
                'address'    => 'Jl. Asia Afrika No. 88, Bandung',
                'degree'     => 'S.Ag',
                'photo'      => 'default.jpg',
                'status'     => 'active',
            ],
            [
                'full_name'  => 'Nur Aisyah',
                'gender'     => 'female',
                'birth_date' => '1993-09-14',
                'phone'      => '081355566677',
                'address'    => 'Jl. Pahlawan No. 12, Semarang',
                'degree'     => 'M.Ag',
                'photo'      => 'default.jpg',
                'status'     => 'active',
            ],
            [
                'full_name'  => 'Fahri Ahmad',
                'gender'     => 'male',
                'birth_date' => '1989-05-27',
                'phone'      => '081388899900',
                'address'    => 'Jl. Hasanuddin No. 77, Makassar',
                'degree'     => 'S.Pd.I',
                'photo'      => 'default.jpg',
                'status'     => 'active',
            ],
        ];


        foreach ($users as $i => $user) {
            Teacher::create(array_merge($teacherProfiles[$i], [
                'user_id' => $user->id,
                'instance_id' => $instance->id
            ]));
        }
        $teachers   = Teacher::all();


        /** ===============================================================
         *  CLASSROOMS
         *  =============================================================== */
        $classrooms = [
            // Raudhathul Athfal
            ['Raudhathul Athfal 1', 'RA-1', 20, 'Kelas Raudhathul Athfal tingkat 1'],
            ['Raudhathul Athfal 2', 'RA-2', 20, 'Kelas Raudhathul Athfal tingkat 2'],
            ['Raudhathul Athfal 3', 'RA-3', 20, 'Kelas Raudhathul Athfal tingkat 3'],

            // Awaliyah
            ['Awaliyah Sore', 'AW-SR', 25, 'Kelas Awaliyah sore'],
            ['Awaliyah Ikhwan', 'AW-IK', 25, 'Kelas Awaliyah ikhwan'],
            ['Awaliyah Akhwat', 'AW-AK', 25, 'Kelas Awaliyah akhwat'],

            // Wustho
            ['Wustho Sore', 'WU-SR', 25, 'Kelas Wustho sore'],
            ['Wustho Ikhwan', 'WU-IK', 25, 'Kelas Wustho ikhwan'],
            ['Wustho Akhwat', 'WU-AK', 25, 'Kelas Wustho akhwat'],

            // Ulya
            ['Ulya Sore', 'UL-SR', 25, 'Kelas Ulya sore'],
            ['Ulya Ikhwan', 'UL-IK', 25, 'Kelas Ulya ikhwan'],
            ['Ulya Akhwat', 'UL-AK', 25, 'Kelas Ulya akhwat'],
        ];

        foreach ($classrooms as [$name, $room, $capacity, $desc]) {
            Classroom::create([
                'teacher_id' => $teachers->random()->id,
                'instance_id' => $instance->id,
                'name'       => $name,
                'room_number' => $room,
                'capacity'   => $capacity,
                'description' => $desc,
            ]);
        }
        $classrooms = Classroom::all();


        /** ===============================================================
         *  SUBJECTS
         *  =============================================================== */
        $subjects = [
            ['Sejarah Kebudayaan Islam', 'SKI', 'Pelajaran sejarah dan kebudayaan Islam.'],
            ['Bahasa Arab', 'BA', 'Pelajaran bahasa Arab dasar dan lanjutan.'],
            ['Ilmu Tajwid', 'TJ', 'Pelajaran ilmu tajwid dan pelafalan Al-Qur\'an.'],
            ['Imla\'', 'IM', 'Pelajaran menulis dan mengeja dalam bahasa Arab.'],
            ['Fiqih', 'FQ', 'Pelajaran hukum Islam dan fiqih sehari-hari.'],
            ['Ilmu Tauhid', 'TH', 'Pelajaran akidah dan ketauhidan.'],
        ];

        foreach ($subjects as [$name, $code, $desc]) {
            Subject::create([
                'instance_id' => $instance->id,
                'name'        => $name,
                'code'        => $code,
                'description' => $desc,
            ]);
        }
        $subjects   = Subject::all();


        /** ===============================================================
         *  SCHEDULES — 22 Oktober 2025
         *  =============================================================== */
        $date       = '2025-11-03';

        $timeSlots = [
            ['13:30', '15:00'],
            ['14:00', '16:45'],
            ['14:30', '17:30'],
        ];

        // foreach ($classrooms as $classroom) {
        //     foreach ($timeSlots as [$start, $end]) {
        //         Schedule::create([
        //             'teacher_id'   => $teachers->random()->id,
        //             'academic_year_id'   => $academicYear->id,
        //             'subject_id'   => $subjects->random()->id,
        //             'classroom_id' => $classroom->id,
        //             'date'         => $date,
        //             'start_time'   => $start,
        //             'end_time'     => $end,
        //         ]);
        //     }
        // }

        $this->command->info('✅ Database seeding complete: Teachers, Classrooms, Subjects, and Schedules');
    }
}
