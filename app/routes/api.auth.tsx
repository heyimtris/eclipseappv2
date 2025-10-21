
import type { ActionFunctionArgs } from "react-router";
import { getCollection, type UserDoc } from "~/server/db.server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
// import { generate2FACodeForUser } from "../utils/2fa";
// import { send2FACode } from "../utils/email";


const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

async function hashPassword(pw: string) {
  return await bcrypt.hash(pw, 10);
}

async function verifyPassword(pw: string, hash: string) {
  return await bcrypt.compare(pw, hash);
}

function validateEmail(email?: string) {
  return !!email && /.+@.+\..+/.test(email);
}

export async function action({ request }: ActionFunctionArgs) {
  try {
    const url = new URL(request.url);
    const intent = url.searchParams.get("intent"); // "signup" | "login"
    const form = await request.formData();
    const email = String(form.get("email") || "").trim().toLowerCase();
    const password = String(form.get("password") || "");
    const username = String(form.get("username") || "").trim();

    if (!validateEmail(email)) {
      return Response.json(
        { ok: false, code: "INVALID_EMAIL", error: "Invalid email" },
        { status: 400 }
      );
    }
    if (!password) {
      return Response.json(
        { ok: false, code: "PASSWORD_REQUIRED", error: "Password required" },
        { status: 400 }
      );
    }

    const users = await getCollection<UserDoc>("users");
    // Ensure unique indexes (safe to call repeatedly)
    try {
      await users.createIndex({ email: 1 }, { unique: true });
      await users.createIndex({ username: 1 }, { unique: true });
    } catch (e) {
      // ignore index errors at runtime
    }

  if (intent === "signup") {
      if (!username) {
        return Response.json(
          { ok: false, code: "USERNAME_REQUIRED", error: "Username required" },
          { status: 400 }
        );
      }
      const existing = await users.findOne({ $or: [{ email }, { username }] });
      if (existing) {
        return Response.json(
          { ok: false, code: "DUPLICATE_USER", error: "Email or username already in use" },
          { status: 409 }
        );
      }
      // 2FA temporarily disabled: create user immediately as verified
      const insert = await users.insertOne({
        email,
        username,
        passwordHash: await hashPassword(password),
        createdAt: new Date(),
        isVerified: true,
      });
      // Immediately sign in user: issue JWT and set cookie
      const token = jwt.sign(
        { email, username, id: (insert as any).insertedId },
        JWT_SECRET,
        { expiresIn: "7d" }
      );
      return new Response(
        JSON.stringify({ ok: true, user: { email, username }, token }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Set-Cookie": `token=${token}; HttpOnly; Path=/; Max-Age=604800; SameSite=Lax`,
          },
        }
      );
    }

    if (intent === "login") {
      const user = await users.findOne({ email });
      if (!user) {
        return Response.json(
          {
            ok: false,
            code: "USER_NOT_FOUND",
            error: "This email isn't on our systems!",
          },
          { status: 404 }
        );
      }

      // Handle legacy or malformed records
      let hash: string | undefined = (user as any).passwordHash;
      if (!hash || typeof hash !== "string") {
        const legacy = (user as any).password;
        // If legacy field looks like a bcrypt hash, migrate it
        if (typeof legacy === "string" && /^\$2[aby]\$/.test(legacy)) {
          try {
            await users.updateOne(
              { _id: (user as any)._id },
              { $set: { passwordHash: legacy }, $unset: { password: "" } }
            );
            hash = legacy;
          } catch {
            // ignore migration failure; fall through to error
          }
        }
      }

      if (!hash) {
        return Response.json(
          {
            ok: false,
            code: "INVALID_PASSWORD",
            error: "Oops! The password entered doesn't match ours; try another.",
          },
          { status: 401 }
        );
      }

      const ok = await verifyPassword(password, hash);
      if (!ok) {
        return Response.json(
          {
            ok: false,
            code: "INVALID_PASSWORD",
            error: "Oops! The password entered doesn't match ours; try another.",
          },
          { status: 401 }
        );
      }
      // 2FA temporarily disabled: log user in directly
      const token = jwt.sign(
        { email: user.email, username: user.username, id: (user as any)._id },
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

    return Response.json({ ok: false, code: "UNKNOWN_INTENT", error: "Unknown intent" }, { status: 400 });
  } catch (e: any) {
    return Response.json(
      { ok: false, code: "SERVER_ERROR", error: e?.message || String(e) },
      { status: 500 }
    );
  }
}

// No default export: this is an action-only route
