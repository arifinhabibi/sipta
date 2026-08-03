<?php

namespace Tests\Unit;

use App\Services\DuplicateRepairService;
use Illuminate\Support\Collection;
use PHPUnit\Framework\TestCase;

class DuplicateRepairServiceTest extends TestCase
{
    public function test_latest_update_is_selected_as_canonical()
    {
        $rows = new Collection([
            $this->row('older', '2026-01-01 10:00:00', '2026-01-01 09:00:00'),
            $this->row('latest', '2026-01-02 10:00:00', '2026-01-01 09:00:00'),
            $this->row('middle', '2026-01-01 11:00:00', '2026-01-01 09:00:00'),
        ]);

        $selection = (new DuplicateRepairService())->selectCanonical($rows);

        $this->assertSame('latest', $selection['canonical']->id);
        $this->assertSame(
            ['middle', 'older'],
            $selection['duplicates']->pluck('id')->all()
        );
    }

    public function test_created_at_and_id_are_deterministic_tie_breakers()
    {
        $rows = new Collection([
            $this->row('a', null, '2026-01-01 10:00:00'),
            $this->row('b', null, '2026-01-02 10:00:00'),
            $this->row('c', null, '2026-01-02 10:00:00'),
        ]);

        $selection = (new DuplicateRepairService())->selectCanonical($rows);

        $this->assertSame('c', $selection['canonical']->id);
    }

    public function test_payload_conflict_ignores_timestamps_and_ids()
    {
        $service = new DuplicateRepairService();
        $samePayload = new Collection([
            (object) ['id' => 'a', 'status' => 'present', 'note' => null],
            (object) ['id' => 'b', 'status' => 'present', 'note' => null],
        ]);
        $differentPayload = new Collection([
            (object) ['id' => 'a', 'status' => 'present', 'note' => null],
            (object) ['id' => 'b', 'status' => 'absent', 'note' => null],
        ]);

        $this->assertFalse($service->payloadHasConflict(
            $samePayload,
            ['status', 'note']
        ));
        $this->assertTrue($service->payloadHasConflict(
            $differentPayload,
            ['status', 'note']
        ));
    }

    private function row($id, $updatedAt, $createdAt)
    {
        return (object) [
            'id' => $id,
            'updated_at' => $updatedAt,
            'created_at' => $createdAt,
        ];
    }
}

