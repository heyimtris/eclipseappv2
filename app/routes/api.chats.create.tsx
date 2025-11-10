import { json } from "@remix-run/node";
import { getCollection } from "~/server/db.server";
import { ObjectId } from "mongodb";

export async function action({ request }: { request: Request }) {
    const body = await request.json();
    const { memberIds } = body;
    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
        return json({ error: "Missing memberIds" }, { status: 400 });
    }

    if (memberIds.length < 2) {
        return json({ error: "At least two members are required to create a conversation." }, { status: 400 });
    }

    let chatName = ""; // default empty name for 1:1 chats

    if (memberIds.length > 2) {
        // get username of all members for group chat name

        const users = await getCollection("users");
        const memberUsernames = await users
            .find({ _id: { $in: memberIds.map((id: string) => new ObjectId(id)) } })
            .project({ username: 1 })
            .toArray();
        chatName = memberUsernames.map(u => u.username).join(", ");
        // continue to create group chat below
    }

    const collection = await getCollection("conversations");
    const result = await collection.insertOne({
        members: memberIds.map((id: string) => new ObjectId(id)),
        messages: [],
        createdAt: new Date(),
        name: chatName
    });

    return json({ ok: true, conversationId: result.insertedId });
}

export default function CreateChatRoute() {
    return null; // No UI, API only
}

