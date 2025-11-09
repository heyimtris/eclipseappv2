import { json, redirect } from "@remix-run/node";
import { getCollection } from "~/server/db.server";
import { ObjectId } from "mongodb";

export async function action({ request }: { request: Request }) {
  const body = await request.json();
  const { userId } = body;
  if (!userId) return json({ error: "Missing userId" }, { status: 400 });
  // TODO: Get current user from JWT/cookie
  // For now, fake userId
  const currentUserId = "FAKE_USER_ID";
  const conversations = await getCollection("conversations");
  // Check if conversation already exists
  let conv = await conversations.findOne({ members: { $all: [currentUserId, userId] } });
  if (!conv) {
    conv = {
      _id: new ObjectId(),
      members: [currentUserId, userId],
      messages: [],
      createdAt: new Date(),
    };
    await conversations.insertOne(conv);
  }
  return redirect(`/messages/direct/${userId}`);
}

export default function NewChatRoute() {
  return null; // UI handled by modal
}
