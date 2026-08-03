<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateStudentsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('students', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('instance_id')
                ->constrained('instances')
                ->cascadeOnDelete();

            $table->string('fullname');
            $table->string('birth_place')->nullable()->comment('The Place of birth');
            $table->date('birth_date')->nullable();
            $table->enum('gender', ['male', 'female']);
            $table->string('father_name')->nullable();
            $table->string('mother_name')->nullable();
            $table->text('address')->nullable();
            $table->string('phone')->nullable();
            $table->string('photo')->nullable()->comment('Profile picture path');
            $table->string('birth_certificate')->nullable();
            $table->string('family_card')->nullable();
            $table->string('id_card_father')->nullable();
            $table->string('id_card_mother')->nullable();
            $table->string('adverb')->nullable()->comment('Status Family, e.g. Dhuafa, Yatim, Piatu');
            $table->enum('status', ['active', 'inactive'])->default('active');
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
        Schema::dropIfExists('students');
    }
}
