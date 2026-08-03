<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddMissingAssessmentRuntimeColumns extends Migration
{
    public function up()
    {
        if (!Schema::hasColumn('student_accomplishments', 'rated_at')) {
            Schema::table('student_accomplishments', function (Blueprint $table) {
                $table->timestamp('rated_at')->nullable()->after('score');
            });
        }
    }

    public function down()
    {
        // Retained intentionally because application writes depend on it and
        // removing it would discard assessment audit timestamps.
    }
}
