import { getCollection } from "../../../../server/db.server";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

export async function action({ request }: { request: Request }) {
  const body = await request.json();
  const { conversationId, text } = body;
  if (!conversationId || !text) {
    return new Response(JSON.stringify({ error: "Missing conversationId or text" }), { 
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  // Get user from JWT/cookie
  const cookie = request.headers.get("cookie") || "";
  const match = cookie.match(/token=([^;]+)/);
  if (!match) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  
  let payload: any = null;
  try {
    payload = jwt.verify(match[1], JWT_SECRET);
  } catch {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  // Fetch user info
  const users = await getCollection("users");
  const user = await users.findOne({ _id: new ObjectId(payload.id) });
  if (!user) {
    return new Response(JSON.stringify({ error: "User not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  }

  const messagesCol = await getCollection("messages");
  const messageDoc = {
    author: new ObjectId(payload.id),
    content: text,
    conversation: new ObjectId(conversationId),
    attachments: [],
    reactions: [],
    createdAt: new Date(),
  };
  const result = await messagesCol.insertOne(messageDoc);
  
  // Return normalized format for UI
  return new Response(JSON.stringify({
    _id: result.insertedId.toString(),
    sender: {
      _id: user._id.toString(),
      username: user.username,
      avatar: user.avatar,
      status: user.status
    },
    text: text,
    createdAt: messageDoc.createdAt
  }), {
    headers: { "Content-Type": "application/json" }
  });
}
