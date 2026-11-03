export interface PxStatement {
  keyword: string;
  language: string | null;
  args: string[];
  tokens: PxToken[];
}
export interface PxToken {
  kind: "string" | "word" | "symbol";
  value: string;
}
export interface Category {
  code: string;
  label: string;
}
export interface Dimension {
  name: string;
  categories: Category[];
}
export interface Observation {
  year: number;
  purposeCode: string;
  sexCode: string;
  educationCode: string;
  value: number | null;
  marker: string | null;
  annotations: string[];
}
export interface Dataset {
  dimensions: Dimension[];
  observations: Observation[];
  metadata: {
    title: string;
    description: string;
    source: string;
    units: string;
    lastUpdated: string;
    language: string;
    notes: string[];
    categoryNotes: { dimension: string; category: string; text: string }[];
    cellAnnotations: { coordinates: string[]; text: string }[];
    symbols: Record<string, string>;
    /** Original parsed metadata, including language suffixes and arguments. DATA is excluded. */
    statements: PxStatement[];
  };
}
