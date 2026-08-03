# Runbook Migrasi Production Santrack

## 1. Ruang lingkup

Runbook ini memigrasikan database legacy `database/backup/sipta_v2.sql` ke
schema bisnis baru.

Jangan menjalankan `migrate:fresh`, `db:wipe`, atau restore langsung ke
database production aktif.

## 2. Baseline dump

Dump mencatat migration lama sampai:

```text
2025_12_29_160751_create_student_classroom_placements_table
```

Migration lama tidak akan dijalankan ulang. Migration upgrade:

| Migration | Fungsi |
| --- | --- |
| `2026_07_28_000000` | Reconcile kolom, ownership, placement, dan status schedule |
| `2026_07_28_005000` | Tambah `student_accomplishments.rated_at` yang hilang |
| `2026_07_28_010000` | Pasang NOT NULL, FK, dan unique business constraints |
| `2026_07_28_020000` | Lifecycle semester, assessment period, creativity, promotion |

## 3. Dampak migration

### Additive

- `users.is_active`
- Ownership `instance_id`
- `schedules.status`, `completed_at`, dan `assessment_period`
- `academic_years.status` dan `closed_at`
- `student_accomplishments.rated_at`
- `student_promotion_decisions`

### Backfill

- Ownership classroom, subject, dan student.
- Schedule `is_completed = true` menjadi `completed`.
- Semester aktif menjadi `status = active`.
- Nama accomplishment yang mengandung UTS/UAS dipakai satu kali untuk
  backfill `assessment_period`.

### Contract/conversion

- `creativity1/creativity2` menjadi `creativity`.
- Global unique subject menjadi unique per instance.
- Ownership menjadi NOT NULL.

Konversi creativity tidak dapat dibalik sempurna. Rollback database harus
memakai snapshot atau PITR.

## 4. Prasyarat

1. Maintenance window disetujui.
2. Full backup selesai dan berhasil diuji restore.
3. Source release sudah ditag.
4. Worker queue dan scheduler dapat dihentikan.
5. Staging berasal dari dump production terbaru.
6. Tim menentukan penanggung jawab koreksi duplicate.

Catat release, database, backup ID, waktu mulai, operator, dan approver.

## 5. Uji staging

### 5.1 Restore

```bash
mysql -u root -p -e "CREATE DATABASE sipta_migration_test"
mysql -u root -p sipta_migration_test \
  < database/backup/sipta_v2.sql
```

Arahkan `.env` ke staging:

```bash
php artisan config:clear
php artisan migrate:status
```

Pastikan migration lama `Yes` dan empat migration upgrade `No`.

### 5.2 Reconcile runtime schema

```bash
php artisan migrate \
  --path=database/migrations/2026_07_28_000000_reconcile_business_schema_v2.php

php artisan migrate \
  --path=database/migrations/2026_07_28_005000_add_missing_assessment_runtime_columns.php
```

### 5.3 Audit

```bash
php artisan santrack:audit-data
```

Semua hasil harus nol:

- Ownership kosong.
- Academic year/classroom/subject duplikat.
- Placement dan schedule slot duplikat.
- Student/teacher attendance duplikat.
- Student assessment duplikat.
- Schedule lintas instance.

Jangan menghapus duplicate otomatis. Tentukan record canonical dan pindahkan
relasinya dengan script yang direview.

### 5.4 Constraint

```bash
php artisan migrate \
  --path=database/migrations/2026_07_28_010000_enforce_business_constraints.php
```

Operasi index, NOT NULL, dan foreign key dapat menahan write. Ukur durasi di
staging dengan volume data yang sama.

### 5.5 Review backfill semester

Sebelum `020000`:

```sql
SELECT COUNT(*) FROM accomplishments
WHERE LOWER(name) LIKE '%uts%';

SELECT COUNT(*) FROM accomplishments
WHERE LOWER(name) LIKE '%uas%';

SELECT type, COUNT(*) FROM accomplishments
GROUP BY type;
```

Setelah hasil disetujui:

```bash
php artisan migrate \
  --path=database/migrations/2026_07_28_020000_add_term_assessment_and_promotion_workflow.php
```

## 6. Deployment production

### 6.1 Sebelum maintenance

1. Pastikan staging lulus.
2. Catat row count tabel utama.
3. Buat snapshot terbaru.
4. Siapkan release aplikasi lama.

### 6.2 Maintenance

```bash
php artisan down --retry=60
php artisan queue:restart
```

Hentikan scheduler dan pastikan worker tidak menulis database.

Deploy dari satu release:

```bash
composer install --no-dev --prefer-dist --optimize-autoloader
php artisan config:clear
php artisan migrate --force
php artisan config:cache
php artisan route:cache
```

Jalankan migration satu kali dari satu node.

### 6.3 Smoke test

1. Login admin dan guru.
2. Buka semester aktif, siswa, dan placement.
3. Buat schedule pada test instance.
4. Simpan attendance dan assessment.
5. Pastikan `rated_at` terisi.
6. Buka rapor siswa dan PDF.
7. Periksa attendance guru.
8. Jalankan `php artisan santrack:audit-data`.

Jika lulus:

```bash
php artisan up
```

Hidupkan scheduler dan queue worker.

## 7. Verifikasi data

Bandingkan row count sebelum dan sesudah untuk users, teachers, students,
subjects, classrooms, schedules, attendances, assessments, dan placements.
Migration tidak boleh menghapus data bisnis tersebut.

## 8. Rollback

Jika smoke test gagal material:

1. Pertahankan maintenance mode.
2. Hentikan worker/scheduler.
3. Ambil salinan database gagal untuk investigasi.
4. Restore snapshot/PITR.
5. Deploy release sebelumnya.
6. Smoke test versi lama.
7. Buka trafik setelah validasi.

Rollback aplikasi saja tidak cukup karena constraint dan conversion data tidak
mempunyai destructive `down`.

## 9. Larangan

- Jangan `migrate:fresh` di production.
- Jangan mengedit tabel `migrations` agar terlihat sukses.
- Jangan menghapus duplicate tanpa memindahkan relasinya.
- Jangan migrate bersamaan dari beberapa node.
- Jangan menganggap backup valid sebelum restore test.
