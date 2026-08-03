<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateAcademicYearsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('academic_years', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('instance_id')->constrained('instances')->cascadeOnDelete();
            $table->string('name');
            $table->enum('periode', ['ganjil', 'genap']);
            $table->date('start_periode');
            $table->date('end_periode');
            $table->boolean('is_active')->default(true);
            $table->boolean('is_promoted')->default(false);
            $table->enum('status', ['draft', 'active', 'closed'])->default('draft');
            $table->timestamp('closed_at')->nullable();
            $table->timestamps();

            $table->unique(
                ['instance_id', 'name', 'periode'],
                'academic_years_instance_name_period_unique'
            );
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('academic_years');
    }
}
