# Runbook Migrasi Database SIPTA v2 ke v3

Dokumen ini menjelaskan urutan memindahkan database SIPTA lama ke database baru,
menjalankan upgrade schema, memperbaiki data legacy, dan melakukan cutover
production. Sumber teknisnya adalah migration dan command di `sipta-be/`.

## 1. Prinsip utama

Urutan yang benar:

```text
database baru kosong
→ import dump database lama
→ reconciliation migration
→ audit
→ repair duplicate dan konflik data
→ audit harus nol
→ unique constraints
→ workflow semester/promosi
→ verifikasi dan smoke test
→ cutover aplikasi
```

Jangan menjalankan `migrate:fresh` sebelum atau sesudah import. Dump
`sipta-be/database/backup/sipta_v2.sql` sudah membawa schema, data, dan tabel
`migrations` sampai migration placement tahun 2025.

> **Peringatan:** dump memiliki perintah `DROP TABLE` dan data sensitif. Jangan
> import ke database yang masih ingin dipertahankan. Jangan commit dump
> production, token, credential, atau hasil backup baru ke Git.

## 2. Kondisi saat ini

- Database `sipta_v3` lokal sudah pernah dimigrasikan dan diperbaiki.
- Jangan import `sipta_v2.sql` ulang di atas `sipta_v3` tersebut.
- Gunakan database baru seperti `sipta_v3_rehearsal` untuk mengulang simulasi.
- Production harus memakai dump production terbaru. File backup repository
  hanya snapshot lama untuk pengujian, bukan dasar final cutover.

## 3. Fase A — rehearsal lokal

### A1. Pastikan tool tersedia

```powershell
mysql --version
php --version
cd D:\argasolusi\sipta\sipta-be
php artisan --version
```

### A2. Buat database rehearsal kosong

```powershell
mysql -u root -p -e "CREATE DATABASE sipta_v3_rehearsal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

Jika database itu sudah ada, jangan langsung drop. Gunakan nama baru, misalnya
`sipta_v3_rehearsal_2`, atau pastikan lebih dahulu tidak ada data yang perlu
dipertahankan.

### A3. Import dump v2

Jalankan dari PowerShell:

```powershell
mysql -u root -p --database=sipta_v3_rehearsal --execute="SOURCE D:/argasolusi/sipta/sipta-be/database/backup/sipta_v2.sql"
```

Jangan menaruh password pada command line. Masukkan password melalui prompt.

### A4. Arahkan backend ke database rehearsal

Ubah koneksi database pada `sipta-be/.env`:

```env
APP_ENV=local
APP_DEBUG=true

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=sipta_v3_rehearsal
DB_USERNAME=root
DB_PASSWORD=
```

Nama variable boleh didokumentasikan, tetapi nilai credential production tidak
boleh dicopy ke dokumen ini.

### A5. Bersihkan cache konfigurasi dan verifikasi target

```powershell
cd D:\argasolusi\sipta\sipta-be
php artisan config:clear
php artisan cache:clear
php artisan env
php artisan migrate:status
```

Sebelum melanjutkan, pastikan:

- environment adalah `local` atau environment rehearsal;
- backend benar-benar memakai database `sipta_v3_rehearsal`;
- migration lama sampai
  `2025_12_29_160751_create_student_classroom_placements_table` berstatus
  `Yes`;
- keempat migration `2026_07_28_*` masih berstatus `No`.

## 4. Fase B — upgrade schema secara bertahap

### B1. Jalankan reconciliation migration

```powershell
php artisan migrate --path=database/migrations/2026_07_28_000000_reconcile_business_schema_v2.php
php artisan migrate --path=database/migrations/2026_07_28_005000_add_missing_assessment_runtime_columns.php
```

Migration ini harus dijalankan sebelum unique constraints karena schema legacy
dan runtime assessment harus direkonsiliasi lebih dahulu.

### B2. Audit pertama

```powershell
php artisan santrack:audit-data
```

Audit memeriksa:

- ownership classroom, subject, dan student;
- duplicate placement dan academic year;
- duplicate classroom dan subject;
- duplicate slot schedule;
- duplicate attendance guru/siswa;
- duplicate assessment siswa;
- schedule lintas instance.

Jika ada satu saja `FIX REQUIRED`, jangan jalankan migration constraint.

### B3. Dry-run repair duplicate retry

```powershell
php artisan santrack:repair-duplicates
```

Command ini tidak mengubah data. Review:

- `Duplicate groups`;
- `Extra rows`;
- `Payload conflicts`;
- daftar schedule conflict dan jumlah relasinya.

Repair otomatis hanya mencakup:

- `student_attendances`;
- `teacher_attendances`;
- `student_accomplishments`.

Record canonical dipilih berdasarkan `updated_at`, kemudian `created_at`, lalu
`id` paling baru. Pastikan aturan ini sesuai dengan data hasil rehearsal.

### B4. Apply repair duplicate

Setelah dry-run disetujui:

```powershell
php artisan santrack:repair-duplicates --apply --confirm=REPAIR_DUPLICATES
```

Apply berjalan dalam transaction dan membuat log di:

```text
sipta-be/storage/logs/santrack-duplicate-repair-*.json
```

Simpan log tersebut sebagai bukti migrasi, tetapi jangan commit jika mengandung
identifier/data production.

### B5. Selesaikan schedule conflict

Schedule conflict tidak diperbaiki otomatis. Jalankan kembali dry-run:

```powershell
php artisan santrack:repair-duplicates
```

Untuk setiap pasangan schedule dengan classroom, tanggal, jam mulai, dan jam
selesai yang sama:

1. catat kedua ID schedule;
2. periksa teacher, subject, status, attendance, dan accomplishment;
3. jika keduanya valid, reschedule salah satunya;
4. jika salah satunya duplicate, tentukan record canonical;
5. pindahkan relasi yang wajib dipertahankan ke canonical;
6. hapus record salah hanya setelah seluruh relasi diverifikasi;
7. catat keputusan dan row count sebelum/sesudah.

Jangan menghapus schedule yang memiliki attendance atau accomplishment tanpa
review relasi. Karena repository tidak menyediakan auto-repair schedule,
perbaikannya harus dibuat dan diuji khusus berdasarkan ID hasil dry-run.

### B6. Audit harus nol

```powershell
php artisan santrack:audit-data
```

Syarat melanjutkan:

```text
semua Count = 0
semua Status = OK
```

### B7. Tambahkan business constraints

```powershell
php artisan migrate --path=database/migrations/2026_07_28_010000_enforce_business_constraints.php
```

Migration ini menambahkan unique constraints untuk academic year, classroom,
placement, schedule slot, attendance, assessment, dan subject per instance.
Migration akan gagal jika duplicate masih tersisa.

### B8. Tambahkan workflow semester dan promosi

```powershell
php artisan migrate --path=database/migrations/2026_07_28_020000_add_term_assessment_and_promotion_workflow.php
```

Migration ini antara lain menambahkan:

- status `draft`, `active`, dan `closed` pada academic year;
- `assessment_period` pada schedule;
- normalisasi type accomplishment;
- tabel `student_promotion_decisions`.

Jika migration menemukan satu schedule dengan marker UTS dan UAS sekaligus,
perbaiki nama assessment yang ambigu lalu ulangi migration.

## 5. Fase C — verifikasi database hasil migration

### C1. Status dan audit

```powershell
php artisan migrate:status
php artisan santrack:audit-data
```

Migration berikut harus `Yes`:

```text
2026_07_28_000000_reconcile_business_schema_v2
2026_07_28_005000_add_missing_assessment_runtime_columns
2026_07_28_010000_enforce_business_constraints
2026_07_28_020000_add_term_assessment_and_promotion_workflow
```

### C2. Automated check yang tersedia

```powershell
php artisan test
php artisan route:list --path=api
```

Jika test gagal, bedakan failure baseline dengan failure akibat schema/data baru.

### C3. Bandingkan data utama

Bandingkan jumlah record sebelum dan sesudah untuk minimal:

- instances dan users;
- teachers, students, dan classrooms;
- academic years dan placements;
- subjects dan schedules;
- teacher/student attendances;
- accomplishments dan student accomplishments.

Penurunan record hanya diperbolehkan untuk duplicate yang memang sudah dicatat
dalam repair log.

## 6. Fase D — perbaikan roster pergantian semester

Roster classroom berasal dari `student_classroom_placements` pada semester yang
dipilih. Mengaktifkan semester target tanpa placement membuat kelas tampak
kosong meskipun master student tidak hilang.

### D1. Inspeksi tanpa perubahan

```powershell
php artisan santrack:repair-semester-transition
```

### D2. Dry-run pasangan semester

Gunakan UUID sumber dan target dari hasil inspeksi:

```powershell
php artisan santrack:repair-semester-transition SOURCE_UUID TARGET_UUID
```

### D3. Apply bila benar-benar diperlukan

```powershell
php artisan santrack:repair-semester-transition SOURCE_UUID TARGET_UUID --apply --confirm=REPAIR_SEMESTER_TRANSITION
php artisan santrack:audit-data
```

Jangan menjalankan apply jika roster target sudah lengkap.

Opsi berikut hanya digunakan apabila dry-run membuktikan klasifikasi jadwal dan
rentang tanggalnya benar:

```powershell
php artisan santrack:repair-semester-transition SOURCE_UUID TARGET_UUID --apply --resolve-past-schedules --move-target-schedules --confirm=REPAIR_SEMESTER_TRANSITION
```

`--resolve-past-schedules` mengubah jadwal lampau berdasarkan bukti aktivitas,
sedangkan `--move-target-schedules` memindahkan jadwal yang tanggalnya masuk
rentang semester target.

## 7. Fase E — smoke test aplikasi

Jalankan backend terhadap database hasil migration:

```powershell
php artisan serve
```

Uji dengan FE lama terlebih dahulu, kemudian FE candidate:

1. login, refresh session, dan logout admin/guru;
2. buka academic year aktif;
3. buka classroom, student, dan placement;
4. pastikan roster tidak kosong setelah ganjil ke genap;
5. buat/edit schedule dan subject;
6. teacher attendance check-in/check-out;
7. student attendance, termasuk retry request;
8. assessment dan accomplishment;
9. close/rollover semester pada data rehearsal;
10. promotion/kenaikan kelas pada data rehearsal;
11. laporan student/classroom dan attendance guru;
12. laporan setiap semester harus menggunakan `academic_year_id` dan semester
    tertutup harus read-only;
13. PDF/spreadsheet harus sesuai periode yang dipilih;
14. periksa application log, failed job, queue, dan scheduler.

FE tidak terhubung langsung ke MySQL. Jika URL API tetap sama, FE tidak perlu
mengubah nama database; koneksi database diatur oleh environment BE.

## 8. Fase F — persiapan production

### F1. Go/no-go

Production hanya boleh dilanjutkan jika:

- [ ] backup/PITR production tersedia dan restore-nya sudah diuji;
- [ ] rehearsal menggunakan snapshot production yang cukup baru;
- [ ] seluruh migration berhasil pada rehearsal;
- [ ] audit akhir rehearsal nol;
- [ ] schedule conflict memiliki keputusan repair yang terdokumentasi;
- [ ] row count dan deleted ID sudah direview;
- [ ] FE production lama kompatibel dengan BE/schema baru;
- [ ] durasi import, migration, repair, dan audit masuk maintenance window;
- [ ] rollback release BE dan koneksi DB sudah disiapkan;
- [ ] operator database dan aplikasi tersedia selama cutover.

### F2. Mengapa perlu final dump

Database rehearsal tidak boleh langsung dianggap sebagai production. Data bisa
berubah setelah snapshot rehearsal dibuat. Saat cutover, hentikan write lalu
ambil final dump agar transaksi terbaru tidak hilang.

## 9. Fase G — cutover production

Urutan final yang direkomendasikan:

```text
aktifkan maintenance
→ hentikan queue worker dan scheduler
→ pastikan tidak ada write aktif
→ ambil final backup database lama
→ restore final backup ke database production baru yang kosong
→ arahkan release BE secara privat ke database baru
→ jalankan urutan migration dan repair yang sudah diuji
→ audit nol dan smoke test privat
→ ganti koneksi BE production ke database baru
→ clear config/cache dan restart worker
→ smoke test melalui endpoint production
→ buka maintenance
→ monitor
```

### G1. Setelah `.env` BE diarahkan ke DB baru

```powershell
php artisan config:clear
php artisan cache:clear
php artisan migrate:status
```

Jangan lanjut jika nama/status database tidak sesuai dengan target baru.

### G2. Migration production

Ikuti urutan yang sama seperti rehearsal. Setiap migration production memerlukan
`--force`:

```powershell
php artisan migrate --path=database/migrations/2026_07_28_000000_reconcile_business_schema_v2.php --force
php artisan migrate --path=database/migrations/2026_07_28_005000_add_missing_assessment_runtime_columns.php --force
php artisan santrack:audit-data
php artisan santrack:repair-duplicates
```

Setelah output dry-run sesuai rehearsal dan backup sudah terverifikasi:

```powershell
php artisan santrack:repair-duplicates --apply --confirm=REPAIR_DUPLICATES --force
php artisan santrack:audit-data
```

Perbaiki schedule conflict menggunakan keputusan yang sudah diuji. Setelah
audit nol:

```powershell
php artisan migrate --path=database/migrations/2026_07_28_010000_enforce_business_constraints.php --force
php artisan migrate --path=database/migrations/2026_07_28_020000_add_term_assessment_and_promotion_workflow.php --force
php artisan migrate:status
php artisan santrack:audit-data
```

Jangan menjalankan satu `php artisan migrate --force` sebelum fase audit/repair,
karena migration constraint memang mensyaratkan duplicate sudah bersih.

### G3. Restart runtime

Gunakan process manager production yang sebenarnya. Secara konsep:

```powershell
php artisan config:clear
php artisan cache:clear
php artisan queue:restart
```

Restart service PHP-FPM/web server/worker/scheduler melalui Supervisor, systemd,
container orchestrator, atau platform yang digunakan production.

### G4. Buka traffic bertahap

Sebelum maintenance dibuka, uji minimal:

- health/API route;
- login admin dan guru;
- classroom dan roster semester aktif;
- schedule;
- attendance;
- report semester aktif dan semester lama;
- audit data tetap nol;
- application/worker log tidak menghasilkan error baru.

## 10. Rollback

### Sebelum koneksi dialihkan

Jika import/migration/repair gagal, jangan switch BE. Perbaiki database target
atau buat ulang target dari final backup. Production lama tetap menjadi sumber
aktif.

### Setelah koneksi dialihkan

Jika terjadi kegagalan serius:

1. masuk maintenance kembali;
2. hentikan worker dan write;
3. simpan snapshot database baru untuk investigasi;
4. deploy release BE lama;
5. arahkan koneksi kembali ke database lama hanya jika belum terjadi write yang
   membuat kedua database berbeda;
6. jika write sudah terjadi di database baru, gunakan rencana rekonsiliasi/PITR
   yang disetujui DBA—jangan switch bolak-balik secara buta.

Jangan mengandalkan `php artisan migrate:rollback`. Migration constraints
sengaja mempertahankan constraint pada `down()`, dan DDL MySQL tidak boleh
dianggap sebagai transaksi atomik penuh.

Database lama jangan langsung dihapus. Jadikan read-only dan pertahankan selama
masa observasi/rollback yang disepakati.

## 11. Checklist ringkas eksekusi

### Rehearsal

- [ ] Buat database rehearsal baru.
- [ ] Import dump v2.
- [ ] Verifikasi `.env` dan `migrate:status`.
- [ ] Jalankan migration `000000` dan `005000`.
- [ ] Jalankan audit.
- [ ] Dry-run dan apply duplicate repair.
- [ ] Selesaikan schedule conflict.
- [ ] Pastikan audit nol.
- [ ] Jalankan migration `010000` dan `020000`.
- [ ] Jalankan audit, test, row-count comparison, dan smoke test.
- [ ] Uji roster semester dan laporan historis.

### Production

- [ ] Aktifkan maintenance dan hentikan seluruh write.
- [ ] Ambil final backup serta uji target restore.
- [ ] Restore ke database production baru.
- [ ] Jalankan prosedur yang sama dengan rehearsal menggunakan `--force`.
- [ ] Pastikan audit nol dan migration seluruhnya `Yes`.
- [ ] Arahkan BE ke database baru.
- [ ] Clear cache dan restart runtime/worker.
- [ ] Smoke test sebelum membuka traffic.
- [ ] Buka traffic dan monitor error, queue, database, serta fungsi utama.
- [ ] Pertahankan database lama sebagai rollback read-only.

## 12. Larangan

- Jangan menjalankan `migrate:fresh`, `db:wipe`, atau seeder development di
  production.
- Jangan import dump ke database yang masih diperlukan.
- Jangan menjalankan constraint migration ketika audit belum nol.
- Jangan menghapus schedule conflict tanpa memeriksa seluruh relasi.
- Jangan reaktivasi semester lama hanya untuk melihat laporan.
- Jangan menggunakan snapshot repository sebagai final dump production.
- Jangan menyimpan password pada command line atau dokumentasi.
- Jangan menghapus database lama segera setelah cutover.
- Jangan menganggap rollback migration sama dengan restore backup/PITR.

Dokumentasi terkait: `repair.md`, `architecture-be.md`, dan
`sipta-be/docs/production-migration-runbook.md`.
