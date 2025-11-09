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
};

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
  // Loading spinner for infinite scroll
  const [loadingMore, setLoadingMore] = useState(false);
  // Number of messages to show (pagination)
  const [visibleCount, setVisibleCount] = useState(20);
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
  const [messages, setMessages] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState<string | false>(false);
  // Always use string for typing indicator
  const [unseenCount, setUnseenCount] = useState(0);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [sidebarOrientation, setSidebarOrientation] = useState<"horizontal" | "vertical">("horizontal");
  const messageListRef = useRef<HTMLDivElement | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // Update local messages state when loaderMessages or convId changes
  useEffect(() => {
  setMessages(loaderMessages[convId] || []);
  setVisibleCount(20); // Reset to 20 on conversation change
  }, [loaderMessages, convId]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messages]);

  // Scroll to bottom on initial load
  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
    setUnseenCount(0);
    setShowScrollButton(false);
  }, [convId]);

  // Connect to socket.io server and join room
  useEffect(() => {
    if (!convId) return;
    if (!socketRef.current) {
      socketRef.current = io("https://jcd2anv6aevvukhj.l.tunwg.com", {
        path: '/socket.io',
        transports: ['websocket'],
        withCredentials: true,
      });
      console.log("[SOCKET] Connected to server");
    }
  const socket = socketRef.current;
    console.log("[SOCKET] Emitting join for room:", convId);
    socket.emit("join", convId);
    // Listen for new messages and update local state
    const handleMessage = (payload: any) => {
      console.log("[SOCKET][DEBUG] Received message event:", payload, "convId:", convId);
      if (!payload) {
        console.warn("[SOCKET][DEBUG] No payload received for message event");
        return;
      }
      if (payload?.conversationId !== convId) {
        console.warn(`[SOCKET][DEBUG] Message event for wrong conversation: expected ${convId}, got ${payload?.conversationId}`);
        return;
      }
      if (!payload?.message) {
        console.warn("[SOCKET][DEBUG] Message event missing 'message' property:", payload);
        return;
      }
      setMessages(prev => {
        // If user is near bottom, scroll down
        if (messageListRef.current) {
          const { scrollTop, scrollHeight, clientHeight } = messageListRef.current;
          const nearBottom = scrollHeight - scrollTop - clientHeight < 100;
          if (nearBottom) {
            setTimeout(() => {
              if (messageListRef.current) {
                messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
              }
            }, 50);
            setUnseenCount(0);
            setShowScrollButton(false);
          } else {
            setUnseenCount(c => c + 1);
            setShowScrollButton(true);
          }
        }
        return [...prev, payload.message];
      });
    };
    // Listen for typing indicator
    const handleTyping = (payload: any) => {
      console.log("[SOCKET] Received typing event:", payload);
    // Only show typing indicator if another user is typing
    if (payload?.conversationId === convId && String(payload?.userId) !== String(user._id)) {
      let typingName = "User";
      if (participants && Array.isArray(participants)) {
        const typingUser = participants.find((p: any) => String(p._id) === String(payload.userId));
        typingName = typingUser?.username || "User";
      }
      setIsTyping(typingName);
      setTimeout(() => setIsTyping(false), 1500);
    }
    };
    socket.on("message", handleMessage);
    socket.on("typing", handleTyping);
    return () => {
      socket.off("message", handleMessage);
      socket.off("typing", handleTyping);
      console.log("[SOCKET] Emitting leave for room:", convId);
      socket.emit("leave", convId);
    };
  }, [convId, user._id]);

  // Send message handler
  async function sendMessage() {
    if (!input.trim() || !convId) return;
    setSending(true);
    try {
      // Use explicit route path for POST to ensure action is called
     await fetch(`/api/messages/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          text: input,
          userId: otherUser?._id
         }),
      }).then(async (res) => {
      console.log("[SOCKET][DEBUG] Message send response status:", res.status);
      if (res.status === 200) {
        console.log("[SOCKET][DEBUG] Message send response OK");
        const newMsg = await res.json();
        // Emit to socket.io server for other clients (and self via relay)
        if (socketRef.current) {
          console.log("[SOCKET][DEBUG] About to emit 'message' event:", { conversationId: convId, message: newMsg });
          socketRef.current.emit("message", { conversationId: convId, message: newMsg });
        } else {
          console.warn("[SOCKET][DEBUG] socketRef.current is null, cannot emit 'message'");
        }
        // Don't add message locally - let socket event handle it to avoid duplicates
        setInput("");
      } else {
        console.error("[SOCKET][DEBUG] Message send failed with status:", res.status);
      }
      });
  } finally {
    setSending(false);
  }
  }

  return (
    <main className={`grid h-screen w-full m-0 p-0 bg-white dark:bg-gray-950 overflow-hidden ${
      sidebarOrientation === "horizontal" 
        ? "grid-cols-1 md:grid-cols-[400px_1fr]" 
        : "grid-cols-1 md:grid-rows-[120px_1fr] gap-2"
    }
    `}>
      {/* Sidebar - hidden on mobile, visible on desktop */}
      <div className="hidden md:flex md:flex-col h-full border-r border-gray-200 dark:border-gray-800 overflow-hidden">
        <ChatSidebar
          user={user}
          friends={friends}
          conversations={conversations}
          messages={loaderMessages}
          participants={participants}
          activeUserId={userId}
          orientation={sidebarOrientation}
        />
      </div>
      {/* Main content area */}
      <div className="flex flex-col h-full min-h-0 overflow-hidden">
        <div className="w-full flex items-center gap-2.5 p-4 border-b border-gray-300 dark:border-gray-700 flex-shrink-0">
          <Button variant="text" onClick={() => navigate('/app')} className="md:hidden flex-shrink-0">
            ←
          </Button>
          <Avatar src={otherUser?.avatar ? otherUser.avatar === "default.png" ? "/pingu.jpg" : otherUser.avatar : "/pingu.jpg"} status={statusTypes[otherUser?.status as keyof typeof statusTypes]} style={{ width: '30px', height: '30px' }} />
          <h1 className="text-xl font-bold truncate min-w-0">
            {otherUser ? `${otherUser.username}` : 'Direct Message'}
          </h1>
          {/* Orientation toggle button - desktop only */}
          <Button 
            variant="text"
            onClick={() => setSidebarOrientation(prev => prev === "horizontal" ? "vertical" : "horizontal")}
            className="hidden md:flex ml-auto flex-shrink-0"
          >
            {sidebarOrientation === "horizontal" ? "⇅" : "⇄"}
          </Button>
        </div>
        <div className="flex-1 w-full flex flex-col relative min-h-0">
          <div
            ref={messageListRef}
            className="flex-1 min-h-0 w-full flex flex-col overflow-y-auto px-4 py-2"
            onScroll={e => {
              const el = e.currentTarget;
              const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
              setShowScrollButton(!nearBottom && messages.length > 0);
              if (nearBottom) setUnseenCount(0);
              // Infinite scroll: load more when scrolled to top
              if (el.scrollTop === 0 && messages.length > visibleCount && !loadingMore) {
                setLoadingMore(true);
                // Save current scroll height before loading more
                const prevScrollHeight = el.scrollHeight;
                setTimeout(() => {
                  setVisibleCount(c => {
                    const newCount = Math.min(c + 20, messages.length);
                    setTimeout(() => {
                      // After new messages render, adjust scroll position to keep user at the end of the new batch
                      if (messageListRef.current) {
                        const newScrollHeight = messageListRef.current.scrollHeight;
                        messageListRef.current.scrollTop = newScrollHeight - prevScrollHeight;
                      }
                      setLoadingMore(false);
                    }, 0);
                    return newCount;
                  });
                }, 400); // Simulate loading delay
              }
            }}
          >
            {messages.length === 0 ? (
              <div className="text-gray-400 text-center py-8">No messages yet.</div>
            ) : (
              <>
                {/* Loading spinner at top when loading more messages */}
                {loadingMore && (
                  <div className="w-full flex justify-center py-2">
                    <svg className="animate-spin h-6 w-6 text-gray-400" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                  </div>
                )}
                {messages.slice(-visibleCount).map((msg: any) => {
                  const isOutgoing = msg.sender?._id === user._id;
                  return (
                    <div
                      key={msg._id || msg.id}
                      className={`message flex mb-2 ${isOutgoing ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`message-content bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 max-w-[80vw] sm:max-w-xs break-words ${isOutgoing ? 'ml-auto text-right' : 'mr-auto text-left'}`}
                      >
                        <p className="message-author font-semibold text-sm text-gray-500 mb-1">
                          {isOutgoing ? 'You' : msg.sender?.username || 'Unknown'}
                        </p>
                        <p className="message-text text-base">{msg.text}</p>
                      </div>
                    </div>
                  );
                })}
                {/* Typing indicator bubble inside message list */}
                {isTyping && otherUser && (
                  <div className="message flex mb-2 justify-start">
                    <Avatar src={otherUser.avatar === "default.png" ? "/pingu.jpg" : otherUser.avatar || "/pingu.jpg"} status={statusTypes[otherUser.status as keyof typeof statusTypes]} style={{ width: 32, height: 32, marginRight: 8 }} />
                    <div className="message-content bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 max-w-[80vw] sm:max-w-xs break-words text-left animate-fade-in">
                      <p className="message-author font-semibold text-sm text-gray-500 mb-1">{otherUser.username}</p>
                      <span className="inline-flex items-center gap-1">
                        <span className="typing-dots" style={{ display: 'inline-block', minWidth: 24 }}>
                          <span className="dot bg-gray-400 dark:bg-gray-600 inline-block rounded-full w-2 h-2 mx-0.5 animate-bounce" style={{ animationDelay: '0s' }}></span>
                          <span className="dot bg-gray-400 dark:bg-gray-600 inline-block rounded-full w-2 h-2 mx-0.5 animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                          <span className="dot bg-gray-400 dark:bg-gray-600 inline-block rounded-full w-2 h-2 mx-0.5 animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                        </span>
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          {/* Typing indicator always visible at bottom of message area */}
          {isTyping && (
            <div className="w-full text-gray-400 text-sm py-2 px-4" style={{ position: 'absolute', left: 0, bottom: 0, pointerEvents: 'none', zIndex: 30 }}>
              {isTyping} is typing...
            </div>
          )}
          {showScrollButton && unseenCount > 0 && (
            <button
              className="absolute right-4 bottom-4 bg-blue-600 text-white px-3 py-1 rounded shadow flex items-center gap-2 z-20"
              onClick={() => {
                if (messageListRef.current) {
                  messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
                }
                setUnseenCount(0);
                setShowScrollButton(false);
              }}
            >
              ↓ {unseenCount} new message{unseenCount > 1 ? 's' : ''}
            </button>
          )}
          <div className="w-full flex-shrink-0 flex gap-2 bg-white dark:bg-gray-950 py-2 px-4 border-t border-gray-200 dark:border-gray-800">
            <Input
              label="Type your message..."
              value={input}
              onChange={e => {
                setInput(e.target.value);
                // Only emit typing event for other users
                if (socketRef.current && !sending) {
                  socketRef.current.emit("typing", { conversationId: convId, userId: user._id });
                }
              }}
              onKeyDown={e => { if (e.key === "Enter") sendMessage(); }}
              className="flex-1 w-full min-w-0"
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