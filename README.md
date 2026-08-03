# SIPTA Workspace

Repository kerja ini berisi aplikasi SIPTA/Santrack end-to-end:

- `sipta-be/` — Laravel 8 REST API, autentikasi Sanctum, MySQL, queue RabbitMQ.
- `sipta-fe/` — Next.js 15 App Router, React 19, TypeScript, Zustand, Axios,
  HeroUI, dan Tailwind CSS 4.

Dokumen ini adalah baseline refactor frontend agar sinkron dengan backend.
Refactor belum dianggap selesai hanya karena halaman dapat dirender: kontrak data,
aturan bisnis, otorisasi, error state, dan test juga harus selaras.

> Status baseline: 2 Agustus 2026. Backend di working tree sedang berkembang.
> Validasi ulang route dan response backend sebelum setiap fase implementasi.

## Sumber kebenaran

Jika implementasi dan dokumentasi berbeda, gunakan urutan berikut:

1. `sipta-be/routes/api.php` untuk method, path, middleware, dan pembagian role.
2. Controller, service, model, migration, serta `sipta-be/config/santrack.php`
   untuk payload, response, dan aturan bisnis aktual.
3. Dokumentasi domain di `sipta-be/docs/` untuk intent bisnis dan flow operasi.
4. Kode di `sipta-fe/` diperlakukan sebagai consumer legacy yang akan
   diselaraskan, bukan definisi kontrak.

Dokumentasi backend utama:

- [`sipta-be/docs/README.md`](sipta-be/docs/README.md)
- [`sipta-be/docs/business-rules-and-flows.md`](sipta-be/docs/business-rules-and-flows.md)
- [`sipta-be/docs/business-architecture.md`](sipta-be/docs/business-architecture.md)
- [`sipta-be/docs/production-migration-runbook.md`](sipta-be/docs/production-migration-runbook.md)

Blueprint refactor di root:

- [`architecture-fe.md`](architecture-fe.md) — target architecture, application
  shell, design system, dan strategi upgrade layout frontend.
- [`architecture-be.md`](architecture-be.md) — peta backend sebagai contract
  boundary untuk refactor frontend; bukan rencana refactor backend.
- [`repair.md`](repair.md) — urutan sinkronisasi, dry-run migration, deployment
  BE-first, rollout FE, dampak production, dan prosedur rollback.

## Kontrak API dasar

Base URL lokal:

```text
http://127.0.0.1:8000/api/v1
```

Endpoint selain sign-in dilindungi `auth:sanctum`. Endpoint di bawah `/admin`
dan endpoint promotion dilindungi `admin.rule`.

Response sukses yang memakai `ResponseHelper`:

```json
{
  "success": true,
  "message": "...",
  "data": {}
}
```

Response gagal:

```json
{
  "success": false,
  "message": "...",
  "errors": {}
}
```

`data` dan `errors` bersifat opsional. Download PDF/Excel menghasilkan blob,
bukan envelope JSON. Client FE harus memiliki satu normalizer untuk envelope,
blob, error jaringan, `401`, `403`, validasi `400/422`, dan business rule `422`.

## Aturan domain yang wajib dipertahankan FE

- Semua master data dimiliki satu instance; jangan menggabungkan ID lintas
  instance.
- Satu row academic year merepresentasikan satu semester (`ganjil`/`genap`)
  dengan lifecycle `draft`, `active`, atau `closed`.
- `student_classroom_placements` adalah sumber kebenaran kelas siswa per
  semester. `students.classroom_id` hanya field transisi dan tidak boleh
  dipakai oleh kode FE baru.
- Jadwal memakai `status` (`scheduled`, `in_progress`, `completed`,
  `cancelled`), `completed_at`, dan `assessment_period` (`regular`, `uts`,
  `uas`). `is_completed` hanya field kompatibilitas sementara.
- Absensi siswa dan guru idempotent per jadwal. Finalisasi sesi tidak boleh
  membentuk dua pencatatan untuk retry yang sama.
- Nilai akhir mata pelajaran dihitung backend dari regular 40%, UTS 25%, dan
  UAS 35%. FE hanya menampilkan hasil dan metadata formula; jangan menghitung
  ulang dengan formula legacy.
- Kehadiran dilaporkan terpisah dari nilai dan dipakai sebagai salah satu
  syarat rekomendasi kenaikan kelas.
- Ganjil ke genap menggunakan rollover dengan kelas yang sama. Promotion hanya
  terjadi dari genap yang sudah ditutup ke ganjil berikutnya.

## Gap FE terhadap backend saat ini

| Area | Kondisi FE saat ini | Target refactor |
| --- | --- | --- |
| HTTP client | Parsing `response.data` tersebar dan banyak memakai `any` | Satu typed client, normalizer envelope, dan error model bersama |
| Detail guru | FE memanggil `GET /admin/teachers/{id}`, route tersebut tidak ada | Gunakan `GET /teachers/{id}` |
| Academic year | Tipe FE masih berpusat pada `is_active`/`is_promoted`; belum ada close/rollover | Model lifecycle dan action `close`/`rollover` sesuai backend |
| Promotion | FE hanya mengirim `student_ids` dan `target_classroom_id` | Tambahkan `source_academic_year_id`, `target_academic_year_id`, dan optional `override_reason` |
| Placement | Sejumlah model/view masih membaca `student.classroom_id` | Selalu resolve kelas dari placement semester yang dipilih |
| Schedule | Tipe/payload belum memodelkan `status`, `completed_at`, dan `assessment_period` | Pakai state jadwal baru; pertahankan `is_completed` hanya di adapter legacy |
| Report | FE memakai path salah eja `/reports/perfomance-students/...` | Pindah ke alias canonical `/reports/performance-students/...` |
| Report semester | Request FE mengandalkan semester aktif | Kirim query `academic_year_id` ketika user melihat histori |
| Nilai | UI masih mengenal struktur/formula performance lama | Render hasil per subject dari backend beserta attendance dan promotion recommendation |
| Auth/session | Store, interceptor, dan komponen membaca localStorage secara langsung | Store menjadi satu-satunya pemilik session; komponen memakai selector/hook |
| Role access | Proteksi halaman dominan dilakukan client-side | Definisikan route policy admin/teacher dan tangani `401` berbeda dari `403` |
| Type safety | Domain duplikat dan penggunaan `any` tersebar | DTO API terpisah dari model UI, schema runtime di boundary, mapper eksplisit |
| Quality gate | Belum ada script test di FE | Tambahkan unit/contract/component test serta CI lint, test, dan build |

## Endpoint target untuk FE

Semua path berikut relatif terhadap `/api/v1`.

| Domain | Method dan path utama | Catatan |
| --- | --- | --- |
| Auth | `POST /auth/sign-in`, `GET /me`, `DELETE /auth/sign-out`, `PUT /auth/change-password` | Sign-in public; sisanya authenticated |
| Academic year | `GET /instance/academic-years`, CRUD `/admin/instance/academic-year`, `POST /admin/academic-years/{source_id}/rollover`, `POST /admin/academic-years/{id}/close` | Rollover body berisi `target_academic_year_id` |
| Classroom | `GET /classrooms`, CRUD `/admin/classrooms` | Daftar siswa harus mengikuti placement semester |
| Student | CRUD `/students`, `POST /students/place-students`, `POST /students/promoted` | Promotion admin-only dan menggunakan semester sumber/tujuan eksplisit |
| Teacher | `GET /teachers`, `GET /teachers/{id}`, mutation `/admin/teachers` | Update yang tersedia saat ini adalah `POST /teachers/{id}` |
| Schedule | `GET /schedules`, `GET /schedules/today`, `GET /schedules/{id}`, mutation `/admin/schedules` | Create/update menerima `assessment_period` |
| Attendance | `/teachers/attendances/*`, `/students/attendances` | Pertahankan idempotensi dan tampilkan business-rule error |
| Performance | `GET /reports/performance-students/{classroom_id}`, `GET /reports/performance-students/student/{student_id}` | Mendukung query `academic_year_id` |
| Export | `GET /reports/performance-students/student/{student_id}/export/pdf`, `GET /admin/attendance-teachers/export` | Gunakan response type blob |
| Summary | `GET /reports/academic-year-summary` | Gunakan untuk ringkasan semester, bukan kalkulasi ulang di browser |

Path legacy `/reports/perfomance-students/...` masih tersedia sementara, tetapi
tidak boleh dipakai oleh kode baru.

## Target arsitektur frontend

Struktur target bersifat feature-first. Nama folder dapat disesuaikan saat
implementasi, tetapi dependency direction harus dipertahankan.

```text
sipta-fe/
├── app/                    # route, layout, provider, dan komposisi screen Next.js
└── src/
    ├── shared/
    │   ├── api/            # Axios instance, envelope, auth/error interceptors
    │   ├── config/         # validasi environment
    │   ├── ui/             # primitive UI reusable
    │   └── lib/            # util murni tanpa domain
    ├── entities/           # instance, academic-year, classroom, student, ...
    │   └── <entity>/
    │       ├── api.ts      # DTO dan endpoint entity
    │       ├── model.ts    # domain type/schema/mapper
    │       └── ui.tsx      # komponen entity reusable bila diperlukan
    └── features/           # login, attendance, rollover, promotion, export, ...
```

Boundary yang harus dijaga:

- Page/component tidak mengimpor Axios instance secara langsung.
- DTO backend tidak otomatis menjadi state/form model; gunakan mapper.
- Server state, auth state, dan local UI state dipisahkan.
- Tidak ada akses langsung ke `localStorage` di page/component.
- Role/capability dan academic year terpilih berasal dari satu context/store.
- Compatibility mapping (`is_completed`, typo `perfomance`) terisolasi dan
  memiliki tanggal/rencana penghapusan.

## Urutan refactor

### Fase 0 — Bekukan baseline

- Simpan output `php artisan route:list --path=api` sebagai bahan contract
  inventory.
- Catat response sukses/gagal untuk happy path dan business-rule failure.
- Jalankan test backend dan identifikasi endpoint transitional.
- Tambahkan smoke test FE untuk login, dashboard, dan logout sebelum migrasi.

### Fase 1 — Fondasi client

- Validasi `NEXT_PUBLIC_API_BASE_URL` dan `NEXT_PUBLIC_ASSET` saat startup.
- Buat typed response envelope, `ApiError`, blob handler, dan interceptor.
- Pusatkan token/session lifecycle; hapus parsing localStorage dari komponen.
- Tambahkan schema runtime pada response yang kritis.

### Fase 2 — Model domain

- Definisikan DTO dan mapper untuk user, instance, academic year, placement,
  classroom, student, teacher, subject, schedule, attendance, dan report.
- Tambahkan lifecycle/status union yang sama dengan backend.
- Hapus interface duplikat dan migrasikan `any` per feature, bukan sekaligus.

### Fase 3 — Master data dan jadwal

- Migrasikan profile/instance, academic year, teacher, classroom, student, dan
  subject ke client baru.
- Migrasikan schedule dengan overlap error, `assessment_period`, dan status.
- Pastikan daftar kelas/siswa selalu scoped oleh semester serta instance.

### Fase 4 — Operasi kelas

- Migrasikan check-in/check-out guru, absensi siswa, accomplishment, dan
  finalisasi sesi.
- Pertahankan draft lokal dengan versioning agar payload lama tidak dikirim ke
  kontrak baru.
- Tampilkan error business rule sebagai feedback yang bisa ditindaklanjuti.

### Fase 5 — Semester dan promotion

- Tambahkan UI close semester, rollover ganjil ke genap, dan promotion genap
  ke ganjil.
- Gunakan ID semester sumber/tujuan eksplisit dan tampilkan rekomendasi serta
  kebutuhan `override_reason`.
- Refresh placement, active academic year, dan cache terkait secara atomik
  setelah mutation berhasil.

### Fase 6 — Report dan cleanup

- Migrasikan report ke endpoint canonical dan dukung histori semester.
- Gunakan nilai hasil backend; hapus formula performance legacy di FE.
- Hapus endpoint typo, `students.classroom_id`, `is_completed`, interface
  duplikat, dan compatibility adapter setelah seluruh consumer bermigrasi.
- Pecah komponen besar dan hapus folder `backup/` setelah verifikasi parity.

## Definition of done

Satu feature dianggap sinkron bila:

- method, path, query, payload, upload, response, dan role sesuai route/backend;
- semua state sukses, kosong, loading, forbidden, validation, business-rule,
  network failure, dan retry memiliki perilaku UI yang jelas;
- tidak memakai `any`, field transisi, atau kalkulasi bisnis duplikat tanpa
  compatibility adapter terdokumentasi;
- unit test mapper/schema dan test component happy/error path tersedia;
- mutation menginvalidasi/refetch data yang tepat;
- lint, type-check, test, dan production build lulus;
- flow diperiksa untuk admin dan teacher pada viewport desktop serta mobile.

Quality gate akhir:

```bash
# Backend
cd sipta-be
php artisan test
php artisan route:list --path=api
php artisan santrack:audit-data

# Frontend
cd ../sipta-fe
npm ci
npm run lint
npm run build
```

Script `type-check` dan `test` belum tersedia di `sipta-fe/package.json`; kedua
script tersebut harus ditambahkan pada fase fondasi sebelum dijadikan gate CI.

## Menjalankan lokal

Backend:

```bash
cd sipta-be
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan db:seed
php artisan serve
```

Frontend, pada terminal lain:

```bash
cd sipta-fe
npm ci
npm run dev
```

Environment minimum FE:

```dotenv
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api/v1
NEXT_PUBLIC_ASSET=http://127.0.0.1:8000/storage
```

Simpan konfigurasi FE lokal tersebut di `sipta-fe/.env.local`. Backend memakai
salinan `sipta-be/.env.example`. Jangan commit `.env`, `.env.local`, credential,
token, database dump, dokumen siswa, atau data produksi.

## Aturan kerja refactor

- Kerjakan per vertical slice yang dapat diuji; jangan mengganti seluruh FE
  dalam satu merge tanpa checkpoint.
- Perubahan kontrak backend wajib disertai update route/contract inventory dan
  test sebelum FE bergantung padanya.
- Jangan mempertahankan dua sumber state untuk session atau academic year.
- Tandai adapter legacy dengan issue/fase penghapusan yang jelas.
- Setiap fase harus dapat di-deploy atau di-rollback secara independen.
