<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Classroom extends Model
{
    use HasFactory;

    protected $keyType = 'string';
    public $incrementing = false;
    protected $guarded = [];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->{$model->getKeyName()})) {
                $model->{$model->getKeyName()} = (string) Str::uuid();
            }
        });
    }

    public function instance()
    {
        return $this->belongsTo(Instance::class);
    }

    public function teacher()
    {
        return $this->belongsTo(Teacher::class);
    }

    public function schedules()
    {
        return $this->hasMany(Schedule::class);
    }

    public function placements()
    {
        return $this->hasMany(StudentClassroomPlacement::class);
    }

    public function students()
    {
        return $this->belongsToMany(
            Student::class,
            'student_classroom_placements',
            'classroom_id',
            'student_id'
        )->withPivot('academic_year_id', 'is_current')->withTimestamps();
    }

    public function academicYears()
    {
        return $this->belongsToMany(
            AcademicYear::class,
            'student_classroom_placements',
            'classroom_id',
            'academic_year_id'
        )->distinct();
    }

    public function studentsInAcademicYear($academicYearId)
    {
        return $this->students()
            ->wherePivot('academic_year_id', $academicYearId);
    }

    public function getCurrentStudentCountAttribute()
    {
        $academicYearId = AcademicYear::where(
            'instance_id',
            $this->instance_id
        )->active()->value('id');

        if (!$academicYearId) {
            return 0;
        }

        return $this->placements()
            ->where('academic_year_id', $academicYearId)
            ->count();
    }

    public function scopeForInstance($query, $instanceId)
    {
        return $query->where('instance_id', $instanceId);
    }

    public function scopeInAcademicYear($query, $academicYearId)
    {
        return $query->whereHas('placements', function ($placementQuery) use (
            $academicYearId
        ) {
            $placementQuery->where('academic_year_id', $academicYearId);
        });
    }
}
