# Santrack Documentation

Dokumentasi ini menjadi sumber acuan bisnis dan operasional Santrack.

## Dokumen utama

1. [Aturan bisnis dan flow operasional](business-rules-and-flows.md)  
   Pegangan admin, guru, backend, frontend, dan QA mengenai semester, jadwal,
   absensi, penilaian, rapor, rollover, serta kenaikan kelas.
2. [Arsitektur bisnis dan ERD](business-architecture.md)  
   Model domain, hubungan antar-entitas, aggregate root, dan transitional
   fields.
3. [Runbook migrasi production](production-migration-runbook.md)  
   Cara memigrasikan `sipta_v2.sql`, menjalankan audit, deploy, smoke test, dan
   rollback.
4. [Operasional backup dan export](operations-backup-and-export.md)  
   Kebijakan backup, snapshot semester, restore drill, retensi, dan batasan
   export data besar.

## Arti status

| Status | Arti |
| --- | --- |
| `IMPLEMENTED` | Sudah tersedia di source code dan diuji otomatis |
| `TRANSITIONAL` | Masih dipertahankan untuk kompatibilitas data/client lama |
| `PENDING` | Rekomendasi target yang belum selesai diimplementasikan |

Jika dokumentasi bertentangan dengan implementasi, hentikan deployment dan
selaraskan keduanya sebelum production.

## Status implementasi saat ini

| Area | Status |
| --- | --- |
| Ownership instance dan placement historis | `IMPLEMENTED` |
| Lifecycle semester dan rollover | `IMPLEMENTED` |
| Promotion genap closed ke ganjil berikutnya | `IMPLEMENTED` |
| Attendance siswa/guru idempotent | `IMPLEMENTED` |
| Rapor dan PDF per mata pelajaran | `IMPLEMENTED` |
| Reconciliation migration termasuk `rated_at` | `IMPLEMENTED` |
| Audit duplicate dan cross-instance | `IMPLEMENTED` |
| Dry-run dump production pada MySQL staging | `PENDING` |
| Export attendance 44.000+ row secara streaming | `PENDING` |
| Backup/PITR otomatis pada infrastructure | `PENDING` |
