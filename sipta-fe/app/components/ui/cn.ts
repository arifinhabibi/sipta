/**
 * Small internal className joiner. Kept in this file so `app/components/ui/*`
 * has zero external dependency footprint and can be lifted into a package later.
 */
export function cn(
  ...values: Array<string | false | null | undefined | Record<string, boolean>>
): string {
  const out: string[] = [];
  for (const v of values) {
    if (!v) continue;
    if (typeof v === "string") {
      out.push(v);
    } else if (typeof v === "object") {
      for (const [key, on] of Object.entries(v)) {
        if (on) out.push(key);
      }
    }
  }
  return out.join(" ");
}
