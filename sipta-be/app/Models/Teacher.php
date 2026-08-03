<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;


class Teacher extends Model
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

    public function instance()
    {
        return $this->belongsTo(\App\Models\Instance::class, 'instance_id', 'id');
    }

    public function classrooms()
    {
        return $this->hasMany(\App\Models\Classroom::class, 'teacher_id', 'id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function schedules()
    {
        return $this->hasMany(Schedule::class);
    }

    public function attendances()
    {
        return $this->hasMany(TeacherAttendance::class);
    }
}
