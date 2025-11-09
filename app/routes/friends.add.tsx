import { json } from "react-router";
import { getCollection } from "~/server/db.server";
import { ObjectId } from "mongodb";

export async function action({ request }: { request: Request }) {
  const body = await request.json();
  const { username } = body;
  if (!username) return json({ error: "Missing username" }, { status: 400 });
  // TODO: Get current user from JWT/cookie
  // For now, fake userId
  const currentUserId = "FAKE_USER_ID";
  const users = await getCollection("users");
  const friend = await users.findOne({ username });
  if (!friend) return json({ error: "User not found" }, { status: 404 });
  await users.updateOne(
    { _id: new ObjectId(currentUserId) },
    { $addToSet: { friends: friend._id } }
  );
  return json({ success: true });
}

export default function AddFriendRoute() {
  return null; // UI handled by modal
}
