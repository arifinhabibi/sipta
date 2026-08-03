<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;

class PresenceReportMail extends Mailable
{
    public $filePath;

    public function __construct($filePath)
    {
        $this->filePath = $filePath;
    }

    public function build()
    {
        return $this->subject('Laporan Presensi Guru')
            ->view('emails.presence-teachers-report') // bikin blade sendiri
            ->attach($this->filePath, [
                'as' => 'laporan-presensi.xlsx',
                'mime' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ]);
    }
}