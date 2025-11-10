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

  if (!user) {
    return json({ error: "User not found" }, { status: 404 });
  }

  // Remove the friend from the user's friends list (cancel outgoing request)
  await users.updateOne(
    { _id: userObjectId },
    { $pull: { friends: friendObjectId as any } }
  );

  return json({ ok: true });
}

export default function CancelFriendRequestRoute() {
  return null;
}
