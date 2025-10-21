import { getCollection, type UserDoc } from "~/server/db.server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { verify2FACodeForUser } from "../utils/2fa";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

export async function action({ request }: { request: Request }) {
  try {
    const form = await request.formData();
    const email = String(form.get("email") || "").trim().toLowerCase();
    const code = String(form.get("code") || "").trim();
    const intent = String(form.get("intent") || ""); // "signup" or "login"

    if (!email || !code || !intent) {
      return Response.json({ ok: false, error: "Missing fields" }, { status: 400 });
    }
    const users = await getCollection<UserDoc>("users");
    const ok = await verify2FACodeForUser(email, code);
    if (!ok) {
      return Response.json({ ok: false, error: "Invalid or expired code" }, { status: 401 });
    }

    if (intent === "signup") {
      // Mark user as verified (or just remove verificationCode)
      await users.updateOne({ email }, { $unset: { verificationCode: "" } });
      return Response.json({ ok: true });
    }

    if (intent === "login") {
      const user = await users.findOne({ email });
      if (!user) return Response.json({ ok: false, error: "User not found" }, { status: 404 });
      // Issue JWT
      const token = jwt.sign(
        { email: user.email, username: user.username, id: user._id },
        JWT_SECRET,
        { expiresIn: "7d" }
      );
      return new Response(
        JSON.stringify({ ok: true, user: { email: user.email, username: user.username }, token }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Set-Cookie": `token=${token}; HttpOnly; Path=/; Max-Age=604800; SameSite=Lax`,
          },
        }
      );
    }

    return Response.json({ ok: false, error: "Unknown intent" }, { status: 400 });
  } catch (e: any) {
    return Response.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
