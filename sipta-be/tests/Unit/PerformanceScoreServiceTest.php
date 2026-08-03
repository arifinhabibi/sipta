<?php

namespace Tests\Unit;

use App\Services\PerformanceScoreService;
use Tests\TestCase;

class PerformanceScoreServiceTest extends TestCase
{
    public function test_all_performance_dimensions_use_configured_weights()
    {
        $score = app(PerformanceScoreService::class)->calculate(100, [
            'knowledge' => 100,
            'skill' => 100,
            'attitude' => 100,
            'creativity1' => 100,
            'creativity2' => 100,
        ]);

        $this->assertSame(100.0, $score);
    }

    public function test_knowledge_score_is_not_ignored()
    {
        $score = app(PerformanceScoreService::class)->calculate(0, [
            'knowledge' => 80,
            'skill' => 0,
            'attitude' => 0,
            'creativity1' => 0,
            'creativity2' => 0,
        ]);

        $this->assertSame(20.0, $score);
    }

    public function test_promotion_only_applies_after_even_semester()
    {
        $service = app(PerformanceScoreService::class);
        $this->assertSame(
            'continue_same_class',
            $service->promotionRecommendation('ganjil', 90, 95)
        );
        $this->assertSame(
            'promote',
            $service->promotionRecommendation('genap', 90, 95)
        );
        $this->assertSame(
            'review',
            $service->promotionRecommendation('genap', 60, 95)
        );
    }

    public function test_subject_score_excludes_attendance_and_uses_exam_weights()
    {
        $score = app(PerformanceScoreService::class)->calculateSubject([
            'regular' => 80,
            'uts' => 70,
            'uas' => 90,
        ]);

        $this->assertSame(81.0, $score);
    }

    public function test_report_average_is_mean_of_subject_final_scores()
    {
        $score = app(PerformanceScoreService::class)->averageSubjects([
            81,
            61,
            null,
        ]);

        $this->assertSame(71.0, $score);
    }
}
