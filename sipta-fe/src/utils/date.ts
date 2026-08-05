const padDatePart = (value: number) => String(value).padStart(2, "0");

const parseDateValue = (value: string): Date | null => {
  const normalized = value.includes(" ") ? value.replace(" ", "T") : value;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

/**
 * Formats dates for user-facing text only. API payloads and native date input
 * values must remain in YYYY-MM-DD format.
 */
export const formatDateDDMMYYYY = (
  value?: string | Date | null,
  fallback = "-",
): string => {
  if (!value) return fallback;

  if (typeof value === "string") {
    const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.slice(0, 10));
    const hasTime = value.length > 10;
    if (dateOnly && !hasTime) {
      return `${dateOnly[3]}-${dateOnly[2]}-${dateOnly[1]}`;
    }
  }

  const parsed = value instanceof Date ? value : parseDateValue(value);
  if (!parsed || Number.isNaN(parsed.getTime())) return fallback;

  return [
    padDatePart(parsed.getDate()),
    padDatePart(parsed.getMonth() + 1),
    parsed.getFullYear(),
  ].join("-");
};

export const formatDateTimeDDMMYYYY = (
  value?: string | Date | null,
  fallback = "-",
): string => {
  if (!value) return fallback;
  const parsed = value instanceof Date ? value : parseDateValue(value);
  if (!parsed || Number.isNaN(parsed.getTime())) return fallback;

  const date = formatDateDDMMYYYY(parsed, fallback);
  const time = `${padDatePart(parsed.getHours())}:${padDatePart(parsed.getMinutes())}`;
  return `${date} ${time}`;
};
