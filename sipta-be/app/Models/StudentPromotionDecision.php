<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class StudentPromotionDecision extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';
    protected $guarded = [];
    protected $casts = [
        'final_score' => 'float',
        'attendance_percentage' => 'float',
        'decided_at' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (!$model->getKey()) {
                $model->{$model->getKeyName()} = (string) Str::uuid();
            }
        });
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function sourceAcademicYear()
    {
        return $this->belongsTo(AcademicYear::class, 'source_academic_year_id');
    }

    public function targetAcademicYear()
    {
        return $this->belongsTo(AcademicYear::class, 'target_academic_year_id');
    }

    public function sourceClassroom()
    {
        return $this->belongsTo(Classroom::class, 'source_classroom_id');
    }

    public function targetClassroom()
    {
        return $this->belongsTo(Classroom::class, 'target_classroom_id');
    }
}
