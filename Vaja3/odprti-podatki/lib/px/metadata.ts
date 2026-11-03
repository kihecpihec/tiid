import { stringList } from "./tokenize";
import type { Dataset, Dimension, PxStatement } from "./types";

export function extractMetadata(statements: PxStatement[]): {
  dimensions: Dimension[];
  metadata: Dataset["metadata"];
  data: PxStatement;
} {
  const defaults = statements.filter((s) => s.language === null);
  const seen = new Set<string>();
  for (const s of defaults) {
    const key = JSON.stringify([s.keyword, s.args]);
    if (seen.has(key))
      throw new Error(`PX: podvojena metapodatkovna izjava ${key}.`);
    seen.add(key);
    if (
      /^(HIERARCHIES|HIERARCHYLEVELS|PARTITIONED|CUBE|VALUEMAP|DOMAIN|SUBTABLE|ATTRIBUTE-ID)$/.test(
        s.keyword,
      )
    )
      throw new Error(`PX: nepodprta struktura ${s.keyword}.`);
  }
  const find = (key: string, args: string[] = []) =>
    defaults.find(
      (s) =>
        s.keyword === key && JSON.stringify(s.args) === JSON.stringify(args),
    );
  const required = (key: string, args: string[] = []) => {
    const entry = find(key, args);
    if (!entry)
      throw new Error(`PX: manjkajo metapodatki ${key}(${args.join(",")}).`);
    return entry;
  };
  const list = (key: string, args: string[] = []) =>
    stringList(required(key, args).tokens, key);
  const text = (key: string) => {
    const items = list(key);
    if (items.length !== 1 || !items[0])
      throw new Error(`PX: pričakovano besedilo za ${key}.`);
    return items[0];
  };
  if (
    text("CODEPAGE").toLowerCase() !== "windows-1250" ||
    text("LANGUAGE") !== "sl"
  )
    throw new Error(
      "PX: podprta sta CODEPAGE windows-1250 in privzeti jezik sl.",
    );
  const names = [...list("STUB"), ...list("HEADING")];
  const supported = ["LETO", "NAMEN UPORABE INTERNETA", "SPOL", "IZOBRAZBA"];
  if (
    names.length !== 4 ||
    new Set(names).size !== 4 ||
    !supported.every((n) => names.includes(n))
  )
    throw new Error(
      "PX: nepodprt nabor dimenzij (pričakovani leto, namen, spol in izobrazba).",
    );
  const dimensions = names.map((name) => {
    const labels = list("VALUES", [name]);
    const codes = list("CODES", [name]);
    if (
      !codes.length ||
      codes.length !== labels.length ||
      new Set(codes).size !== codes.length ||
      codes.some((c) => !c) ||
      labels.some((l) => !l)
    )
      throw new Error(`PX: neujemanje kod in oznak dimenzije ${name}.`);
    return {
      name,
      categories: codes.map((code, i) => ({ code, label: labels[i] })),
    };
  });
  const years = dimensions.find((d) => d.name === "LETO");
  if (!years?.categories.every((c) => /^\d{4}$/.test(c.code)))
    throw new Error("PX: nepodprte letne kode.");
  const symbols: Record<string, string> = {};
  for (const s of defaults.filter((s) => /^DATASYMBOL[1-6]$/.test(s.keyword)))
    symbols[s.keyword] = stringList(s.tokens, s.keyword).join("");
  const categoryNotes = defaults
    .filter((s) => /^VALUENOTE(X)?$/.test(s.keyword))
    .map((s) => {
      if (
        s.args.length !== 2 ||
        !dimensions.some(
          (d) =>
            d.name === s.args[0] &&
            d.categories.some(
              (c) => c.label === s.args[1] || c.code === s.args[1],
            ),
        )
      )
        throw new Error("PX: neveljavna opomba kategorije.");
      return {
        dimension: s.args[0],
        category: s.args[1],
        text: stringList(s.tokens, s.keyword).join(""),
      };
    });
  const cellAnnotations = defaults
    .filter((s) => s.keyword === "DATANOTECELL")
    .map((s) => {
      if (
        s.args.length !== dimensions.length ||
        !dimensions.every((d, i) =>
          d.categories.some((c) => c.code === s.args[i]),
        )
      )
        throw new Error("PX: neveljavne koordinate opombe celice.");
      return {
        coordinates: s.args,
        text: stringList(s.tokens, s.keyword).join(""),
      };
    });
  const data = required("DATA");
  if (
    statements.at(-1) !== data ||
    statements.filter((s) => s.keyword === "DATA").length !== 1
  )
    throw new Error("PX: DATA mora biti enkrat na koncu datoteke.");
  return {
    dimensions,
    data,
    metadata: {
      title: text("TITLE"),
      description: text("DESCRIPTION"),
      source: text("SOURCE"),
      units: text("UNITS"),
      lastUpdated: text("LAST-UPDATED"),
      language: "sl",
      notes: defaults
        .filter((s) => /^(NOTE|NOTEX)$/.test(s.keyword))
        .map((s) => stringList(s.tokens, s.keyword).join("")),
      categoryNotes,
      cellAnnotations,
      symbols,
      statements: statements.filter((s) => s.keyword !== "DATA"),
    },
  };
}
