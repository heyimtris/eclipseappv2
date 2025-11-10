import { json } from "@remix-run/node";
import { getCollection } from "~/server/db.server";
import { ObjectId } from "mongodb";

export async function action({ request }: { request: Request }) {
  const body = await request.json();
  const { friendId, friendUsername, userId } = body;

  if ((!friendId && !friendUsername) || !userId) {
    return json({ error: "Missing friendId/friendUsername or userId" }, { status: 400 });
  }

  const users = await getCollection("users");
  
  const userObjectId = new ObjectId(userId);
  const user = await users.findOne({ _id: userObjectId });

  if (!user) {
    return json({ error: "User not found" }, { status: 404 });
  }

  // Find friend by ID or username
  let friend;
  let friendObjectId: ObjectId | undefined;
  
  if (friendId) {
    friendObjectId = new ObjectId(friendId);
    friend = await users.findOne({ _id: friendObjectId });
  } else if (friendUsername) {
    friend = await users.findOne({ username: friendUsername });
    if (friend) {
      friendObjectId = friend._id;
    }
  }

  if (!friend || !friendObjectId) {
    return json({ error: "Friend not found" }, { status: 404 });
  }

  // Check if they are already friends
  if (user.friends && user.friends.some((f: any) => String(f) === String(friendObjectId))) {
    return json({ error: "Already friends or request already sent" }, { status: 400 });
  }

  // make it so that the initiating user adds the friend, but not vice versa
  await users.updateOne(
    { _id: userObjectId },
    { $addToSet: { friends: friendObjectId } }
  );

  return json({ ok: true });
}

export default function AddFriendRoute() {
  return null; // UI handled by modal
}
