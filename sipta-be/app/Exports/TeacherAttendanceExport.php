<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use Carbon\Carbon;

class TeacherAttendanceExport implements FromCollection, WithHeadings, WithStyles, ShouldAutoSize, WithTitle, WithColumnWidths, WithEvents
{
    protected $attendances;
    protected $startDate;
    protected $endDate;
    protected $academicYearName;
    protected $teacherName;
    protected $summaryData;
    protected $groupedData;
    protected $uniqueDates;
    protected $sessions = ['Siang', 'Malam'];

    public function __construct($attendances, $startDate, $endDate, $academicYearName = null, $teacherName = null, $summaryData = null)
    {
        $this->attendances = $attendances;
        $this->startDate = $startDate;
        $this->endDate = $endDate;
        $this->academicYearName = $academicYearName;
        $this->teacherName = $teacherName;
        $this->summaryData = $summaryData;

        $this->processGroupedData();
    }

    private function processGroupedData()
    {
        $this->groupedData = [];
        $this->uniqueDates = [];
        $seen = [];

        foreach ($this->attendances as $attendance) {
            // Hanya proses data dengan type = 'check_in'
            if (($attendance['type'] ?? '') != 'check_in') {
                continue;
            }

            $scheduleId = $attendance['schedule_id'] ?? null;
            if ($scheduleId && isset($seen[$scheduleId])) {
                continue;
            }
            if ($scheduleId) {
                $seen[$scheduleId] = true;
            }

            $teacherId = $attendance['teacher_id'] ?? $attendance['teacher_name'];
            $teacherName = $attendance['teacher_name'] ?? 'N/A';
            $date = $attendance['date'] ?? '';
            $session = $this->getSessionFromTime($attendance['schedule_time'] ?? '');
            $status = $attendance['status'] ?? '';
            
            // Tentukan nilai yang ditampilkan di cell
            $displayValue = $this->getDisplayValue($attendance);

            if (!empty($date) && !in_array($date, $this->uniqueDates)) {
                $this->uniqueDates[] = $date;
            }

            if (!isset($this->groupedData[$teacherId])) {
                $this->groupedData[$teacherId] = [
                    'teacher_name' => $teacherName,
                    'teacher_id' => $teacherId,
                    'attendances' => [],
                    'total_hadir_siang' => 0,
                    'total_hadir_malam' => 0,
                    'total_sesi_siang' => 0,
                    'total_sesi_malam' => 0,
                ];
            }

            if (!isset($this->groupedData[$teacherId]['attendances'][$date])) {
                $this->groupedData[$teacherId]['attendances'][$date] = [];
            }

            // Simpan data berdasarkan sesi
            $this->groupedData[$teacherId]['attendances'][$date][$session] = [
                'display_value' => $displayValue,
                'status' => $status,
                'is_hadir' => in_array($status, ['Hadir', 'Terlambat']),
            ];

            // Hitung total per sesi
            $isHadir = in_array($status, ['Hadir', 'Terlambat']);
            
            if ($session == 'Siang') {
                $this->groupedData[$teacherId]['total_sesi_siang']++;
                if ($isHadir) {
                    $this->groupedData[$teacherId]['total_hadir_siang']++;
                }
            } else {
                $this->groupedData[$teacherId]['total_sesi_malam']++;
                if ($isHadir) {
                    $this->groupedData[$teacherId]['total_hadir_malam']++;
                }
            }
        }

        sort($this->uniqueDates);
    }

    /**
     * Tentukan nilai yang ditampilkan di cell berdasarkan status
     * - Hadir/Terlambat: tampilkan jam check-in (dari created_at)
     * - Sakit: tampilkan "Sakit"
     * - Izin: tampilkan "Izin"
     * - Absen: tampilkan "Absen"
     */
    private function getDisplayValue($attendance)
    {
        $status = $attendance['status'] ?? '';
        
        switch ($status) {
            case 'Hadir':
            case 'Terlambat':
                // Tampilkan jam check-in dari created_at
                return $attendance['check_in_time'] ?? '-';
            
            case 'Sakit':
                return 'Sakit';
            
            case 'Izin':
                return 'Izin';
            
            case 'Absen':
                return 'Absen';
            
            default:
                return '-';
        }
    }

    /**
     * Penentuan sesi: < 18:00 = Siang, >= 18:00 = Malam
     */
    private function getSessionFromTime($scheduleTime)
    {
        if (empty($scheduleTime)) return 'Malam';
        
        if (preg_match('/(\d{2}:\d{2})/', $scheduleTime, $match)) {
            $hour = (int)substr($match[1], 0, 2);
            $minute = (int)substr($match[1], 3, 2);
            $totalMinutes = ($hour * 60) + $minute;
            $eveningMinutes = (18 * 60);
            return $totalMinutes < $eveningMinutes ? 'Siang' : 'Malam';
        }
        
        return 'Malam';
    }

    private function getStatusColor($status)
    {
        $colors = [
            'Hadir' => ['bg' => 'C6EFCE', 'text' => '006100'],
            'Terlambat' => ['bg' => 'FFEB9C', 'text' => '9C5700'],
            'Sakit' => ['bg' => 'BDD7EE', 'text' => '1F4E79'],
            'Izin' => ['bg' => 'E4DFEC', 'text' => '5E3A8C'],
            'Absen' => ['bg' => 'F8CECC', 'text' => 'A80000']
        ];
        return $colors[$status] ?? ['bg' => 'FFFFFF', 'text' => '000000'];
    }

    public function collection()
    {
        return collect([]);
    }

    /**
     * Heading: NO, NAMA GURU, TOTAL HADIR SIANG, TOTAL HADIR MALAM, 
     * lalu kolom tanggal (masing2 dengan sub-kolom Siang/Malam)
     */
    public function headings(): array
    {
        $headings = ['NO', 'NAMA GURU', 'TOTAL HADIR SIANG', 'TOTAL HADIR MALAM'];
        
        // Setiap tanggal akan memiliki 2 sub-kolom: Siang dan Malam
        foreach ($this->uniqueDates as $date) {
            $dateFormatted = Carbon::parse($date)->translatedFormat('d M Y');
            $headings[] = $dateFormatted . "\n(Siang)";
            $headings[] = $dateFormatted . "\n(Malam)";
        }
        
        $headings[] = 'TOTAL SESI SIANG';
        $headings[] = 'TOTAL SESI MALAM';
        
        return $headings;
    }

    public function title(): string
    {
        return 'Rekap Absensi Guru';
    }

    public function columnWidths(): array
    {
        $widths = [
            'A' => 6,   // NO
            'B' => 30,  // NAMA GURU
            'C' => 16,  // TOTAL HADIR SIANG
            'D' => 16,  // TOTAL HADIR MALAM
        ];
        
        $col = 'E';
        // Setiap tanggal 2 kolom (Siang & Malam) dengan lebar 15
        for ($i = 0; $i < count($this->uniqueDates); $i++) {
            $widths[$col] = 15;
            $col++;
            $widths[$col] = 15;
            $col++;
        }
        
        // TOTAL SESI SIANG & MALAM
        $widths[$col] = 15;
        $col++;
        $widths[$col] = 15;
        
        return $widths;
    }

    public function styles(Worksheet $sheet)
    {
        $lastColumn = $this->getLastColumn();
        
        // Header Utama
        $sheet->mergeCells('A1:' . $lastColumn . '1');
        $sheet->setCellValue('A1', 'REKAP ABSENSI GURU (2 Sesi/Hari - Siang & Malam)');
        $sheet->getStyle('A1')->applyFromArray([
            'font' => ['bold' => true, 'size' => 16, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '2C3E50']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);

        $currentRow = 2;
        
        if ($this->teacherName) {
            $sheet->mergeCells("A{$currentRow}:{$lastColumn}{$currentRow}");
            $sheet->setCellValue("A{$currentRow}", 'GURU: ' . strtoupper($this->teacherName));
            $sheet->getStyle("A{$currentRow}")->applyFromArray([
                'font' => ['bold' => true, 'size' => 12],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            ]);
            $currentRow++;
        }
        
        $sheet->mergeCells("A{$currentRow}:{$lastColumn}{$currentRow}");
        $periodText = 'PERIODE: ' . Carbon::parse($this->startDate)->format('d F Y') . ' - ' . Carbon::parse($this->endDate)->format('d F Y');
        if ($this->academicYearName) {
            $periodText .= ' | TAHUN AKADEMIK: ' . $this->academicYearName;
        }
        $sheet->setCellValue("A{$currentRow}", $periodText);
        $sheet->getStyle("A{$currentRow}")->applyFromArray([
            'font' => ['bold' => true, 'size' => 11],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);
        $currentRow++;

        $sheet->mergeCells("A{$currentRow}:{$lastColumn}{$currentRow}");
        $sheet->setCellValue("A{$currentRow}", 'DIBUAT PADA: ' . Carbon::now()->format('d F Y H:i:s'));
        $sheet->getStyle("A{$currentRow}")->applyFromArray([
            'font' => ['italic' => true, 'size' => 10],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);
        $currentRow++;

        if ($this->summaryData) {
            $currentRow++;
            $sheet->mergeCells("A{$currentRow}:{$lastColumn}{$currentRow}");
            $sheet->setCellValue("A{$currentRow}", 'RINGKASAN STATISTIK');
            $sheet->getStyle("A{$currentRow}")->applyFromArray(['font' => ['bold' => true, 'size' => 12]]);
            $currentRow++;

            $sheet->mergeCells("A{$currentRow}:C{$currentRow}");
            $sheet->setCellValue("A{$currentRow}", 'Total Data: ' . ($this->summaryData['total_attendances'] ?? 0));
            $sheet->mergeCells("D{$currentRow}:F{$currentRow}");
            $sheet->setCellValue("D{$currentRow}", 'Hadir: ' . ($this->summaryData['present_count'] ?? 0));
            $sheet->mergeCells("G{$currentRow}:I{$currentRow}");
            $sheet->setCellValue("G{$currentRow}", 'Absen: ' . ($this->summaryData['absent_count'] ?? 0));
            $currentRow++;

            $sheet->mergeCells("A{$currentRow}:C{$currentRow}");
            $sheet->setCellValue("A{$currentRow}", 'Terlambat: ' . ($this->summaryData['late_count'] ?? 0));
            $sheet->mergeCells("D{$currentRow}:F{$currentRow}");
            $sheet->setCellValue("D{$currentRow}", 'Sakit: ' . ($this->summaryData['sick_count'] ?? 0));
            $sheet->mergeCells("G{$currentRow}:I{$currentRow}");
            $sheet->setCellValue("G{$currentRow}", 'Izin: ' . ($this->summaryData['permission_count'] ?? 0));
            $currentRow += 2;
        }

        return $sheet;
    }

    private function getLastColumn()
    {
        $colCount = 4 + (count($this->uniqueDates) * 2) + 2;
        return $this->getColumnLetter($colCount);
    }

    private function getColumnLetter($index)
    {
        $letter = '';
        while ($index > 0) {
            $mod = ($index - 1) % 26;
            $letter = chr(65 + $mod) . $letter;
            $index = floor(($index - $mod) / 26);
        }
        return $letter;
    }

    private function addLegend(Worksheet $sheet, $row)
    {
        $lastColumn = $this->getLastColumn();
        $sheet->mergeCells("A{$row}:{$lastColumn}{$row}");
        $sheet->setCellValue("A{$row}", 'LEGENDA: Hijau=Hadir (jam), Kuning=Terlambat (jam), Biru=Sakit, Ungu=Izin, Merah=Absen, Abu-abu=Tidak Ada Absensi');
        $sheet->getStyle("A{$row}")->applyFromArray([
            'font' => ['italic' => true, 'size' => 9, 'color' => ['rgb' => '7F8C8D']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);
        $row++;
        
        $sheet->mergeCells("A{$row}:{$lastColumn}{$row}");
        $sheet->setCellValue("A{$row}", 'CATATAN: Sesi Siang = jam mulai < 18:00, Sesi Malam = jam mulai ≥ 18:00 | "-" berarti tidak ada absensi check-in');
        $sheet->getStyle("A{$row}")->applyFromArray([
            'font' => ['italic' => true, 'size' => 9, 'color' => ['rgb' => '7F8C8D']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function(AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();
                $headerRow = $this->findHeaderRow($sheet);
                
                $headings = $this->headings();
                $col = 'A';
                foreach ($headings as $heading) {
                    $sheet->setCellValue($col . $headerRow, $heading);
                    $col++;
                }
                
                $lastColumn = $this->getLastColumn();
                
                // Style header
                $sheet->getStyle("A{$headerRow}:{$lastColumn}{$headerRow}")->applyFromArray([
                    'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF'], 'size' => 10],
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '3498DB']],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER, 'wrapText' => true],
                    'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => '1B4F72']]],
                ]);
                $sheet->getRowDimension($headerRow)->setRowHeight(40);
                
                // Mapping kolom
                $dateColumns = [];
                $colIndex = 5; // mulai kolom E
                foreach ($this->uniqueDates as $date) {
                    $dateColumns[$date] = [
                        'siang' => $this->getColumnLetter($colIndex),
                        'malam' => $this->getColumnLetter($colIndex + 1)
                    ];
                    $colIndex += 2;
                }
                
                $totalSesiSiangCol = $this->getColumnLetter($colIndex);
                $totalSesiMalamCol = $this->getColumnLetter($colIndex + 1);
                
                // Tulis data per teacher
                $row = $headerRow + 1;
                $no = 1;
                
                foreach ($this->groupedData as $teacher) {
                    // NO
                    $sheet->setCellValue('A' . $row, $no);
                    $sheet->getStyle('A' . $row)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                    $sheet->getStyle('A' . $row)->getFont()->setBold(true);
                    
                    // Nama Guru
                    $sheet->setCellValue('B' . $row, $teacher['teacher_name']);
                    $sheet->getStyle('B' . $row)->getFont()->setBold(true);
                    
                    // TOTAL HADIR SIANG
                    $totalHadirSiang = $teacher['total_hadir_siang'];
                    $sheet->setCellValue('C' . $row, $totalHadirSiang);
                    $sheet->getStyle('C' . $row)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                    $sheet->getStyle('C' . $row)->getFont()->setBold(true);
                    $sheet->getStyle('C' . $row)->applyFromArray([
                        'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'D5E8D4']],
                    ]);
                    
                    // TOTAL HADIR MALAM
                    $totalHadirMalam = $teacher['total_hadir_malam'];
                    $sheet->setCellValue('D' . $row, $totalHadirMalam);
                    $sheet->getStyle('D' . $row)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                    $sheet->getStyle('D' . $row)->getFont()->setBold(true);
                    $sheet->getStyle('D' . $row)->applyFromArray([
                        'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'D5E8D4']],
                    ]);
                    
                    // Isi tiap tanggal (2 kolom: Siang & Malam)
                    foreach ($dateColumns as $date => $cols) {
                        $attendanceData = $teacher['attendances'][$date] ?? [];
                        
                        // Kolom Siang
                        $siangCell = $cols['siang'] . $row;
                        $siangData = $attendanceData['Siang'] ?? null;
                        if ($siangData) {
                            $sheet->setCellValue($siangCell, $siangData['display_value']);
                            $colors = $this->getStatusColor($siangData['status']);
                            $sheet->getStyle($siangCell)->applyFromArray([
                                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => $colors['bg']]],
                                'font' => ['color' => ['rgb' => $colors['text']], 'bold' => true],
                            ]);
                        } else {
                            $sheet->setCellValue($siangCell, '-');
                            $sheet->getStyle($siangCell)->applyFromArray([
                                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'F2F2F2']],
                                'font' => ['color' => ['rgb' => '999999']],
                            ]);
                        }
                        $sheet->getStyle($siangCell)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                        
                        // Kolom Malam
                        $malamCell = $cols['malam'] . $row;
                        $malamData = $attendanceData['Malam'] ?? null;
                        if ($malamData) {
                            $sheet->setCellValue($malamCell, $malamData['display_value']);
                            $colors = $this->getStatusColor($malamData['status']);
                            $sheet->getStyle($malamCell)->applyFromArray([
                                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => $colors['bg']]],
                                'font' => ['color' => ['rgb' => $colors['text']], 'bold' => true],
                            ]);
                        } else {
                            $sheet->setCellValue($malamCell, '-');
                            $sheet->getStyle($malamCell)->applyFromArray([
                                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'F2F2F2']],
                                'font' => ['color' => ['rgb' => '999999']],
                            ]);
                        }
                        $sheet->getStyle($malamCell)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                    }
                    
                    // TOTAL SESI SIANG & MALAM
                    $totalSesiSiang = $teacher['total_sesi_siang'];
                    $totalSesiMalam = $teacher['total_sesi_malam'];
                    $sheet->setCellValue($totalSesiSiangCol . $row, $totalSesiSiang);
                    $sheet->setCellValue($totalSesiMalamCol . $row, $totalSesiMalam);
                    $sheet->getStyle($totalSesiSiangCol . $row)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                    $sheet->getStyle($totalSesiMalamCol . $row)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                    $sheet->getStyle($totalSesiSiangCol . $row)->getFont()->setBold(true);
                    $sheet->getStyle($totalSesiMalamCol . $row)->getFont()->setBold(true);
                    
                    // Alternating row colors
                    $fillColor = ($row % 2 == 0) ? 'F9F9F9' : 'FFFFFF';
                    $sheet->getStyle("A{$row}:{$lastColumn}{$row}")->applyFromArray([
                        'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => $fillColor]]
                    ]);
                    
                    $row++;
                    $no++;
                }
                
                // Border untuk semua data
                $dataEndRow = $row - 1;
                if ($dataEndRow >= $headerRow + 1) {
                    $sheet->getStyle("A{$headerRow}:{$lastColumn}{$dataEndRow}")->applyFromArray([
                        'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => 'D5DBDB']]],
                        'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
                    ]);
                }
                
                $this->addLegend($sheet, $dataEndRow + 2);
                $sheet->freezePane('E' . ($headerRow + 1));
                
                $sheet->getPageSetup()->setOrientation(\PhpOffice\PhpSpreadsheet\Worksheet\PageSetup::ORIENTATION_LANDSCAPE);
                $sheet->getPageSetup()->setPaperSize(\PhpOffice\PhpSpreadsheet\Worksheet\PageSetup::PAPERSIZE_A4);
                $sheet->getPageSetup()->setFitToWidth(1);
                $sheet->getPageSetup()->setHorizontalCentered(true);
            },
        ];
    }

    private function findHeaderRow($sheet)
    {
        $highestRow = $sheet->getHighestRow();
        for ($i = 1; $i <= $highestRow; $i++) {
            $val = trim($sheet->getCell('A' . $i)->getValue());
            if ($val == '' || strpos($val, 'RINGKASAN') !== false) {
                continue;
            }
            if ($val == 'NO' || $val == 'NAMA GURU') {
                return $i;
            }
        }
        return 9;
    }
}