import { test } from "node:test";
import assert from "node:assert/strict";
import { derivePoint, latestSummary, observationKey } from "../lib/analysis";
import type { Observation } from "../lib/px/types";
const row = (
  year: number,
  purposeCode: string,
  value: number | null,
): Observation => ({
  year,
  purposeCode,
  sexCode: "2",
  educationCode: "3",
  value,
  marker: value === null ? ".." : null,
  annotations: [],
});
test("percent uses matching population, preserves zero, and handles missing/zero denominators", () => {
  const rows = [
    row(2020, "STAT810", 10),
    row(2020, "STAT2", 40),
    row(2021, "STAT810", 0),
    row(2021, "STAT2", 50),
    row(2022, "STAT810", 5),
    row(2022, "STAT2", 0),
    row(2023, "STAT810", 5),
  ];
  const index = new Map(
    rows.map((r) => [
      observationKey(r.year, r.purposeCode, r.sexCode, r.educationCode),
      r,
    ]),
  );
  const point = (year: number) =>
    derivePoint(index, year, "STAT810", "2", "3", "percent");
  assert.equal(point(2020).value, 25);
  assert.equal(point(2021).value, 0);
  assert.equal(point(2022).value, null);
  assert.equal(point(2023).value, null);
  assert.equal(
    derivePoint(index, 2020, "STAT810", "1", "3", "percent").value,
    null,
  );
});
test("year-to-year change requires consecutive valid years", () => {
  const p = (year: number, value: number | null) => ({
    year,
    value,
    raw: undefined,
    denominator: undefined,
    reason: null,
  });
  assert.equal(
    latestSummary([p(2020, 5), p(2021, null), p(2022, 10)]).change,
    null,
  );
  assert.equal(
    latestSummary([p(2020, 5), p(2021, 0), p(2022, null)]).change,
    -5,
  );
  assert.equal(latestSummary([p(2020, 5), p(2022, 10)]).change, null);
});
