# Runbook Sinkronisasi, Migrasi, dan Update Production SIPTA

Dokumen ini menjawab urutan sinkronisasi backend–frontend, dampak migration ke
production, cara deploy, verifikasi, dan rollback. Fokus pekerjaan tetap
refactor frontend; backend terlebih dahulu distabilkan sebagai contract yang
akan dikonsumsi FE.

Referensi:

- [`README.md`](README.md) — baseline kontrak dan roadmap refactor.
- [`architecture-fe.md`](architecture-fe.md) — target arsitektur frontend.
- [`architecture-be.md`](architecture-be.md) — backend integration boundary.
- [`sipta-be/docs/production-migration-runbook.md`](sipta-be/docs/production-migration-runbook.md)
  — detail migration database legacy.

## 1. Jawaban singkat

**BE memang didahulukan, tetapi jangan langsung migrate database production.**

Urutan aman:

```text
Bekukan contract dan release candidate
        ↓
Backup production + uji restore
        ↓
Clone production terbaru ke staging
        ↓
Jalankan migration bertahap + audit di staging
        ↓
Uji BE baru dengan FE lama dan flow bisnis utama
        ↓
Maintenance production
        ↓
Deploy BE baru + migrate satu kali
        ↓
Smoke test dan audit data
        ↓
Buka production dengan FE lama
        ↓
Deploy/refactor FE per vertical slice
        ↓
Hapus kontrak legacy pada release terpisah
```

Alasan BE lebih dahulu:

- FE baru membutuhkan field dan workflow baru dari BE;
- BE masih menyediakan alias/field transitional untuk FE lama;
- jika deploy FE gagal, FE dapat dikembalikan tanpa membalik migration DB;
- schema dan aturan bisnis harus stabil sebelum layout/feature FE bergantung
  padanya.

Namun, kompatibilitas BE baru dengan FE lama **harus dibuktikan di staging**.
Jangan menganggap kata “transitional” otomatis berarti seluruh flow lama aman.

## 2. Keputusan deployment

| Pertanyaan | Keputusan |
| --- | --- |
| Migrate production sekarang? | Tidak, sebelum staging dari dump terbaru lulus |
| Deploy FE atau BE lebih dulu? | BE lebih dulu, FE setelah API dan data terverifikasi |
| Bisa zero-downtime? | Jangan diasumsikan; migration constraint/conversion memerlukan maintenance window |
| Bisa rollback dengan `migrate:rollback`? | Tidak aman; gunakan snapshot/PITR dan release aplikasi lama |
| Refactor BE juga? | Tidak; hanya perbaikan kontrak/blocker yang terbukti diperlukan |
| Deploy seluruh refactor FE sekaligus? | Tidak; deploy per vertical slice dengan compatibility adapter |

## 3. Kondisi migration yang akan dijalankan

Production legacy harus diperiksa menggunakan:

```bash
cd sipta-be
php artisan migrate:status
```

Baseline dump yang terdokumentasi sudah mencatat migration sampai:

```text
2025_12_29_160751_create_student_classroom_placements_table
```

Empat migration upgrade:

| Migration | Perubahan | Dampak utama |
| --- | --- | --- |
| `2026_07_28_000000` | Tambah ownership, schedule state, score, placement bila belum ada; backfill data | Write besar pada tabel terkait; field lama masih dipertahankan |
| `2026_07_28_005000` | Tambah `student_accomplishments.rated_at` | Additive, tetapi tetap DDL |
| `2026_07_28_010000` | `NOT NULL`, foreign key, dan unique business constraints | Dapat gagal bila ownership/duplicate belum bersih; index/ALTER dapat mengunci tabel |
| `2026_07_28_020000` | Lifecycle semester, assessment period, creativity, promotion decisions | Konversi creativity tidak reversible sempurna; UTS/UAS dibackfill dari nama legacy |

Jangan berasumsi status production sama dengan dump. Output `migrate:status`,
schema aktual, engine/version MySQL, dan ukuran tabel harus dicatat per database.

## 4. Dampak ke production

### 4.1 Downtime dan database lock

Migration `010000` menjalankan `ALTER TABLE`, membuat unique index, mengubah
kolom menjadi `NOT NULL`, dan memasang foreign key. Pada tabel besar operasi ini
dapat:

- menahan insert/update;
- membuat request timeout;
- meningkatkan CPU, I/O, binary log, dan replication lag;
- menggunakan temporary disk;
- berlangsung jauh lebih lama dibanding database development.

Karena itu gunakan maintenance window. Durasi harus diukur di staging dengan
volume dan versi MySQL yang mendekati production.

### 4.2 Backfill dan perubahan data

Migration melakukan perubahan data berikut:

- mengisi ownership instance untuk classroom, subject, dan student;
- mengubah schedule selesai menjadi `status = completed` serta mengisi
  `completed_at`;
- menandai semester aktif sebagai `status = active`;
- menandai `assessment_period` sebagai UTS/UAS berdasarkan nama accomplishment;
- menggabungkan `creativity1` dan `creativity2` menjadi `creativity`.

Backfill UTS/UAS bersifat heuristic. Detector memakai token `UTS`/`UAS` utuh,
bukan substring, agar kata seperti `Evaluasi` tidak salah dianggap UAS. Jika
satu schedule memiliki marker UTS dan UAS sekaligus, migration berhenti dan
meminta koreksi data. Hasil query review tetap wajib disetujui sebelum `020000`
dijalankan:

```sql
SELECT COUNT(*) FROM accomplishments
WHERE LOWER(name) LIKE '%uts%';

SELECT COUNT(*) FROM accomplishments
WHERE LOWER(name) LIKE '%uas%';

SELECT type, COUNT(*) FROM accomplishments
GROUP BY type;
```

### 4.3 Migration MySQL tidak boleh dianggap atomik

Sebagian DDL MySQL melakukan implicit commit. Jika satu langkah gagal,
perubahan sebelumnya mungkin sudah terpasang walaupun row migration belum
tercatat. Jika migration gagal:

1. jangan langsung rerun;
2. hentikan write dan simpan log lengkap;
3. periksa kolom, index, foreign key, dan table yang sudah berubah;
4. putuskan restore snapshot atau repair script yang direview;
5. baru lanjut berdasarkan kondisi schema aktual.

### 4.4 Queue dan scheduler

Worker serta scheduler dapat menulis data ketika migration berlangsung. Keduanya
harus dihentikan, bukan hanya aplikasi web diberi maintenance page. Pastikan
tidak ada job aktif sebelum schema diubah.

### 4.5 Dampak ke FE lama

BE baru masih mempertahankan:

- `students.classroom_id` sebagai field transitional;
- `schedules.is_completed` bersama `status`;
- alias salah eja `/reports/perfomance-students/...`.

Ini memungkinkan rollout BE-first, tetapi flow berikut wajib dites dengan FE
lama:

- login admin/guru;
- dashboard dan schedule hari ini;
- classroom dan roster student;
- check-in/check-out serta attendance siswa;
- accomplishment/assessment;
- report student/guru dan export;
- CRUD admin yang masih dipakai.

Promotion FE lama saat ini belum mengirim seluruh payload yang diwajibkan BE
baru. Fitur itu harus ditahan atau diperbaiki sebelum dipakai di production.

## 5. Persiapan sebelum staging

### 5.1 Bekukan scope

Buat satu release candidate BE yang berisi migration, service, route, dan test
yang saling cocok. Jangan mengambil migration dari commit A dan application code
dari commit B.

Catat:

- commit/tag BE;
- commit/tag FE lama yang saat ini production;
- database host/name tanpa menyimpan password di dokumen;
- versi PHP, Composer, MySQL, Node, dan npm;
- jumlah instance dan row tabel utama;
- operator, approver, waktu maintenance, RTO, dan RPO;
- ID/lokasi backup serta prosedur restore.

### 5.2 Backup yang valid

Backup dinyatakan valid hanya bila dapat direstore ke environment terisolasi.
Minimum:

- full snapshot sebelum migration;
- binary log/PITR bila infrastructure mendukung;
- backup file upload/storage yang konsisten dengan database;
- checksum/verification dan restore drill;
- snapshot dipertahankan sampai release stabil.

Jangan menyimpan dump production di Git atau workspace repository.

### 5.3 Inventory data

Catat row count sebelum migration:

```sql
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM teachers;
SELECT COUNT(*) FROM students;
SELECT COUNT(*) FROM subjects;
SELECT COUNT(*) FROM classrooms;
SELECT COUNT(*) FROM schedules;
SELECT COUNT(*) FROM teacher_attendances;
SELECT COUNT(*) FROM student_attendances;
SELECT COUNT(*) FROM student_accomplishments;
SELECT COUNT(*) FROM student_classroom_placements;
```

Simpan hasil di deployment record, bukan di source code.

## 6. Dry-run di staging

Staging harus dibuat dari backup production terbaru, bukan database seed kosong.

### 6.1 Restore dan pastikan target benar

Sebelum menjalankan Artisan, verifikasi `.env` menunjuk database staging:

```bash
cd sipta-be
php artisan config:clear
php artisan env
php artisan migrate:status
```

Periksa nilai koneksi tanpa mencetak password. Jangan lanjut jika nama database
atau host meragukan.

### 6.2 Jalankan additive/reconciliation lebih dahulu

```bash
php artisan migrate \
  --path=database/migrations/2026_07_28_000000_reconcile_business_schema_v2.php

php artisan migrate \
  --path=database/migrations/2026_07_28_005000_add_missing_assessment_runtime_columns.php
```

Lalu audit:

```bash
php artisan santrack:audit-data
```

Semua check harus `0 / OK`. Audit memeriksa antara lain:

- ownership kosong;
- duplicate semester, classroom, subject, placement, attendance, assessment,
  dan slot schedule;
- schedule lintas instance.

Jika ada issue, jangan hapus duplicate otomatis. Pilih canonical record,
pindahkan foreign key/relasi, dan gunakan repair script yang di-review serta
diuji pada salinan baru.

Untuk duplicate retry attendance/assessment yang sudah dianalisis, gunakan
command bawaan dalam mode dry-run terlebih dahulu:

```bash
php artisan santrack:repair-duplicates
```

Command memilih record dengan `updated_at`, `created_at`, lalu `id` paling baru
sebagai canonical, menampilkan payload conflict, dan tidak memperbaiki schedule
conflict secara otomatis. Setelah snapshot, maintenance, dan hasil dry-run
disetujui:

```bash
php artisan santrack:repair-duplicates \
  --apply \
  --confirm=REPAIR_DUPLICATES
```

Production juga memerlukan `--force`. Apply berjalan dalam transaction dan
menulis mapping canonical/deleted ID ke `storage/logs/`. Setelah apply, audit
wajib dijalankan ulang. Jadwal pada classroom dan slot yang sama harus
di-reschedule atau diperbaiki manual sebelum constraint migration.

### 6.3 Pasang constraint

Setelah audit nol:

```bash
php artisan migrate \
  --path=database/migrations/2026_07_28_010000_enforce_business_constraints.php
```

Catat durasi, lock, CPU, I/O, disk, dan replication lag. Jika durasinya melewati
maintenance window production, migration perlu strategi online schema change
yang dirancang dan diuji terpisah; jangan dipaksakan saat deployment.

### 6.4 Review dan jalankan workflow migration

Jalankan query review UTS/UAS/creativity pada bagian 4.2. Setelah hasil benar:

```bash
php artisan migrate \
  --path=database/migrations/2026_07_28_020000_add_term_assessment_and_promotion_workflow.php
```

### 6.5 Verifikasi staging

```bash
php artisan migrate:status
php artisan test
php artisan route:list --path=api
php artisan santrack:audit-data
```

Bandingkan row count sebelum/sesudah. Empat migration upgrade harus berstatus
`Yes`; data bisnis utama tidak boleh berkurang tanpa alasan yang disetujui.

Smoke test menggunakan BE baru + FE production lama, lalu BE baru + build FE
refactor candidate. Minimum flow:

1. login/logout admin dan guru;
2. buka active academic year, classroom, placement, dan student;
3. buat/edit schedule termasuk `assessment_period`;
4. teacher attendance check-in/check-out;
5. student attendance dan assessment, termasuk retry request;
6. close/rollover/promotion pada data khusus staging;
7. report student/classroom, attendance guru, PDF, dan spreadsheet;
8. cek log aplikasi, failed job, queue, dan data audit.

## 7. Deployment production BE-first

### 7.1 Go/no-go

Deployment hanya `GO` bila:

- staging memakai snapshot production yang cukup baru dan lulus;
- audit nol atau seluruh exception telah disetujui dan diperbaiki;
- durasi migration muat dalam maintenance window;
- restore snapshot telah diuji;
- release lama siap dipasang kembali;
- operator DB, aplikasi, dan approver tersedia;
- smoke-test checklist dan owner tiap langkah jelas.

### 7.2 Masuk maintenance

Contoh command Laravel:

```bash
cd /path/to/sipta-be
php artisan down --retry=60
php artisan queue:restart
```

`queue:restart` hanya memberi sinyal restart. Hentikan worker melalui process
manager yang benar-benar dipakai production, misalnya Supervisor/systemd, dan
hentikan cron/scheduler. Pastikan tidak ada proses tulis aktif.

Buat snapshot final setelah seluruh writer berhenti. Catat row count final.

### 7.3 Pasang satu release BE

Gunakan mekanisme atomic release/symlink bila infrastructure mendukung. Dari
release directory baru:

```bash
composer install --no-dev --prefer-dist --optimize-autoloader
php artisan config:clear
php artisan migrate:status
php artisan migrate --force
php artisan config:cache
php artisan route:clear
```

Aturan:

- migration hanya dijalankan dari satu node;
- node lain tetap tidak menerima traffic selama schema berubah;
- jangan menjalankan `migrate:fresh`, `db:wipe`, atau mengedit tabel
  `migrations`;
- jangan menjalankan seeder production kecuali seeder tersebut secara eksplisit
  dirancang idempotent dan sudah disetujui;
- simpan output command dan timestamp ke deployment record.

`routes/web.php` saat ini masih memiliki route Closure. Karena itu
`php artisan route:cache` bukan langkah wajib runbook ini. Jalankan hanya bila
command tersebut sudah lulus pada artifact yang sama; kegagalannya tidak boleh
diakali ketika maintenance sedang berlangsung.

### 7.4 Smoke test sebelum membuka traffic

Dengan aplikasi masih maintenance, jalankan melalui internal host atau mekanisme
bypass yang aman:

- health/bootstrap aplikasi;
- login admin dan guru;
- `/me` serta semester aktif;
- classroom, student, dan placement;
- create schedule pada test instance;
- attendance dan assessment;
- report serta PDF;
- queue connection dan failed jobs;
- `php artisan santrack:audit-data`;
- row count serta error log.

Jika lulus:

```bash
php artisan up
```

Nyalakan scheduler dan worker. Pantau error rate, latency, database locks,
queue depth, failed jobs, disk, dan resource database dengan pengawasan aktif
setidaknya sepanjang periode penggunaan pertama yang representatif.

### 7.5 Soak dengan FE lama

Jangan langsung menumpuk deployment FE besar pada menit yang sama. Jalankan BE
baru bersama FE lama selama soak window yang disepakati. Ini memisahkan sumber
masalah: schema/BE lebih mudah dibedakan dari redesign/refactor FE.

## 8. Deployment frontend

### 8.1 Prasyarat

- BE production baru lulus soak dan contract fixture FE;
- endpoint canonical tersedia;
- adapter transitional masih aktif untuk slice yang belum dimigrasi;
- build FE lulus lint, type-check, test, dan smoke/E2E terkait;
- ada preview/staging build menggunakan base URL staging.

### 8.2 Environment build-time

`NEXT_PUBLIC_*` dimasukkan ke bundle browser saat build. Build production harus
menggunakan nilai production:

```dotenv
NEXT_PUBLIC_API_BASE_URL=https://<api-production>/api/v1
NEXT_PUBLIC_ASSET=https://<api-production>/storage
```

Jangan menyalin `.env` development ke image atau artifact production. Jangan
mencetak secret/token ke build log. Setelah deploy, periksa network request di
browser untuk memastikan tidak menunjuk localhost, staging, atau ngrok.

Jika origin FE berubah, validasi konfigurasi CORS, Sanctum/stateful domain bila
digunakan, TLS, CSP, dan allowlist image/storage backend.

### 8.3 Build dan release

Quality gate target:

```bash
cd sipta-fe
npm ci
npm run lint
npm run type-check
npm run test
npm run build
```

Script `type-check` dan `test` belum tersedia pada baseline dan harus ditambah
sebelum menjadi gate wajib.

Dockerfile FE saat ini menjalankan `npm install` lalu `npm run dev`; itu adalah
setup development dan **tidak layak digunakan apa adanya untuk production**.
Production perlu artifact `next build`, runtime `next start`, dependency lock
deterministik, health check, non-root user, dan strategi rollback image/tag.

### 8.4 Urutan rollout FE

Deploy per vertical slice:

1. API client, error normalizer, dan auth/session boundary;
2. App Shell/layout baru dengan visual parity;
3. dashboard dan schedule;
4. classroom/student/teacher/subject;
5. attendance dan assessment;
6. academic year, rollover, dan promotion;
7. report/export;
8. hapus adapter legacy setelah seluruh consumer lulus.

Untuk setiap slice:

```text
Staging/preview → contract test → role/mobile/desktop smoke test
→ canary/limited rollout bila tersedia → production → monitor → lanjut slice
```

Layout baru sebaiknya dipasang lebih dulu dengan feature lama di dalam shell.
Dengan begitu perubahan navigasi/layout dapat divalidasi tanpa sekaligus
mengganti seluruh data flow.

### 8.5 Cache dan rollback FE

- beri artifact/image release ID yang immutable;
- hindari reuse tag seperti `latest` sebagai satu-satunya rollback pointer;
- invalidasi CDN hanya untuk asset/HTML yang diperlukan;
- asset hashed Next.js sebaiknya tetap tersedia selama client lama masih aktif;
- bila FE gagal tetapi BE sehat, rollback artifact FE saja;
- jangan rollback database hanya karena bug visual FE.

## 9. Strategi rollback

### 9.1 FE gagal, BE dan database sehat

1. hentikan rollout FE;
2. kembalikan artifact/image FE sebelumnya;
3. pertahankan BE baru dan schema baru;
4. verifikasi login serta critical flow menggunakan FE lama;
5. investigasi FE di staging.

Ini adalah alasan utama mempertahankan compatibility contract saat refactor.

### 9.2 BE gagal sebelum migration

Jika migration belum dijalankan, pasang kembali release BE lama dan buka
traffic setelah smoke test.

### 9.3 BE/schema gagal setelah migration

Jangan mengandalkan `php artisan migrate:rollback` karena:

- migration `000000`, `005000`, dan `010000` sengaja mempertahankan perubahan
  pada `down()`;
- `020000` hanya menjatuhkan promotion table dan tidak mengembalikan conversion
  creativity secara sempurna;
- constraint dan data conversion dapat membuat aplikasi lama tidak kompatibel.

Prosedur:

1. pertahankan maintenance mode;
2. hentikan worker dan scheduler;
3. ambil snapshot database gagal untuk investigasi;
4. restore snapshot/PITR pre-migration;
5. deploy release BE lama;
6. jalankan smoke test versi lama;
7. buka traffic hanya setelah data dan flow terverifikasi.

### 9.4 Kriteria rollback segera

- login gagal untuk role utama;
- cross-instance data terlihat;
- row count bisnis berkurang tidak terjelaskan;
- audit invariant gagal setelah sebelumnya nol;
- attendance/assessment membuat duplicate atau kehilangan data;
- report utama salah secara material;
- error rate/latency/DB lock melewati batas yang disepakati;
- migration berhenti pada kondisi schema parsial yang belum dipahami.

## 10. Post-deployment verification

Checklist 0–2 jam:

- error rate HTTP per status;
- latency endpoint login, schedule, classroom, attendance, dan report;
- database connection, slow query, lock, CPU, disk, dan replication lag;
- queue depth dan failed jobs;
- scheduler berjalan tepat satu kali sesuai konfigurasi;
- storage image/PDF dapat diakses;
- audit data tetap nol;
- tidak ada request FE menuju host development/staging.

Checklist 24–72 jam:

- cek flow penggunaan nyata admin dan guru;
- bandingkan jumlah attendance/assessment dengan pola normal;
- verifikasi report berkala dan email queue;
- ulangi audit serta row count penting;
- pertahankan snapshot migration sampai release dinyatakan stabil;
- catat incident, workaround, dan keputusan compatibility cleanup.

## 11. Release matrix

Gunakan matrix ini pada deployment record:

| Tahap | BE | DB | FE | Status yang diharapkan |
| --- | --- | --- | --- | --- |
| Awal | lama | legacy | lama | Production saat ini |
| Staging A | baru | clone + migrated | lama | Bukti backward compatibility |
| Staging B | baru | clone + migrated | candidate | Bukti contract dan UI baru |
| Production A | baru | migrated | lama | BE/schema soak |
| Production B | baru | migrated | baru per slice | Refactor berjalan |
| Cleanup | baru tanpa legacy | migrated/final | baru | Hanya setelah semua consumer verified |

Jangan lompat dari tahap awal langsung ke cleanup.

## 12. Checklist eksekusi ringkas

### Sebelum hari deployment

- [ ] Release BE dan FE diberi tag/ID immutable.
- [ ] Dump production terbaru berhasil direstore ke staging.
- [ ] Empat migration diuji bertahap.
- [ ] `santrack:audit-data` menghasilkan nol issue.
- [ ] Query review UTS/UAS/creativity disetujui.
- [ ] Durasi DDL sesuai maintenance window.
- [ ] FE lama lulus melawan BE baru.
- [ ] FE candidate lulus melawan BE baru.
- [ ] Snapshot/PITR dan restore procedure teruji.
- [ ] Release lama serta owner rollback siap.

### Saat deployment BE

- [ ] Maintenance aktif.
- [ ] Worker dan scheduler benar-benar berhenti.
- [ ] Snapshot final dan row count tersimpan.
- [ ] Host/database target diverifikasi.
- [ ] Dependency dipasang dari lock file.
- [ ] Migration dijalankan satu kali dari satu node.
- [ ] Cache config/route dibuat dari release baru.
- [ ] Smoke test, audit, log, dan row count lulus.
- [ ] Traffic, scheduler, dan worker dibuka bertahap.

### Saat deployment FE

- [ ] Production env masuk saat build.
- [ ] Artifact menggunakan `next build`/`next start`, bukan dev server.
- [ ] Lint, type-check, test, build, dan critical E2E lulus.
- [ ] Role admin/guru serta mobile/desktop diuji.
- [ ] Network request menuju API dan storage production.
- [ ] Artifact FE sebelumnya siap untuk rollback cepat.

## 13. Larangan

- Jangan menjalankan `migrate:fresh`, `db:wipe`, atau seeder development di
  production.
- Jangan migrate langsung pada production tanpa staging dari data production.
- Jangan menjalankan migration dari beberapa node bersamaan.
- Jangan memperbaiki duplicate dengan delete massal tanpa memindahkan relasi.
- Jangan mengedit tabel `migrations` agar migration terlihat berhasil.
- Jangan menganggap `migrate:rollback` menggantikan snapshot/PITR.
- Jangan deploy BE, irreversible migration, dan redesign FE besar sebagai satu
  perubahan tanpa checkpoint.
- Jangan menghapus endpoint/field transitional sebelum FE baru dan seluruh
  consumer lain terverifikasi.
- Jangan memakai Dockerfile FE development saat ini untuk production.

## 14. Rekomendasi langkah berikutnya

1. Tetapkan commit/tag calon release BE.
2. Ambil dump production terbaru dan lakukan restore drill ke staging.
3. Jalankan prosedur staging pada bagian 6 serta catat seluruh hasil.
4. Repair data staging/production source bila audit menemukan issue.
5. Buktikan FE lama berjalan terhadap BE baru.
6. Baru mulai fase fondasi refactor FE dan App Shell dari
   `architecture-fe.md`.

Tanpa hasil dry-run staging, status saat ini adalah **NO-GO untuk migration
production**.

## 15. Status sinkronisasi kontrak FE-BE lokal (3 Agustus 2026)

Kontrak berikut sudah diselaraskan tanpa mengubah layout FE:

- login mengembalikan `access_token`, `refresh_token`, dan `expires_in`;
- refresh token memakai `POST /api/v1/auth/refresh` dan melakukan rotasi token;
- logout menghapus access token serta refresh token milik user;
- detail guru memakai `GET /api/v1/teachers/{teacher_id}`;
- detail kelas tersedia pada `GET /api/v1/classrooms/{classroom_id}` dan roster
  dibaca dari placement semester yang diminta;
- promosi siswa mengirim semester sumber, semester tujuan, dan kelas tujuan;
- schedule mengenal `assessment_period`, `status`, dan `completed_at`;
- update penilaian tidak lagi meminta metadata FE yang tidak dipakai dan selalu
  dibatasi ke siswa, semester aktif, serta instance pengguna;
- endpoint typo `/reports/perfomance-students/*` dipertahankan sementara untuk
  response layout report lama;
- endpoint canonical `/reports/performance-students/*` menyediakan model report
  bisnis baru untuk migrasi halaman report berikutnya.

Verifikasi lokal terakhir:

```powershell
cd D:\argasolusi\sipta\sipta-be
php artisan test

cd D:\argasolusi\sipta\sipta-fe
npm run build
```

Keduanya wajib lulus sebelum pengujian manual. Urutan smoke test yang disarankan:

1. login admin dan guru;
2. tunggu/trigger refresh token lalu pastikan request berikutnya tetap 200;
3. buka daftar dan detail guru serta kelas;
4. buat/edit schedule regular, UTS, dan UAS;
5. isi attendance dan assessment;
6. buka report legacy dan report PDF;
7. jalankan promotion pada data uji menuju semester target;
8. logout lalu pastikan token lama tidak dapat dipakai kembali.

Status ini hanya menyatakan **siap testing lokal**. Production tetap mengikuti
staging clone dari dump production, audit nol, backup/PITR, maintenance window,
dan rollout bertahap pada bagian sebelumnya.

## 16. Roster kosong setelah pergantian semester

Roster classroom berasal dari `student_classroom_placements` per semester.
Mengaktifkan semester baru tanpa mengisi placement semester target membuat kelas
terlihat kosong, walaupun master data siswa tidak hilang.

Workflow yang benar sekarang:

- ganjil ke genap: satu transaksi menutup ganjil, menyalin seluruh siswa aktif
  ke kelas yang sama pada genap, lalu mengaktifkan genap;
- genap ke ganjil berikutnya: admin memproses kenaikan kelas saat genap masih
  aktif; setelah seluruh siswa aktif memiliki placement target, transisi menutup
  genap dan mengaktifkan ganjil berikutnya;
- aktivasi langsung ditolak jika masih ada siswa aktif yang belum mempunyai
  placement semester target;
- penilaian harus lengkap sebelum promosi, kecuali admin mengirim alasan
  override yang tercatat;
- kapasitas kelas dihitung dari `available_capacity`, bukan kapasitas maksimum.

Untuk database lokal yang sudah telanjur kosong, lihat dahulu semester dan jumlah
rosternya tanpa mengubah data:

```powershell
cd D:\argasolusi\sipta\sipta-be
php artisan santrack:repair-semester-transition
```

Lalu lakukan dry-run dengan UUID yang ditampilkan:

```powershell
php artisan santrack:repair-semester-transition SOURCE_UUID TARGET_UUID
```

Jika pasangan, status, dan jumlah roster sudah benar, terapkan:

```powershell
php artisan santrack:repair-semester-transition SOURCE_UUID TARGET_UUID --apply --confirm=REPAIR_SEMESTER_TRANSITION
php artisan santrack:audit-data
```

Jika hasil dry-run menunjukkan jadwal legacy masih `scheduled`, review
klasifikasinya lalu gunakan opsi berikut hanya bila rentang tanggalnya benar:

```powershell
php artisan santrack:repair-semester-transition SOURCE_UUID TARGET_UUID --apply --resolve-past-schedules --move-target-schedules --confirm=REPAIR_SEMESTER_TRANSITION
```

`--resolve-past-schedules` menandai jadwal lampau yang memiliki bukti absensi
atau nilai sebagai `completed`, dan jadwal tanpa aktivitas sebagai `cancelled`.
`--move-target-schedules` hanya memindahkan jadwal yang tanggalnya berada dalam
rentang semester target. Rollover roster kelas yang sama memakai bulk upsert dan
tidak menerapkan ulang kapasitas kelas; kapasitas tetap diperiksa untuk promosi
ke kelas berbeda.

Hasil repair lokal `sipta_v3` pada 3 Agustus 2026:

- 24 jadwal dalam rentang genap dipindahkan ke semester genap;
- 209 jadwal ganjil dengan bukti aktivitas menjadi `completed`;
- 79 jadwal tanpa aktivitas menjadi `cancelled`;
- 165 roster siswa disalin dari ganjil ke genap;
- ganjil menjadi `closed`, genap tetap `active` dengan 165 roster;
- seluruh pemeriksaan `santrack:audit-data` berstatus `OK`.

Di production, command apply membutuhkan `--force`, tetapi hanya boleh dilakukan
setelah backup/PITR, maintenance mode, dry-run dari clone production, dan review
jumlah roster. Command menggunakan transaksi; jika jadwal semester sumber belum
selesai atau continuity roster gagal, seluruh perubahan dibatalkan.
