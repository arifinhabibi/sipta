<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;


class Instance extends Model
{
    use HasFactory;

    protected $keyType = 'string'; // karena UUID string, bukan integer
    public $incrementing = false;  // non-auto increment

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

    public function academicYears()
    {
        return $this->hasMany(AcademicYear::class, 'instance_id', 'id');
    }

    public function teachers()
    {
        return $this->hasMany(Teacher::class);
    }

    public function students()
    {
        return $this->hasMany(Student::class);
    }

    public function classrooms()
    {
        return $this->hasMany(Classroom::class);
    }

    public function subjects()
    {
        return $this->hasMany(Subject::class);
    }

    public function activeAcademicYear()
    {
        return $this->hasOne(AcademicYear::class)->where('is_active', true);
    }
}
