<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;


class Subject extends Model
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
        return $this->belongsTo(Instance::class);
    }

    public function schedules()
    {
        return $this->hasMany(Schedule::class);
    }

    public function scopeForInstance($query, $instanceId)
    {
        return $query->where('instance_id', $instanceId);
    }
}
