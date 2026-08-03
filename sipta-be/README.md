# Santrack API

Santrack is a Laravel API for multi-instance academic operations: academic
years, classrooms, schedules, attendance, student placement, promotion, and
learning-outcome reports.

Start from the [documentation index](docs/README.md). It links the business
rules and flows, ERD, production migration runbook, and backup/export
operations guide.

## Requirements

- PHP compatible with the locked Laravel version
- MySQL for production
- Composer
- RabbitMQ when queued reports are enabled

## Local setup

```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan db:seed
php artisan serve
```

Run automated checks:

```bash
php artisan test
php artisan route:list --path=api
php artisan santrack:audit-data
```

## Existing database rollout

Do not use the SQL backup as the long-term schema definition.

1. Restore `database/backup/sipta_v2.sql` into an isolated database.
2. Point a local `.env` to that database.
3. Run `php artisan migrate`. The constraint migration intentionally stops
   when legacy data violates the target model.
4. If it stops, run `php artisan santrack:audit-data`.
5. Resolve duplicate, missing-ownership, or cross-instance data reported by
   the audit.
6. Re-run `php artisan migrate`.
7. Exercise schedule, attendance, promotion, and report flows before
   deploying.

The reconciliation migration backfills instance ownership and schedule state.
It intentionally keeps transitional production columns until a later release.

## Business configuration

```dotenv
SANTRACK_SKILL_PASSING_SCORE=65
SANTRACK_PROMOTION_PASSING_SCORE=65
SANTRACK_PROMOTION_MIN_ATTENDANCE=75
SANTRACK_TEACHER_GRACE_MINUTES=15
SANTRACK_ATTENDANCE_REPORT_RECIPIENTS=admin@example.com
```

Performance weights are centralized in `config/santrack.php`. Each academic
year row represents one odd/even semester; schedules explicitly declare
`regular`, `uts`, or `uas`, and class promotion only runs from genap to the
following ganjil.

## Scheduler and queue

Cron should invoke Laravel's scheduler once per minute:

```cron
* * * * * cd /path/to/api-santrack && php artisan schedule:run >> /dev/null 2>&1
```

Run the RabbitMQ report worker:

```bash
php artisan queue:work rabbitmq --queue=sipta.report.email_queue
```

Monthly attendance reports are dispatched once per active academic year and
sent to the configured recipients.

## Repository data policy

Database dumps and real student documents must remain outside Git. The
`database/backup` directory is for temporary local recovery work only.
