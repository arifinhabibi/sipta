<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;


class StudentAttendance extends Model
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

    public function schedule()
    {
        return $this->belongsTo(Schedule::class, 'schedule_id', 'id');
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }
}
