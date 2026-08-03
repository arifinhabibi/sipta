<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;


class Schedule extends Model
{
    use HasFactory;

    protected $keyType = 'string'; // karena UUID string, bukan integer
    public $incrementing = false;  // non-auto increment

    protected $guarded = [];

    protected $casts = [
        'is_completed' => 'boolean',
        'completed_at' => 'datetime',
        'date' => 'date',
    ];


    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->{$model->getKeyName()})) {
                $model->{$model->getKeyName()} = (string) Str::uuid();
            }
        });
    }

    public function teacher()
    {
        return $this->belongsTo(\App\Models\Teacher::class, 'teacher_id', 'id');
    }

    public function classroom()
    {
        return $this->belongsTo(\App\Models\Classroom::class, 'classroom_id', 'id');
    }

    public function subject()
    {
        return $this->belongsTo(\App\Models\Subject::class, 'subject_id', 'id');
    }

    public function teacher_attendances()
    {
        return $this->hasMany(\App\Models\TeacherAttendance::class, 'schedule_id', 'id');
    }

    public function accomplishments()
    {
        return $this->hasMany(\App\Models\Accomplishment::class, 'schedule_id', 'id');
    }

    public function academicYear()
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function studentAttendances()
    {
        return $this->hasMany(StudentAttendance::class);
    }

    public function scopeForAssessmentPeriod($query, $period)
    {
        return $query->where('assessment_period', $period);
    }

    public function markCompleted()
    {
        $this->update([
            'status' => 'completed',
            'is_completed' => true,
            'completed_at' => now(),
        ]);
    }

    public function markScheduled()
    {
        $this->update([
            'status' => 'scheduled',
            'is_completed' => false,
            'completed_at' => null,
        ]);
    }
}
