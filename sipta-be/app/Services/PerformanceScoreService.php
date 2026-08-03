<?php

namespace App\Services;

class PerformanceScoreService
{
    public function calculate($attendancePercentage, array $averageScores)
    {
        $weights = config('santrack.assessment.legacy_performance_weights');
        $score = $attendancePercentage * $weights['attendance'];

        foreach (
            ['knowledge', 'skill', 'attitude', 'creativity1', 'creativity2']
            as $type
        ) {
            $score += (isset($averageScores[$type])
                ? $averageScores[$type]
                : 0) * $weights[$type];
        }

        return round($score, 2);
    }

    public function promotionRecommendation(
        $semester,
        $finalScore,
        $attendancePercentage
    ) {
        if ($semester === 'ganjil') {
            return 'continue_same_class';
        }

        if (
            $finalScore >= config('santrack.assessment.promotion_passing_score')
            && $attendancePercentage >= config(
                'santrack.assessment.promotion_min_attendance'
            )
        ) {
            return 'promote';
        }

        return 'review';
    }

    public function calculateSubject(
        array $assessmentAverages,
        $provisional = false
    ) {
        $weights = config('santrack.assessment.subject_weights');
        $score = 0;
        $appliedWeight = 0;

        foreach ($weights as $period => $weight) {
            $value = isset($assessmentAverages[$period])
                ? $assessmentAverages[$period] : null;
            if ($value === null && $provisional) {
                continue;
            }
            $score += ($value ?: 0) * $weight;
            $appliedWeight += $weight;
        }

        return $appliedWeight > 0
            ? round($score / ($provisional ? $appliedWeight : 1), 2)
            : null;
    }

    public function averageSubjects(array $scores)
    {
        $scores = array_values(array_filter($scores, function ($score) {
            return $score !== null;
        }));

        return count($scores)
            ? round(array_sum($scores) / count($scores), 2)
            : null;
    }
}
