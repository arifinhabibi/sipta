<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;
use App\Jobs\SendPresenceReport;
use App\Models\AcademicYear;
use Carbon\Carbon;

class Kernel extends ConsoleKernel
{
    /**
     * The Artisan commands provided by your application.
     *
     * @var array
     */
    protected $commands = [
        //
    ];

    /**
     * Define the application's command schedule.
     *
     * @param  \Illuminate\Console\Scheduling\Schedule  $schedule
     * @return void
     */
    protected function schedule(Schedule $schedule)
    {
        // Hitung tanggal report berdasarkan akhir bulan
        $reportDate = $this->getReportDate();
        
        $schedule->call(function () {
            $recipients = config(
                'santrack.reports.attendance_recipients',
                []
            );

            if (empty($recipients)) {
                return;
            }

            AcademicYear::active()->each(function ($academicYear) use ($recipients) {
                SendPresenceReport::dispatch(
                    now()->startOfMonth()->toDateString(),
                    now()->endOfMonth()->toDateString(),
                    null,
                    $academicYear->id,
                    $recipients
                )
                    ->onConnection('rabbitmq')
                    ->onQueue(config('queue.connections.rabbitmq.queue'));
            });
        })
        ->name('monthly-attendance-report')
        ->monthlyOn($reportDate->day, '09:00')
        ->withoutOverlapping();
    }

    /**
     * Get the report date adjusted for weekends.
     * If the end of month falls on Saturday or Sunday,
     * move it to the previous Friday.
     *
     * @return \Carbon\Carbon
     */
    protected function getReportDate()
    {
        $endOfMonth = now()->endOfMonth();
        
        // Cek apakah akhir bulan jatuh pada weekend
        // Sabtu = 6, Minggu = 7 (menggunakan format N)
        $dayOfWeek = (int)$endOfMonth->format('N');
        
        // Jika Sabtu (6), mundur 1 hari ke Jumat
        if ($dayOfWeek === 6) {
            return $endOfMonth->subDay();
        }
        
        // Jika Minggu (7), mundur 2 hari ke Jumat
        if ($dayOfWeek === 7) {
            return $endOfMonth->subDays(2);
        }
        
        // Jika weekday (1-5), tetap menggunakan tanggal akhir bulan
        return $endOfMonth;
    }

    /**
     * Alternative method: Get the last working day of the month.
     * This will find the last weekday (Monday-Friday) of the month.
     *
     * @return \Carbon\Carbon
     */
    protected function getLastWorkingDayOfMonth()
    {
        $date = now()->endOfMonth();
        
        // Loop backwards until we find a weekday
        $dayOfWeek = (int)$date->format('N');
        while ($dayOfWeek === 6 || $dayOfWeek === 7) {
            $date->subDay();
            $dayOfWeek = (int)$date->format('N');
        }
        
        return $date;
    }

    /**
     * Register the commands for the application.
     *
     * @return void
     */
    protected function commands()
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}
