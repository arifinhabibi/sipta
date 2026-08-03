<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Laporan Performa Siswa</title>
    <style>
        body { font-family: sans-serif; font-size: 12px; color: #222; }
        h1 { font-size: 20px; margin-bottom: 4px; }
        .muted { color: #666; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th, td { border: 1px solid #bbb; padding: 7px; text-align: left; }
        th { background: #eee; }
        .score { font-size: 24px; font-weight: bold; }
    </style>
</head>
<body>
    <h1>Laporan Performa Siswa</h1>
    <div>{{ $performance['student']->fullname }}</div>
    <div class="muted">
        {{ $performance['academic_year']->name }}
        · Semester {{ ucfirst($performance['academic_year']->periode) }}
        · {{ $performance['classroom']->name }}
    </div>

    <p>
        Nilai:
        <span class="score">
            {{ $performance['is_complete']
                ? number_format($performance['final_score'], 2)
                : number_format($performance['provisional_score'], 2) }}
        </span>
        ({{ $performance['is_complete'] ? 'final' : 'sementara' }})
    </p>

    <p>
        Kehadiran:
        <strong>{{ number_format($performance['attendance']['percentage'], 2) }}%</strong>
        ({{ $performance['attendance']['attended_sessions'] }} dari
        {{ $performance['attendance']['expected_sessions'] }} sesi)
    </p>

    <table>
        <tr>
            <th>Mata pelajaran</th>
            <th>Reguler 40%</th>
            <th>UTS 25%</th>
            <th>UAS 35%</th>
            <th>Nilai akhir</th>
            <th>Status</th>
        </tr>
        @foreach ($performance['subjects'] as $subject)
            <tr>
                <td>{{ $subject['subject']->name }}</td>
                <td>{{ $subject['assessment_averages']['regular'] === null
                    ? '-' : number_format($subject['assessment_averages']['regular'], 2) }}</td>
                <td>{{ $subject['assessment_averages']['uts'] === null
                    ? '-' : number_format($subject['assessment_averages']['uts'], 2) }}</td>
                <td>{{ $subject['assessment_averages']['uas'] === null
                    ? '-' : number_format($subject['assessment_averages']['uas'], 2) }}</td>
                <td>{{ $subject['final_score'] === null
                    ? number_format($subject['provisional_score'], 2) . ' *'
                    : number_format($subject['final_score'], 2) }}</td>
                <td>{{ $subject['is_complete'] ? 'Final' : 'Belum lengkap' }}</td>
            </tr>
        @endforeach
    </table>

    <p class="muted">
        * Nilai sementara karena komponen Reguler, UTS, atau UAS belum lengkap.
    </p>

    <p>
        Rekomendasi transisi:
        <strong>{{ $performance['promotion_recommendation'] }}</strong>
    </p>
</body>
</html>
