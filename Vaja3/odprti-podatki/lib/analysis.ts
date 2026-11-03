import type { Dataset, Observation } from "./px/types";
export type Mode = "count" | "percent";
export interface Point {
  year: number;
  value: number | null;
  raw: Observation | undefined;
  denominator: Observation | undefined;
  reason: string | null;
}
export function observationKey(
  year: number,
  purpose: string,
  sex: string,
  education: string,
): string {
  return `${year}|${purpose}|${sex}|${education}`;
}
export function indexObservations(data: Dataset): Map<string, Observation> {
  return new Map(
    data.observations.map((r) => [
      observationKey(r.year, r.purposeCode, r.sexCode, r.educationCode),
      r,
    ]),
  );
}
export function derivePoint(
  index: Map<string, Observation>,
  year: number,
  purpose: string,
  sex: string,
  education: string,
  mode: Mode,
): Point {
  const raw = index.get(observationKey(year, purpose, sex, education));
  const denominator = index.get(observationKey(year, "STAT2", sex, education));
  let value = raw?.value ?? null;
  let reason: string | null =
    value === null
      ? `Ni podatka${raw?.marker ? ` (${raw.marker})` : ""}`
      : null;
  if (mode === "percent" && value !== null) {
    if (denominator?.value === null || denominator?.value === undefined) {
      value = null;
      reason = "Manjka osnova STAT2";
    } else if (denominator.value <= 0) {
      value = null;
      reason = "Ničelna ali neveljavna osnova STAT2";
    } else value = (value / denominator.value) * 100;
  }
  return { year, value, raw, denominator, reason };
}
export function latestSummary(points: Point[]): {
  latest: Point | undefined;
  change: number | null;
} {
  const latest = points.findLast((p) => p.value !== null);
  const previous = latest && points.find((p) => p.year === latest.year - 1);
  return {
    latest,
    change:
      latest?.value != null && previous?.value != null
        ? latest.value - previous.value
        : null,
  };
}
/** Strip markup rather than interpreting any source HTML. React also escapes this text. */
export function plainText(value: string): string {
  return value
    .replace(/<[^>]*>/g, "")
    .replaceAll("#", "\n")
    .trim();
}
