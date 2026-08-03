<?php

namespace Tests\Unit;

use App\Services\AssessmentPeriodDetector;
use PHPUnit\Framework\TestCase;

class AssessmentPeriodDetectorTest extends TestCase
{
    /**
     * @dataProvider assessmentNames
     */
    public function test_detects_only_standalone_period_tokens($name, $expected)
    {
        $this->assertSame(
            $expected,
            (new AssessmentPeriodDetector())->detect($name)
        );
    }

    public function assessmentNames()
    {
        return [
            'plain uts' => ['UTS Tauhid', ['uts']],
            'plain uas' => ['UAS Bahasa Arab', ['uas']],
            'punctuation' => ['Kisi-kisi UTS/UAS', ['uts', 'uas']],
            'evaluasi is not uas' => ['Evaluasi mingguan', []],
            'evaluasi uts is only uts' => ['Evaluasi UTS', ['uts']],
            'lowercase sentence' => ['remedial uas', ['uas']],
            'unrelated word' => ['Membahas materi puasa', []],
        ];
    }
}
