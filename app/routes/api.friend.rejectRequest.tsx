import { json } from "@remix-run/node";
import { getCollection } from "~/server/db.server";
import { ObjectId } from "mongodb";

export async function action({ request }: { request: Request }) {
  const body = await request.json();
  const { friendId, userId } = body;

  if (!friendId || !userId) {
    return json({ error: "Missing friendId or userId" }, { status: 400 });
  }

  const users = await getCollection("users");
  
  const userObjectId = new ObjectId(userId);
  const friendObjectId = new ObjectId(friendId);
  const user = await users.findOne({ _id: userObjectId });
  const friend = await users.findOne({ _id: friendObjectId });

  if (!user || !friend) {
    return json({ error: "User or friend not found" }, { status: 404 });
  }

  // Check if they are already friends
  if (user.friends && user.friends.includes(friendObjectId)) {
    return json({ error: "Already friends" }, { status: 400 });
  }

  // remove us from the other users friend list
  await users.updateOne(
    { _id: friendObjectId },
    { $pull: { friends: userObjectId } }
  );
  
  return json({ ok: true });
}

export default function AddFriendRoute() {
  return null; // UI handled by modal
}
