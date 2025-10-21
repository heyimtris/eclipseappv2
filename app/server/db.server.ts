import "dotenv/config";
import { MongoClient, Db, type Document } from "mongodb";

let client: MongoClient | null = null;
let db: Db | null = null;

// Prefer Atlas connection string if provided, else fallback to generic URI
const uri = (process.env.MONGODB_ATLAS_URI || process.env.MONGODB_URI) as string | undefined;
const dbName = process.env.MONGODB_DB || "eclipse";

if (!uri) {
  console.warn(
    "[db.server] No MongoDB URI set. Provide MONGODB_ATLAS_URI (preferred) or MONGODB_URI in your environment/.env."
  );
}

export async function getDb(): Promise<Db> {
  if (db && client) return db;
  if (!uri) throw new Error("MONGODB_URI not configured");
  client = new MongoClient(uri);
  await client.connect();
  db = client.db(dbName);
  return db;
}

export async function getCollection<T extends Document = Document>(name: string) {
  const database = await getDb();
  return database.collection<T>(name);
}

export type UserDoc = {
  _id?: any;
  email: string;
  username: string;
  // New hashed password field (preferred)
  passwordHash?: string;
  // Legacy field possibly present in older records
  password?: string;
  createdAt: Date;
  verificationCode?: {
    code: string;
    expires: number;
  };
  isVerified?: boolean;
};
