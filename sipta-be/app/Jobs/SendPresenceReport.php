<?php

namespace App\Jobs;

use App\Services\AttendanceReportService;
use App\Exports\TeacherAttendanceExport;
use App\Mail\PresenceReportMail;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Support\Facades\Storage;

class SendPresenceReport implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $startDate;
    public $endDate;
    public $teacherId;
    public $academicYearId;
    public $email;

    public function __construct($startDate, $endDate, $teacherId, $academicYearId, $email)
    {
        $this->startDate = $startDate;
        $this->endDate = $endDate;
        $this->teacherId = $teacherId;
        $this->academicYearId = $academicYearId;
        $this->email = $email;
    }

    public function handle()
    {
        // biar gak mati pelan-pelan
        ini_set('memory_limit', '512M');

        $service = new AttendanceReportService();

        $data = $service->getData(
            $this->startDate,
            $this->endDate,
            $this->teacherId,
            $this->academicYearId
        );

        $fileName = 'reports/presensi-' .
            ($this->academicYearId ?: 'all') . '-' .
            now()->format('YmdHis') . '.xlsx';

        Excel::store(
            new TeacherAttendanceExport(...$data),
            $fileName,
            'local'
        );

        try {
            Mail::to($this->email)->send(
                new PresenceReportMail(storage_path('app/' . $fileName))
            );
        } finally {
            Storage::disk('local')->delete($fileName);
        }
    }
}
