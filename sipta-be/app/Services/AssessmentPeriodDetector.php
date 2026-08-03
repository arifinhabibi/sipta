<?php

namespace App\Services;

class AssessmentPeriodDetector
{
    public function detect($name)
    {
        $periods = [];
        foreach (['uts', 'uas'] as $period) {
            if (preg_match(
                '/(^|[^a-z0-9])' . $period . '([^a-z0-9]|$)/i',
                (string) $name
            )) {
                $periods[] = $period;
            }
        }

        return $periods;
    }
}

