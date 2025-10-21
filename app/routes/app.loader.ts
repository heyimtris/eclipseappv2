import { getCollection } from "~/server/db.server";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import { redirect } from "react-router";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

export async function loader({ request }: { request: Request }) {
  // Get JWT from cookie
  const cookie = request.headers.get("cookie") || "";
  const match = cookie.match(/token=([^;]+)/);
  if (!match) return redirect("/auth");
  let payload: any = null;
  try {
    payload = jwt.verify(match[1], JWT_SECRET);
  } catch {
    return redirect("/auth");
  }

  // Fetch user
  const users = await getCollection("users");
  const user = await users.findOne({ _id: new ObjectId(payload.id) });
  if (!user) return redirect("/auth");

  // Fetch friends
  const friends = user.friends?.length
    ? await users.find({ _id: { $in: user.friends.map((f: any) => new ObjectId(f.$oid || f)) } }).toArray()
    : [];

  // Fetch conversations
  const conversationsCol = await getCollection("conversations");
  const conversations = user.conversations?.length
    ? await conversationsCol.find({ _id: { $in: user.conversations.map((c: any) => new ObjectId(c.$oid || c)) } }).toArray()
    : [];

  // Normalize all conversation member/participant IDs to strings first
  const allConvUserIds = Array.from(new Set(
    conversations.flatMap(conv => {
      const ids = Array.isArray(conv.members)
        ? conv.members
        : Array.isArray(conv.participants)
        ? conv.participants
        : [];
      return ids.map((id: any) => toIdString(id));
    }).filter(id => id !== toIdString(user._id))
  ));

  // Debug: log allConvUserIds and their types
  console.log('allConvUserIds:', allConvUserIds);
  allConvUserIds.forEach(id => console.log('ID:', id, 'Type:', typeof id));
  const objectIdIds = allConvUserIds.filter(id => /^[a-fA-F0-9]{24}$/.test(id)).map(id => new ObjectId(id));
  const stringIds = allConvUserIds.filter(id => !/^[a-fA-F0-9]{24}$/.test(id));

  let participants: any[] = [];
  if (objectIdIds.length > 0 && stringIds.length > 0) {
    participants = await users.find({ $or: [
      { _id: { $in: objectIdIds } },
      // some DBs might store string ids; use $in directly
      { _id: { $in: stringIds as any[] } }
    ] }).toArray();
  } else if (objectIdIds.length > 0) {
    participants = await users.find({ _id: { $in: objectIdIds } }).toArray();
  } else if (stringIds.length > 0) {
    participants = await users.find({ _id: { $in: stringIds as any[] } }).toArray();
  }
  // Debug: log participants result
  console.log('participants result:', participants);

  // Fetch messages for each conversation
  const messagesCol = await getCollection("messages");
  const messages: Record<string, any[]> = {};
  for (const conv of conversations) {
  messages[String(conv._id)] = await messagesCol.find({ conversationId: conv._id }).toArray();
  }

  // Helper to convert ObjectId and Buffer to string
  function toIdString(id: any): string {
    if (!id) return "";
    if (typeof id === "string") return id;
    if (id.toHexString) return id.toHexString();
    if (id._bsontype === "ObjectID" && id.id) return Buffer.isBuffer(id.id) ? id.id.toString("hex") : String(id.id);
    if (Buffer.isBuffer(id)) return id.toString("hex");
    return String(id);
  }

  // Normalize IDs in users array
  function normalizeUser(u: any) {
    return {
      ...u,
      _id: toIdString(u._id),
      friends: Array.isArray(u.friends) ? u.friends.map(toIdString) : [],
      conversations: Array.isArray(u.conversations) ? u.conversations.map(toIdString) : [],
    };
  }

  // Normalize IDs in conversation
  function normalizeConversation(conv: any) {
    return {
      ...conv,
      _id: toIdString(conv._id),
      members: Array.isArray(conv.members) ? conv.members.map(toIdString) : undefined,
      participants: Array.isArray(conv.participants) ? conv.participants.map(toIdString) : undefined,
    };
  }

  // Normalize all data
  const normUser = normalizeUser(user);
  const normFriends = friends.map(normalizeUser);
  // Always include the current user in participants, and normalize all participant IDs to strings
  const normParticipants = [
    normalizeUser(user),
    ...participants
      .map(normalizeUser)
      .filter(u => toIdString(u._id) !== toIdString(user._id))
  ];
  const normConversations = conversations.map(normalizeConversation);

  // Return all data
  return {
    user: normUser,
    friends: normFriends,
    conversations: normConversations,
    messages,
    participants: normParticipants,
  };
}
