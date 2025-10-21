import { useParams, useNavigate, useLoaderData, useRevalidator } from "react-router";
import { Button } from "../components/button";
import { ChatSidebar } from "../components/ChatSidebar";
import { Avatar } from "../components/avatar";
import { Input } from "../components/input";
import { getCollection } from "~/server/db.server";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import { redirect } from "react-router";
import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

const statusTypes = {
    0: "offline",
    1: "online",
    2: "away",
    3: "dnd"
}

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

  // Fetch the other user
  const otherUser = await users.findOne({ _id: new ObjectId(params.userId) });

  // Fetch friends
  const friends = user.friends?.length
    ? await users.find({ _id: { $in: user.friends.map((f: any) => new ObjectId(f.$oid || f)) } }).toArray()
    : [];

  // Fetch conversations
  const conversationsCol = await getCollection("conversations");
  const conversations = user.conversations?.length
    ? await conversationsCol.find({ _id: { $in: user.conversations.map((c: any) => new ObjectId(c.$oid || c)) } }).toArray()
    : [];
  // Debug: print all conversations after fetching
  console.log('[LOADER] All conversations:', JSON.stringify(conversations, null, 2));


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
    // Use messages from conversation property
    const convMessages = Array.isArray(conv.messages) ? conv.messages : [];
    messages[String(conv._id)] = convMessages.map((msg: any) => {
      const authorId = toIdString(msg.author);
      let authorUser = participants.find((p: any) => toIdString(p._id) === authorId);
      if (!authorUser) {
        authorUser = { _id: authorId, username: "Unknown", avatar: "/pingu.jpg", status: 0 };
      }
      return {
        _id: toIdString(msg._id),
        sender: {
          _id: toIdString(authorUser._id),
          username: authorUser.username,
          avatar: authorUser.avatar,
          status: authorUser.status
        },
        text: msg.content,
        createdAt: msg.createdAt
      };
    });
  }
  // Debug log
  console.log("[LOADER] Normalized messages:", messages);

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
    otherUser: otherUser ? normalizeUser(otherUser) : null,
    friends: normFriends,
    conversations: normConversations,
    messages,
    participants: normParticipants,
  };
}


export default function DirectMessage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user, otherUser, friends, conversations, messages: loaderMessages, participants } = useLoaderData() as any;
  const revalidator = useRevalidator();

  // Find the direct conversation between user and otherUser
  const directConv = conversations.find((conv: any) => {
    const members = conv.members || conv.participants || [];
    return members.includes(user._id) && members.includes(otherUser?._id);
  });
  const convId = directConv?._id;
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  // No local messages state: always render from loaderMessages[convId]

  // Connect to socket.io server and join room
  useEffect(() => {
    if (!convId) return;
    if (!socketRef.current) {
      // Use zrok backend if running on zrok frontend, otherwise use localhost
      const frontendUrl = window.location.origin;
      let backendUrl = 'http://localhost:3001';
      if (frontendUrl === 'https://jih5mpgnpili.share.zrok.io') {
        backendUrl = 'https://gagjltrs7bw9.share.zrok.io';
      }
      socketRef.current = io(backendUrl);
    }
    const socket = socketRef.current;
    socket.emit("join", convId);
    // Listen for new messages and revalidate loader if for this conversation
    const handleMessage = (payload: any) => {
      if (payload?.conversationId === convId) {
        revalidator.revalidate();
      }
    };
    socket.on("message", handleMessage);
    return () => {
      socket.off("message", handleMessage);
      socket.emit("leave", convId);
    };
  }, [convId, revalidator]);

  // Send message handler
  async function sendMessage() {
    if (!input.trim() || !convId) return;
    setSending(true);
    try {
      const res = await fetch(window.location.pathname, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input }),
      });
      if (res.ok) {
        const newMsg = await res.json();
        // Emit to socket.io server for other clients
        if (socketRef.current) {
          socketRef.current.emit("message", { conversationId: convId, message: newMsg });
        }
        setInput("");
        revalidator.revalidate();
      }
    } finally {
      setSending(false);
    }
  }


  return (
    <main className="flex flex-row min-h-screen h-screen w-full m-0 p-0 bg-white dark:bg-gray-950">
      {/* Sidebar - hidden on mobile, visible on desktop */}
      <div className="hidden md:block">
        <ChatSidebar
          user={user}
          friends={friends}
          conversations={conversations}
          messages={loaderMessages}
          participants={participants}
          activeUserId={userId}
        />
      </div>
      {/* Main content area */}
      <div className="flex-1 flex flex-col mt-8 mb-8 md:mt-0 md:mb-0">
        <div className="flex items-center gap-2.5 p-4 border-b border-gray-300 dark:border-gray-700">
          <Button variant="text" onClick={() => navigate('/app')} className="md:hidden">
            ←
          </Button>
          <Avatar src={otherUser?.avatar ? otherUser.avatar === "default.png" ? "/pingu.jpg" : otherUser.avatar : "/pingu.jpg"} status={statusTypes[otherUser?.status as keyof typeof statusTypes]} style={{ width: '30px', height: '30px' }} />
          <h1 className="text-xl font-bold">
            {otherUser ? `${otherUser.username}` : 'Direct Message'}
          </h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-4 relative">
          <div className="message-list flex flex-col w-full max-w-xl overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
            {(loaderMessages[convId]?.length ?? 0) === 0 ? (
              <div className="text-gray-400 text-center py-8">No messages yet.</div>
            ) : (
              loaderMessages[convId]?.map((msg: any) => {
                const isOutgoing = msg.sender?._id === user._id;
                return (
                  <div
                    key={msg._id || msg.id}
                    className={`message flex mb-2 ${isOutgoing ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`message-content bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 max-w-xs break-words ${isOutgoing ? 'ml-auto text-right' : 'mr-auto text-left'}`}
                    >
                      <p className="message-author font-semibold text-sm text-gray-500 mb-1">
                        {isOutgoing ? 'You' : msg.sender?.username || 'Unknown'}
                      </p>
                      <p className="message-text text-base">{msg.text}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="input w-full max-w-xl mt-4 flex gap-2 sticky bottom-0 bg-white dark:bg-gray-950 py-2 z-10">
            <Input
              label="Type your message..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") sendMessage(); }}
              disabled={sending}
            />
            <Button variant="primary" onClick={sendMessage} disabled={sending || !input.trim()}>
              Send
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}

export async function action({ request, params }: { request: Request; params: any }) {
  console.log("ACTION CALLED");
  const body = await request.json();
  const { text } = body;
  const otherUserId = params.userId;
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