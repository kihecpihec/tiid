import { cp, mkdir } from "node:fs/promises";
// Next traces server files; public assets must be copied alongside them.
await mkdir(".next/standalone/.next", { recursive: true });
await cp("public", ".next/standalone/public", { recursive: true });
await cp(".next/static", ".next/standalone/.next/static", { recursive: true });
