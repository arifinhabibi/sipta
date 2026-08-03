<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;


class AcademicYear extends Model
{
    use HasFactory;

    protected $keyType = 'string'; // karena UUID string, bukan integer
    public $incrementing = false;  // non-auto increment

    protected $guarded = [];

    protected $casts = [
        'is_active' => 'boolean',
        'is_promoted' => 'boolean',
        'start_periode' => 'date',
        'end_periode' => 'date',
        'closed_at' => 'datetime',
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

    public function instance()
    {
        return $this->belongsTo(Instance::class);
    }

    public function placements()
    {
        return $this->hasMany(StudentClassroomPlacement::class);
    }

    public function schedules()
    {
        return $this->hasMany(Schedule::class);
    }

    public function promotionDecisionsAsSource()
    {
        return $this->hasMany(StudentPromotionDecision::class, 'source_academic_year_id');
    }

    public function promotionDecisionsAsTarget()
    {
        return $this->hasMany(StudentPromotionDecision::class, 'target_academic_year_id');
    }

    public function isOddSemester()
    {
        return $this->periode === 'ganjil';
    }

    public function isEvenSemester()
    {
        return $this->periode === 'genap';
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
