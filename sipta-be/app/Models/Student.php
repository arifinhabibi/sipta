<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;


class Student extends Model
{
    use HasFactory;

    protected $guarded = [];

    protected $keyType = 'string'; // karena UUID string, bukan integer
    public $incrementing = false;  // non-auto increment


    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->{$model->getKeyName()})) {
                $model->{$model->getKeyName()} = (string) Str::uuid();
            }
        });
    }

    public function attendances()
    {
        return $this->hasMany(\App\Models\StudentAttendance::class, 'student_id', 'id');
    }

    public function accomplishments()
    {
        return $this->hasMany(\App\Models\StudentAccomplishment::class, 'student_id', 'id');
    }

    public function instance()
    {
        return $this->belongsTo(Instance::class);
    }

    public function placements()
    {
        return $this->hasMany(StudentClassroomPlacement::class);
    }

    public function currentPlacement()
    {
        return $this->hasOne(StudentClassroomPlacement::class)
            ->where('is_current', true)
            ->latest('created_at');
    }

    public function classrooms()
    {
        return $this->belongsToMany(
            Classroom::class,
            'student_classroom_placements',
            'student_id',
            'classroom_id'
        )->withPivot('academic_year_id', 'is_current')->withTimestamps();
    }

    public function promotionDecisions()
    {
        return $this->hasMany(StudentPromotionDecision::class);
    }

    public function scopeForInstance($query, $instanceId)
    {
        return $query->where('instance_id', $instanceId);
    }
}
