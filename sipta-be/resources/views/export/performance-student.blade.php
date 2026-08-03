<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <title>Laporan Perkembangan Siswa</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 16mm 15mm 14mm;
        }

        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            font-family: "DejaVu Sans", sans-serif;
            font-size: 9pt;
            line-height: 1.35;
            color: #172033;
            background: #ffffff;
        }

        .main-page {
            position: relative;
            height: 267mm;
        }

        table {
            border-collapse: collapse;
        }

        .report-header {
            width: 100%;
            border-bottom: 2px solid #17365d;
            margin-bottom: 11px;
        }

        .report-header td {
            padding-bottom: 10px;
            vertical-align: middle;
        }

        .brand-mark {
            width: 48px;
            height: 48px;
            text-align: center;
            background: #17365d;
            color: #ffffff;
            font-size: 19pt;
            font-family: "DejaVu Serif", serif;
            font-weight: bold;
        }

        .brand-copy {
            padding-left: 12px !important;
        }

        .school-name {
            margin: 0 0 2px;
            font-family: "DejaVu Serif", serif;
            font-size: 14pt;
            line-height: 1.15;
            font-weight: bold;
            letter-spacing: .35px;
            text-transform: uppercase;
            color: #17365d;
        }

        .school-meta {
            margin: 1px 0;
            font-size: 7.6pt;
            color: #596579;
        }

        .document-code {
            width: 122px;
            padding-left: 10px !important;
            text-align: right;
            font-size: 7.2pt;
            line-height: 1.55;
            color: #596579;
        }

        .document-code strong {
            display: block;
            font-size: 8pt;
            letter-spacing: .7px;
            color: #17365d;
        }

        .title-block {
            margin: 12px 0 11px;
            text-align: center;
        }

        .title-block h1 {
            margin: 0;
            font-family: "DejaVu Serif", serif;
            font-size: 15pt;
            line-height: 1.2;
            letter-spacing: 1px;
            text-transform: uppercase;
            color: #172033;
        }

        .title-rule {
            width: 54px;
            height: 2px;
            margin: 6px auto;
            background: #c79b3b;
        }

        .title-block p {
            margin: 0;
            font-size: 8pt;
            color: #687386;
        }

        .student-card {
            width: 100%;
            margin-bottom: 12px;
            border: 1px solid #cbd2dc;
            background: #f7f9fc;
        }

        .student-card td {
            width: 50%;
            padding: 8px 11px;
            vertical-align: top;
        }

        .student-card td + td {
            border-left: 1px solid #d8dee7;
        }

        .identity-table {
            width: 100%;
        }

        .identity-table td {
            width: auto;
            padding: 1.5px 0;
            border: 0 !important;
            background: transparent;
        }

        .identity-table .label {
            width: 100px;
            color: #687386;
        }

        .identity-table .separator {
            width: 12px;
            color: #8992a1;
        }

        .identity-table .value {
            font-weight: bold;
            color: #172033;
        }

        .section {
            margin-top: 12px;
            page-break-inside: avoid;
        }

        .section-heading {
            width: 100%;
            margin-bottom: 5px;
        }

        .section-heading td {
            vertical-align: bottom;
        }

        .section-number {
            width: 22px;
            font-family: "DejaVu Serif", serif;
            font-size: 10pt;
            font-weight: bold;
            color: #c08a23;
        }

        .section-title {
            font-size: 9pt;
            font-weight: bold;
            letter-spacing: .55px;
            text-transform: uppercase;
            color: #17365d;
        }

        .section-line {
            border-bottom: 1px solid #cbd2dc;
        }

        .score-layout {
            width: 100%;
        }

        .score-layout > tbody > tr > td {
            vertical-align: stretch;
        }

        .score-table-cell {
            padding-right: 9px;
        }

        .data-table {
            width: 100%;
            font-size: 8.1pt;
        }

        .data-table thead {
            display: table-header-group;
        }

        .data-table th {
            padding: 5px 7px;
            border: 1px solid #17365d;
            background: #17365d;
            color: #ffffff;
            font-size: 7.5pt;
            font-weight: bold;
            letter-spacing: .25px;
            text-align: center;
            text-transform: uppercase;
        }

        .data-table td {
            padding: 5px 7px;
            border: 1px solid #cbd2dc;
            text-align: center;
            vertical-align: middle;
        }

        .data-table tbody tr:nth-child(even) td {
            background: #f7f9fc;
        }

        .data-table tr {
            page-break-inside: avoid;
        }

        .text-left {
            text-align: left !important;
        }

        .text-right {
            text-align: right !important;
        }

        .score-number {
            font-weight: bold;
            color: #17365d;
        }

        .predicate {
            font-size: 7.5pt;
            font-weight: bold;
            color: #354258;
        }

        .final-panel {
            width: 145px;
            border: 1px solid #17365d;
            background: #f7f9fc;
        }

        .final-panel .panel-label {
            padding: 7px;
            background: #17365d;
            color: #ffffff;
            font-size: 7.5pt;
            font-weight: bold;
            letter-spacing: .6px;
            text-align: center;
            text-transform: uppercase;
        }

        .final-panel .panel-body {
            padding: 11px 8px 9px;
            text-align: center;
        }

        .final-panel .final-score {
            font-family: "DejaVu Serif", serif;
            font-size: 27pt;
            line-height: 1;
            font-weight: bold;
            color: #17365d;
        }

        .final-panel .final-predicate {
            margin-top: 6px;
            font-size: 7.5pt;
            font-weight: bold;
            color: #a66f12;
            text-transform: uppercase;
        }

        .final-panel .rank {
            margin-top: 10px;
            padding-top: 8px;
            border-top: 1px solid #d8dee7;
            color: #687386;
            font-size: 7.5pt;
        }

        .final-panel .rank strong {
            display: block;
            margin-top: 1px;
            font-size: 11pt;
            color: #172033;
        }

        .attendance-table {
            width: 100%;
            table-layout: fixed;
            font-size: 8pt;
        }

        .attendance-table th {
            padding: 5px 4px;
            border: 1px solid #cbd2dc;
            background: #edf1f6;
            color: #46536a;
            font-size: 7pt;
            text-transform: uppercase;
        }

        .attendance-table td {
            padding: 6px 4px;
            border: 1px solid #cbd2dc;
            text-align: center;
            font-weight: bold;
            color: #172033;
        }

        .attendance-table .attendance-rate {
            background: #17365d;
            color: #ffffff;
        }

        .note-box {
            margin-top: 7px;
            padding: 6px 8px;
            border-left: 3px solid #c79b3b;
            background: #faf8f2;
            color: #657083;
            font-size: 7.2pt;
        }

        .signature-section {
            position: absolute;
            right: 0;
            bottom: 12mm;
            left: 0;
            margin: 0;
            page-break-inside: avoid;
        }

        .signature-table {
            width: 100%;
            table-layout: fixed;
        }

        .signature-table td {
            width: 33.33%;
            padding: 0 12px;
            text-align: center;
            vertical-align: top;
            font-size: 8pt;
        }

        .signature-table .place-date {
            min-height: 14px;
            margin-bottom: 2px;
            color: #687386;
            font-size: 7.2pt;
        }

        .signature-table .role {
            font-weight: bold;
            color: #172033;
        }

        .signature-space {
            height: 45px;
        }

        .signature-name {
            display: inline-block;
            min-width: 135px;
            padding-top: 4px;
            border-top: 1px solid #596579;
            font-size: 7.5pt;
            color: #354258;
        }

        .report-footer {
            margin-top: 12px;
            padding-top: 6px;
            border-top: 1px solid #d8dee7;
            font-size: 6.7pt;
            color: #8992a1;
            text-align: center;
        }

        .main-footer {
            position: absolute;
            right: 0;
            bottom: 0;
            left: 0;
            margin-top: 0;
        }

        .details-page {
            page-break-before: always;
        }

        .details-heading {
            margin-bottom: 9px;
            padding-bottom: 7px;
            border-bottom: 2px solid #17365d;
        }

        .details-heading h2 {
            margin: 0;
            font-family: "DejaVu Serif", serif;
            font-size: 12pt;
            color: #17365d;
            text-transform: uppercase;
        }

        .details-heading p {
            margin: 2px 0 0;
            font-size: 7.5pt;
            color: #687386;
        }

        .detail-table {
            font-size: 7.2pt;
        }

        .detail-table th {
            padding: 4px 5px;
            font-size: 6.8pt;
        }

        .detail-table td {
            padding: 4px 5px;
        }

        .status {
            font-size: 6.8pt;
            font-weight: bold;
        }

        .status-present {
            color: #2f6c4f;
        }

        .status-absent {
            color: #a13d3d;
        }

        .status-other {
            color: #9a6a16;
        }

        .accomplishment-item {
            margin-bottom: 2px;
        }

        .muted {
            color: #8992a1;
        }
    </style>
</head>
<body>
    @php
        $schoolName = $instance->name ?? 'Nama Sekolah';
        $schoolInitial = mb_strtoupper(mb_substr(trim($schoolName), 0, 1));
        $period = $academicYear->periode
            ?? (($academicYear->start_periode ?? null) && ($academicYear->end_periode ?? null)
                ? $academicYear->start_periode . ' - ' . $academicYear->end_periode
                : '-');
        $teacherName = optional($classroom->teacher)->full_name
            ?? optional($classroom->teacher)->fullname
            ?? '-';
        $birthDate = $student->birth_date
            ? \Carbon\Carbon::parse($student->birth_date)->locale('id')->translatedFormat('d F Y')
            : null;
        $printDate = \Carbon\Carbon::now()->locale('id')->translatedFormat('d F Y');
        $predikatFn = function ($score) {
            if ($score >= 85) return ['Sangat Baik', 'sangat-baik'];
            if ($score >= 70) return ['Baik', 'baik'];
            if ($score >= 55) return ['Cukup', 'cukup'];
            return ['Perlu Bimbingan', 'kurang'];
        };
        $aspekList = [
            'creativity1' => 'UTS',
            'creativity2' => 'UAS',
            'attitude' => 'Sikap / Akhlak',
            'skill' => 'Keterampilan',
        ];
        $finalPredicate = $predikatFn($finalScore);
        $statusLabels = [
            'present' => 'Hadir',
            'absent' => 'Alpa',
            'sick' => 'Sakit',
            'permission' => 'Izin',
            'late' => 'Terlambat',
        ];
    @endphp

    <div class="main-page">
    <table class="report-header">
        <tr>
            <!-- <td style="width: 48px;">
                <div class="brand-mark">{{ $schoolInitial }}</div>
            </td> -->
            <td class="brand-copy">
                <div class="school-name">{{ $schoolName }}</div>
                @if($instance->description ?? null)
                    <div class="school-meta">{{ $instance->description }}</div>
                @endif
                <div class="school-meta">
                    {{ $instance->type_institutions ?? 'Institusi Pendidikan' }}
                    &nbsp;&bull;&nbsp;
                    {{ $instance->address ?? 'Alamat belum tersedia' }}
                </div>
            </td>
            <td class="document-code">
                <strong>LAPORAN SISWA</strong>
                NIS/NISN: {{ $student->nis ?? '-' }}<br>
                Tahun: {{ $academicYear->name ?? '-' }}
            </td>
        </tr>
    </table>

    <div class="title-block">
        <h1>Laporan Perkembangan Siswa</h1>
        <div class="title-rule"></div>
        <p>Tahun akademik {{ $academicYear->name ?? '-' }} &nbsp;&bull;&nbsp; Periode {{ $period }}</p>
    </div>

    <table class="student-card">
        <tr>
            <td>
                <table class="identity-table">
                    <tr>
                        <td class="label">Nama siswa</td>
                        <td class="separator">:</td>
                        <td class="value">{{ $student->fullname }}</td>
                    </tr>
                    <tr>
                        <td class="label">NIS / NISN</td>
                        <td class="separator">:</td>
                        <td class="value">{{ $student->nis ?? '-' }}</td>
                    </tr>
                    <tr>
                        <td class="label">Jenis kelamin</td>
                        <td class="separator">:</td>
                        <td class="value">{{ $student->gender === 'male' ? 'Laki-laki' : 'Perempuan' }}</td>
                    </tr>
                    <tr>
                        <td class="label">Tempat Lahir</td>
                        <td class="separator">:</td>
                        <td class="value">
                            {{ $student->birth_place ?? '-' }}
                        </td>
                    </tr>
                    <tr>
                        <td class="label">Tanggal Lahir</td>
                        <td class="separator">:</td>
                        <td class="value">
                           {{ $birthDate ?? '-' }}
                        </td>
                    </tr>
                </table>
            </td>
            <td>
                <table class="identity-table">
                    <tr>
                        <td class="label">Kelas</td>
                        <td class="separator">:</td>
                        <td class="value">{{ $classroom->name }}</td>
                    </tr>
                    <tr>
                        <td class="label">Wali kelas</td>
                        <td class="separator">:</td>
                        <td class="value">{{ $teacherName }}</td>
                    </tr>
                   
                </table>
            </td>
        </tr>
    </table>

    <div class="section">
        <table class="section-heading">
            <tr>
                <td class="section-number">01</td>
                <td class="section-title">Ringkasan Hasil Belajar</td>
                <td class="section-line">&nbsp;</td>
            </tr>
        </table>

        <table class="score-layout">
            <tr>
                <td class="score-table-cell">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th style="width: 32px;">No.</th>
                                <th class="text-left">Aspek Penilaian</th>
                                <th style="width: 74px;">Nilai</th>
                                <th style="width: 98px;">Predikat</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach($aspekList as $key => $label)
                                @php
                                    $score = $averageScores[$key] ?? 0;
                                    $predicate = $predikatFn($score);
                                @endphp
                                <tr>
                                    <td>{{ str_pad($loop->iteration, 2, '0', STR_PAD_LEFT) }}</td>
                                    <td class="text-left">{{ $label }}</td>
                                    <td class="score-number">{{ number_format($score, 2, ',', '.') }}</td>
                                    <td><span class="predicate">{{ $predicate[0] }}</span></td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                </td>
                <td class="final-panel">
                    <div class="panel-label">Nilai Akhir</div>
                    <div class="panel-body">
                        <div class="final-score">{{ number_format($finalScore, 2, ',', '.') }}</div>
                        <div class="final-predicate">{{ $finalPredicate[0] }}</div>
                        @if($rank)
                            <div class="rank">
                                Peringkat kelas
                                <strong>{{ $rank }}</strong>
                            </div>
                        @endif
                    </div>
                </td>
            </tr>
        </table>
    </div>

    <div class="section">
        <table class="section-heading">
            <tr>
                <td class="section-number">02</td>
                <td class="section-title">Rekapitulasi Kehadiran</td>
                <td class="section-line">&nbsp;</td>
            </tr>
        </table>

        <table class="attendance-table">
            <thead>
                <tr>
                    <th>Total Pertemuan</th>
                    <th>Hadir</th>
                    <th>Sakit</th>
                    <th>Izin</th>
                    <th>Alpa</th>
                    <th class="attendance-rate">Kehadiran</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>{{ $attendanceSummary['total'] }} hari</td>
                    <td>{{ $attendanceSummary['present'] }} hari</td>
                    <td>{{ $attendanceSummary['sick'] }} hari</td>
                    <td>{{ $attendanceSummary['permission'] }} hari</td>
                    <td>{{ $attendanceSummary['absent'] }} hari</td>
                    <td class="attendance-rate">{{ number_format($attendanceSummary['percentage'], 2, ',', '.') }}%</td>
                </tr>
            </tbody>
        </table>

        <div class="note-box">
            <strong>Komposisi nilai:</strong>
            Kehadiran 25% &bull; UTS 20% &bull; UAS 20% &bull;
            Sikap/Akhlak 20% &bull; Keterampilan 15%.
        </div>
    </div>

    <div class="signature-section">
        <table class="signature-table">
            <tr>
                <td>
                    <div class="place-date">&nbsp;</div>
                    <div>Mengetahui,</div>
                    <div class="role">Kepala {{ $schoolName }}</div>
                    <div class="signature-space"></div>
                    <div class="signature-name">{{ $instance->headmaster_name ?? '( Nama terang )' }}</div>
                </td>
                <td>
                    <div class="place-date">&nbsp;</div>
                    <div>Mengetahui,</div>
                    <div class="role">Orang Tua / Wali</div>
                    <div class="signature-space"></div>
                    <div class="signature-name">( Nama terang )</div>
                </td>
                <td>
                    <div class="place-date">Dicetak, {{ $printDate }}</div>
                    <div>&nbsp;</div>
                    <div class="role">Wali Kelas</div>
                    <div class="signature-space"></div>
                    <div class="signature-name">{{ $teacherName }}</div>
                </td>
            </tr>
        </table>
    </div>

    <div class="report-footer main-footer">
        Dokumen ini diterbitkan secara elektronik oleh {{ $schoolName }}.
        @if(config('app.url'))
            &nbsp;&bull;&nbsp; {{ config('app.url') }}
        @endif
    </div>
    </div>

    @if(count($attendanceDetails) > 0)
        <div class="details-page">
            <div class="details-heading">
                <h2>Detail Capaian per Pertemuan</h2>
                <p>
                    {{ $student->fullname }} &nbsp;&bull;&nbsp; {{ $classroom->name }}
                    &nbsp;&bull;&nbsp; Tahun akademik {{ $academicYear->name ?? '-' }}
                </p>
            </div>

            <table class="data-table detail-table">
                <thead>
                    <tr>
                        <th style="width: 26px;">No.</th>
                        <th style="width: 69px;">Tanggal</th>
                        <th style="width: 120px;">Mata Pelajaran</th>
                        <th style="width: 65px;">Kehadiran</th>
                        <th class="text-left">Capaian</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($attendanceDetails as $detail)
                        @php
                            $status = $detail['status'] ?? '-';
                            $statusClass = $status === 'present'
                                ? 'status-present'
                                : ($status === 'absent' ? 'status-absent' : 'status-other');
                        @endphp
                        <tr>
                            <td>{{ $loop->iteration }}</td>
                            <td>{{ \Carbon\Carbon::parse($detail['date'])->locale('id')->translatedFormat('d M Y') }}</td>
                            <td class="text-left">{{ $detail['subject'] }}</td>
                            <td>
                                <span class="status {{ $statusClass }}">
                                    {{ $statusLabels[$status] ?? ucfirst($status) }}
                                </span>
                            </td>
                            <td class="text-left">
                                @if(count($detail['accomplishments']) > 0)
                                    @foreach($detail['accomplishments'] as $accomplishment)
                                        <div class="accomplishment-item">
                                            {{ $accomplishment['name'] }}:
                                            <strong>
                                                @if($accomplishment['score'] !== null)
                                                    {{ $accomplishment['score'] }}
                                                @else
                                                    {{ $accomplishment['is_capable'] ? 'Mampu' : 'Belum Mampu' }}
                                                @endif
                                            </strong>
                                        </div>
                                    @endforeach
                                @else
                                    <span class="muted">Belum ada capaian tercatat</span>
                                @endif
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>

            <div class="report-footer">
                Lampiran detail laporan perkembangan siswa &nbsp;&bull;&nbsp; {{ $schoolName }}
            </div>
        </div>
    @endif
</body>
</html>
