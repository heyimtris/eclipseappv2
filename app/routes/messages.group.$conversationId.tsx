import { useParams, useNavigate, useLoaderData } from "react-router";
import { Button } from "../components/button";
import { ChatSidebar } from "../components/ChatSidebar";
import { getCollection } from "~/server/db.server";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import { redirect } from "react-router";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

export async function loader({ request, params }: { request: Request; params: any }) {
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

  // Fetch the conversation
  const conversationsCol = await getCollection("conversations");
  const conversation = await conversationsCol.findOne({ _id: new ObjectId(params.conversationId) });

  // Fetch friends
  const friends = user.friends?.length
    ? await users.find({ _id: { $in: user.friends.map((f: any) => new ObjectId(f.$oid || f)) } }).toArray()
    : [];

  // Fetch conversations
  const conversations = user.conversations?.length
    ? await conversationsCol.find({ _id: { $in: user.conversations.map((c: any) => new ObjectId(c.$oid || c)) } }).toArray()
    : [];

  // Get all participants
  const allConvUserIds = Array.from(new Set(
    conversations.flatMap(conv => {
      const ids = Array.isArray(conv.members) ? conv.members : Array.isArray(conv.participants) ? conv.participants : [];
      return ids.map((id: any) => String(id));
    }).filter(id => id !== String(user._id))
  ));

  const objectIdIds = allConvUserIds.filter(id => /^[a-fA-F0-9]{24}$/.test(id)).map(id => new ObjectId(id));
  const stringIds = allConvUserIds.filter(id => !/^[a-fA-F0-9]{24}$/.test(id));

  let participants: any[] = [];
  if (objectIdIds.length > 0 && stringIds.length > 0) {
    participants = await users.find({ $or: [
      { _id: { $in: objectIdIds } },
      { _id: { $in: stringIds as any[] } }
    ] }).toArray();
  } else if (objectIdIds.length > 0) {
    participants = await users.find({ _id: { $in: objectIdIds } }).toArray();
  } else if (stringIds.length > 0) {
    participants = await users.find({ _id: { $in: stringIds as any[] } }).toArray();
  }

  const messagesCol = await getCollection("messages");
  const messages: Record<string, any[]> = {};
  for (const conv of conversations) {
    messages[String(conv._id)] = await messagesCol.find({ conversationId: conv._id }).toArray();
  }

  function toIdString(id: any): string {
    if (!id) return "";
    if (typeof id === "string") return id;
    if (id.toHexString) return id.toHexString();
    if (id._bsontype === "ObjectID" && id.id) return Buffer.isBuffer(id.id) ? id.id.toString("hex") : String(id.id);
    if (Buffer.isBuffer(id)) return id.toString("hex");
    return String(id);
  }

  function normalizeUser(u: any) {
    return {
      ...u,
      _id: toIdString(u._id),
      friends: Array.isArray(u.friends) ? u.friends.map(toIdString) : [],
      conversations: Array.isArray(u.conversations) ? u.conversations.map(toIdString) : [],
    };
  }

  function normalizeConversation(conv: any) {
    return {
      ...conv,
      _id: toIdString(conv._id),
      members: Array.isArray(conv.members) ? conv.members.map(toIdString) : undefined,
      participants: Array.isArray(conv.participants) ? conv.participants.map(toIdString) : undefined,
    };
  }

  const normUser = normalizeUser(user);
  const normFriends = friends.map(normalizeUser);
  const normParticipants = [
    normalizeUser(user),
    ...participants.map(normalizeUser).filter(u => toIdString(u._id) !== toIdString(user._id))
  ];
  const normConversations = conversations.map(normalizeConversation);

  return {
    user: normUser,
    conversation: conversation ? normalizeConversation(conversation) : null,
    friends: normFriends,
    conversations: normConversations,
    messages,
    participants: normParticipants,
  };
}

export default function GroupChat() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user, conversation, friends, conversations, messages, participants } = useLoaderData() as any;

  return (
    <main className="flex flex-row min-h-screen h-screen w-full m-0 p-0 bg-white dark:bg-gray-950">
      {/* Sidebar - hidden on mobile, visible on desktop */}
      <div className="hidden md:block">
        <ChatSidebar
          user={user}
          friends={friends}
          conversations={conversations}
          messages={messages}
          participants={participants}
          activeConversationId={conversationId}
        />
      </div>
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center gap-4 p-4 border-b border-gray-300 dark:border-gray-700">
          <Button variant="text" onClick={() => navigate('/app')} className="md:hidden">
            ← Back
          </Button>
          <h1 className="text-xl font-bold">
            {conversation?.name || 'Group Chat'}
          </h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <p className="text-gray-600 dark:text-gray-400">
            Group conversation: {conversation?.name || conversationId}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Message UI coming soon...
          </p>
        </div>
      </div>
    </main>
  );
}
