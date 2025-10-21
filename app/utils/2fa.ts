import { getCollection, type UserDoc } from "~/server/db.server";

export async function generate2FACodeForUser(email: string): Promise<string> {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = Date.now() + 5 * 60 * 1000;
  const users = await getCollection<UserDoc>("users");
  await users.updateOne(
    { email },
    { $set: { verificationCode: { code, expires } } }
  );
  return code;
}

export async function verify2FACodeForUser(email: string, code: string): Promise<boolean> {
  const users = await getCollection<UserDoc>("users");
  const user = await users.findOne({ email });
  if (!user || !user.verificationCode) return false;
  const entry = user.verificationCode;
  if (Date.now() > entry.expires) return false;
  if (entry.code !== code) return false;
  await users.updateOne({ email }, { $unset: { verificationCode: "" } });
  return true;
}
