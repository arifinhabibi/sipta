<?php

return [
    'assessment' => [
        'skill_passing_score' => (int) env('SANTRACK_SKILL_PASSING_SCORE', 65),
        'promotion_passing_score' => (int) env('SANTRACK_PROMOTION_PASSING_SCORE', 65),
        'promotion_min_attendance' => (int) env('SANTRACK_PROMOTION_MIN_ATTENDANCE', 75),
        'subject_weights' => [
            'regular' => 0.40,
            'uts' => 0.25,
            'uas' => 0.35,
        ],
        // Temporary compatibility for deprecated ReportController methods.
        'legacy_performance_weights' => [
            'attendance' => 0.20,
            'knowledge' => 0.25,
            'skill' => 0.20,
            'attitude' => 0.15,
            'creativity1' => 0.10,
            'creativity2' => 0.10,
        ],
    ],

    'teacher_attendance' => [
        'grace_minutes' => (int) env('SANTRACK_TEACHER_GRACE_MINUTES', 15),
    ],

    'reports' => [
        'attendance_recipients' => array_values(array_filter(array_map(
            'trim',
            explode(',', env('SANTRACK_ATTENDANCE_REPORT_RECIPIENTS', ''))
        ))),
    ],
];
