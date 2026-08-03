<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateSubjectsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('subjects', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('instance_id')->constrained('instances')->cascadeOnDelete();

            $table->string('name');
            $table->string('code')->nullable();
            $table->text('description')->nullable();
            $table->timestamps();

            $table->unique(['instance_id', 'name'], 'subjects_instance_name_unique');
            $table->unique(['instance_id', 'code'], 'subjects_instance_code_unique');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('subjects');
    }
}
