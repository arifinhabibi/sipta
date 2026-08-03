<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateAccomplishmentsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('accomplishments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('schedule_id')->constrained('schedules')->cascadeOnDelete();

            $table->string('name');
            $table->enum('type', ['knowledge', 'skill', 'attitude', 'creativity'])
                ->default('knowledge');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('accomplishments');
    }
}
