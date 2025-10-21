import { getDb } from "~/server/db.server";

export async function loader() {
  const source = process.env.MONGODB_ATLAS_URI
    ? "atlas"
    : process.env.MONGODB_URI
    ? "uri"
    : "none";
  try {
    const db = await getDb();
    return Response.json({ ok: true, source, db: db.databaseName });
  } catch (e: any) {
    const msg = e?.message || String(e);
    return Response.json({ ok: false, source, error: msg });
  }
}
