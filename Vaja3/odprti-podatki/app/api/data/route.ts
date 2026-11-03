import { readFile } from "node:fs/promises";
import path from "node:path";
import { connection } from "next/server";
import { parsePx } from "@/lib/px/parser";

// Node.js is the default runtime. Next 16.4 rejects an explicit runtime
// export with cacheComponents; node:fs keeps this route server-side.

export async function GET(): Promise<Response> {
  await connection();
  const headers = {
    "Cache-Control": "no-store, max-age=0",
    "CDN-Cache-Control": "no-store",
    "Vercel-CDN-Cache-Control": "no-store",
  };
  try {
    const bytes = await readFile(
      path.join(process.cwd(), "data/internet-slovenija.px"),
    );
    return Response.json(parsePx(bytes), { headers });
  } catch (error) {
    console.error("PX data loading failed:", error);
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Podatkov ni bilo mogoče prebrati.",
      },
      { status: 500, headers },
    );
  }
}
