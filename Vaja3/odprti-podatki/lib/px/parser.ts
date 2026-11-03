import "server-only";
import { extractMetadata } from "./metadata";
import { parseStatements, tokenize } from "./tokenize";
import type { Dataset, Observation } from "./types";

/** No IO or cache here. The route supplies freshly read original bytes. */
export function parsePx(bytes: Uint8Array): Dataset {
  return parsePxText(
    new TextDecoder("windows-1250", { fatal: true }).decode(bytes),
  );
}

export function parsePxText(source: string): Dataset {
  const { dimensions, metadata, data } = extractMetadata(
    parseStatements(tokenize(source)),
  );
  const expected = dimensions.reduce(
    (size, d) => size * d.categories.length,
    1,
  );
  if (!Number.isSafeInteger(expected) || data.tokens.length !== expected)
    throw new Error(
      `PX: pričakovanih ${expected} celic, prejetih ${data.tokens.length}.`,
    );
  const markers = new Set([
    ".",
    "..",
    "...",
    ":",
    ...Object.values(metadata.symbols),
  ]);
  const notes = new Map(
    metadata.cellAnnotations.map((n) => [
      JSON.stringify(n.coordinates),
      n.text,
    ]),
  );
  const observations: Observation[] = data.tokens.map((token, index) => {
    let remainder = index;
    const coordinates = Array<string>(dimensions.length);
    const codes = new Map<string, string>();
    for (let d = dimensions.length - 1; d >= 0; d--) {
      const categories = dimensions[d].categories;
      const code = categories[remainder % categories.length].code;
      remainder = Math.floor(remainder / categories.length);
      coordinates[d] = code;
      codes.set(dimensions[d].name, code);
    }
    let value: number | null = null;
    let marker: string | null = null;
    if (
      token.kind === "word" &&
      /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(token.value) &&
      Number.isFinite(Number(token.value))
    )
      value = Number(token.value);
    else if (token.kind !== "symbol" && markers.has(token.value))
      marker = token.value;
    else
      throw new Error(
        `PX: nepričakovan podatkovni token »${token.value}« v celici ${index + 1}.`,
      );
    const annotation = notes.get(JSON.stringify(coordinates));
    // Dimension membership was validated in metadata extraction.
    return {
      year: Number(codes.get("LETO")),
      purposeCode: codes.get("NAMEN UPORABE INTERNETA")!,
      sexCode: codes.get("SPOL")!,
      educationCode: codes.get("IZOBRAZBA")!,
      value,
      marker,
      annotations: annotation === undefined ? [] : [annotation],
    };
  });
  return { dimensions, metadata, observations };
}
