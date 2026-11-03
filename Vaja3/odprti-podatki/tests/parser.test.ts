import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parsePx, parsePxText } from "../lib/px/parser";
import { parseStatements, tokenize } from "../lib/px/tokenize";

const bytes = readFileSync(
  new URL("../data/internet-slovenija.px", import.meta.url),
);
const fixture = `CODEPAGE="windows-1250"; LANGUAGE="sl"; TITLE="Naslov"; DESCRIPTION="Opis"; SOURCE="SURS"; UNITS="število"; LAST-UPDATED="20261008 10:30";
STUB="LETO","NAMEN UPORABE INTERNETA"; HEADING="SPOL","IZOBRAZBA";
VALUES("LETO")="2020","2021"; CODES("LETO")="2020","2021";
VALUES("NAMEN UPORABE INTERNETA")="Omrežja, mediji"; CODES("NAMEN UPORABE INTERNETA")="STAT810";
VALUES("SPOL")="Skupaj"; CODES("SPOL")="1";
VALUES("IZOBRAZBA")="Skupaj","Višja"; CODES("IZOBRAZBA")="1","2";
DATA=0 ".." 5 ":";`;

test("real Windows-1250 file: Slovenian labels, language separation, positional code alignment and exact size", () => {
  const d = parsePx(bytes);
  assert.match(d.metadata.description, /Število posameznikov/);
  assert.equal(d.metadata.units, "število");
  assert.deepEqual(
    d.dimensions.map((x) => x.categories.length),
    [12, 82, 3, 4],
  );
  assert.equal(d.observations.length, 11808);
  assert.equal(d.dimensions[1].categories[33].code, "STAT810");
  assert.match(d.dimensions[1].categories[33].label, /družbenih medijih/);
  assert.equal(d.dimensions[2].categories[2].label, "Ženske");
  assert.ok(
    d.metadata.statements.some(
      (s) =>
        s.keyword === "VALUES" && s.language === "en" && s.args[0] === "YEAR",
    ),
  );
  assert.equal(d.metadata.cellAnnotations.length, 10);
  assert.equal(
    d.observations.find(
      (r) =>
        r.year === 2020 &&
        r.purposeCode === "STAT2" &&
        r.sexCode === "2" &&
        r.educationCode === "2",
    )?.annotations[0],
    " M",
  );
});
test("real observation ordering: education, sex, purpose, then year", () => {
  const d = parsePx(bytes);
  assert.deepEqual(
    d.observations
      .slice(0, 5)
      .map((r) => [r.year, r.purposeCode, r.sexCode, r.educationCode, r.value]),
    [
      [2015, "STAT2", "1", "1", 1554075],
      [2015, "STAT2", "1", "2", 355837],
      [2015, "STAT2", "1", "3", 855161],
      [2015, "STAT2", "1", "4", 343078],
      [2015, "STAT2", "2", "1", 787481],
    ],
  );
  assert.equal(d.observations[12].purposeCode, "STAT25");
  assert.equal(d.observations[984].year, 2016);
});
test("multiline statements, quoted semicolons and commas, adjacent text, and language arguments", () => {
  const s = parseStatements(
    tokenize(
      'NOTE="Prvi; del, "\n"drugi del"; VALUES[en]("YEAR")=\n"2020",\n"2021";',
    ),
  );
  assert.equal(s.length, 2);
  assert.equal(s[1].language, "en");
  assert.deepEqual(s[1].args, ["YEAR"]);
  const d = parsePxText(
    fixture.replace('SOURCE="SURS";', 'SOURCE="Vir; "\n"SURS, Slovenija";'),
  );
  assert.equal(d.metadata.source, "Vir; SURS, Slovenija");
  assert.equal(d.dimensions[1].categories[0].label, "Omrežja, mediji");
});
test("missing values remain distinct from zero and other markers", () => {
  const d = parsePxText(fixture);
  assert.deepEqual(
    d.observations.map((r) => [r.value, r.marker]),
    [
      [0, null],
      [null, ".."],
      [5, null],
      [null, ":"],
    ],
  );
  assert.equal(
    parsePxText(fixture.replace("DATA=", 'DATASYMBOL1="0"; DATA='))
      .observations[0].value,
    0,
  );
  const symbols = parsePxText(
    fixture
      .replace("DATA=", 'DATASYMBOL4="z"; DATA=')
      .replace('5 ":"', '"z" "."'),
  );
  assert.deepEqual(
    symbols.observations.slice(2).map((r) => r.marker),
    ["z", "."],
  );
});
test("truncated real DATA fails exact cell-count validation", () => {
  const text = new TextDecoder("windows-1250").decode(bytes);
  assert.throws(
    () => parsePxText(text.replace(/\s+(?:\d+|"\.\.")\s*;\s*$/, ";")),
    /pričakovanih 11808 celic, prejetih 11807/,
  );
});
test("malformed metadata and unsupported variants fail clearly", () => {
  assert.throws(
    () =>
      parsePxText(
        fixture.replace('CODES("IZOBRAZBA")="1","2"', 'CODES("IZOBRAZBA")="1"'),
      ),
    /neujemanje kod/,
  );
  assert.throws(
    () => parsePxText(fixture.replace('UNITS="število";', "")),
    /manjkajo metapodatki UNITS/,
  );
  assert.throws(
    () =>
      parsePxText(fixture.replace("DATA=", 'HIERARCHIES("SPOL")="x"; DATA=')),
    /nepodprta struktura/,
  );
  assert.throws(
    () => parsePxText(fixture.replace('0 ".."', 'oops ".."')),
    /nepričakovan podatkovni token/,
  );
  assert.throws(() => parsePxText(fixture.slice(0, -1)), /podpičje/);
  assert.throws(() => tokenize('NOTE="broken;'), /nezaključen narekovaj/);
});
