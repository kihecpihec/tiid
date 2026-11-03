import type { PxStatement, PxToken } from "./types";

/** Lex the entire document: delimiters are structural only outside quoted strings. */
export function tokenize(source: string): PxToken[] {
  const tokens: PxToken[] = [];
  let i = 0;
  while (i < source.length) {
    const ch = source[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if (ch === '"') {
      i++;
      let value = "";
      let closed = false;
      while (i < source.length) {
        if (source[i] === '"') {
          if (source[i + 1] === '"') {
            value += '"';
            i += 2;
          } else {
            i++;
            closed = true;
            break;
          }
        } else {
          value += source[i++];
        }
      }
      if (!closed) throw new Error("PX: nezaključen narekovaj.");
      tokens.push({ kind: "string", value });
    } else if (";=,()[]".includes(ch)) {
      tokens.push({ kind: "symbol", value: ch });
      i++;
    } else {
      const start = i;
      while (i < source.length && !/[\s";=,()\[\]]/.test(source[i])) i++;
      tokens.push({ kind: "word", value: source.slice(start, i) });
    }
  }
  return tokens;
}

/** Adjacent quoted segments form one list item, never extra dimensions. */
export function stringList(tokens: PxToken[], context: string): string[] {
  const values: string[] = [];
  let current: string | undefined;
  for (const token of tokens) {
    if (token.kind === "string") current = (current ?? "") + token.value;
    else if (
      token.kind === "symbol" &&
      token.value === "," &&
      current !== undefined
    ) {
      values.push(current);
      current = undefined;
    } else throw new Error(`PX: neveljaven seznam ${context}.`);
  }
  if (current === undefined)
    throw new Error(`PX: prazen ali nedokončan seznam ${context}.`);
  values.push(current);
  return values;
}

export function parseStatements(tokens: PxToken[]): PxStatement[] {
  const statements: PxStatement[] = [];
  let start = 0;
  for (let end = 0; end < tokens.length; end++) {
    if (tokens[end].kind !== "symbol" || tokens[end].value !== ";") continue;
    const row = tokens.slice(start, end);
    start = end + 1;
    let i = 0;
    const keyword = row[i++];
    if (keyword?.kind !== "word" || !/^[A-Z][A-Z0-9-]*$/.test(keyword.value))
      throw new Error("PX: neveljavna ključna beseda.");
    let language: string | null = null;
    if (row[i]?.value === "[") {
      language = row[i + 1]?.value;
      if (row[i + 1]?.kind !== "word" || row[i + 2]?.value !== "]")
        throw new Error("PX: neveljavna jezikovna oznaka.");
      i += 3;
    }
    let args: string[] = [];
    if (row[i]?.value === "(") {
      const closing = row.findIndex(
        (t, n) => n > i && t.kind === "symbol" && t.value === ")",
      );
      if (closing === -1) throw new Error("PX: nezaključeni argumenti.");
      args = stringList(row.slice(i + 1, closing), keyword.value);
      i = closing + 1;
    }
    if (row[i]?.value !== "=" || row[i]?.kind !== "symbol")
      throw new Error(`PX: manjka = pri ${keyword.value}.`);
    statements.push({
      keyword: keyword.value,
      language,
      args,
      tokens: row.slice(i + 1),
    });
  }
  if (start !== tokens.length)
    throw new Error("PX: manjka zaključni podpičje.");
  return statements;
}
