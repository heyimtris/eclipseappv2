import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import { getCollection } from "~/server/db.server";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET as string;
export async function action({ request, params }: { request: Request; params: any }) {

console.log("ACTION CALLED");
  const body = await request.json();
  const { text } = body;
  const otherUserId = body.userId;
  if (!otherUserId || !text) {
    return new Response(JSON.stringify({ error: "Missing userId or text" }), { 
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

  // Find the direct conversation between user and otherUser (ignore type field)
  const conversationsCol = await getCollection("conversations");
  const userObjId = user._id instanceof ObjectId ? user._id : new ObjectId(user._id);
  const otherObjId = otherUserId instanceof ObjectId ? otherUserId : new ObjectId(otherUserId);
  const query = {
    $or: [
      { members: { $all: [userObjId, otherObjId] } },
      { participants: { $all: [userObjId, otherObjId] } }
    ]
  };
  console.log('[ACTION] Conversation query:', JSON.stringify(query));
  const directConv = await conversationsCol.findOne(query);
  if (!directConv) {
    return new Response(JSON.stringify({ error: "Conversation not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  }

  // Add message to the conversation's messages array
  const messageDoc = {
    _id: new ObjectId(),
    author: user._id,
    content: text,
    attachments: [],
    reactions: [],
    createdAt: new Date(),
  };
  await conversationsCol.updateOne(
    { _id: directConv._id },
    { $push: { messages: messageDoc } } as any
  );
  // Debug: log the updated conversation
  const updatedConv = await conversationsCol.findOne({ _id: directConv._id });
  console.log('[ACTION] Updated conversation messages:', updatedConv?.messages);

  // Return normalized format for UI
  return new Response(JSON.stringify({
    _id: messageDoc._id.toString(),
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