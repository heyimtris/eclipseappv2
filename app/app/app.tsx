import { Button } from "../components/button";
import { Input } from "../components/input";
import { Avatar } from "../components/avatar";
import { GroupChatAvatar } from "../components/groupchat-avatar";
import { User } from "../components/user";
import { useNavigate } from "react-router";
// ...existing imports

import React, { useState, useRef } from "react";

function toText(status: string): string {
    switch (status) {
        case "online":
            return "Online";
        case "offline":
            return "Offline";
        case "away":
            return "Away";
        case "dnd":
            return "Do Not Disturb"
        default:
            return "Unknown";
    }
}

type Status = "online" | "offline" | "away";
type ChatItem = { username: string; status: string; avatar: string; statusType: Status };
type FriendItem = { username: string; status: string; avatar: string; statusType: Status };

function LoadingScreen() {
    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gray-950 bg-opacity-80">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-400 mb-6"></div>
            <span className="text-white text-2xl font-bold">Loading...</span>
        </div>
    );
}
import { Tab, TabContainer } from "../components/tabs";
import { ChatSidebar } from "~/components/ChatSidebar";



export function AppPage({ user, friends, conversations, messages, participants }: {
    user: any;
    friends: any[];
    conversations: any[];
    messages: Record<string, any[]>;
    participants: any[];
}) {
    const navigate = useNavigate();
    const [chatsClickCount, setChatsClickCount] = useState(0);
    const [showSpiral, setShowSpiral] = useState(false);
    const [loading, setLoading] = useState(false); // Set to true to show loading
    // removed new chat / add friend modal state — Sidebar handles the action button now

   
    const tabs = ["Chats", "Servers", "Friends", "Avatar", "Search"];
    const [activeTab, setActiveTab] = useState("Chats");
    const [previousTab, setPreviousTab] = useState("Chats"); // Track previous tab for search
    const [searchValue, setSearchValue] = useState("");
    const searchBarRef = useRef<HTMLDivElement>(null);

    // Real data for each tab
    const safeConversations = Array.isArray(conversations) ? conversations : [];
    const safeParticipants = Array.isArray(participants) ? participants : [];
    // Debug: log participants and safeParticipants to diagnose mobile/desktop mismatch
    console.log('AppPage participants prop:', participants);
    console.log('AppPage safeParticipants:', safeParticipants);
    const chatsData = safeConversations.map(conv => {
        const ids = Array.isArray(conv.members)
            ? conv.members.map((id: any) => String(id))
            : Array.isArray(conv.participants)
            ? conv.participants.map((id: any) => String(id))
            : [];
        // Exclude the current user
        const memberIds = ids.filter((id: string) => id !== String(user._id));
        const memberObjs = memberIds.map((id: string) => {
            const found = safeParticipants.find((u: any) => {
                console.log('Comparing member id:', id, 'with participant _id:', u._id);
                return String(u._id) === String(id);
            });
            return found;
        }).filter(Boolean);
        // Debug log
        console.log('conv:', conv);
        console.log('memberIds:', memberIds);
        console.log('memberObjs:', memberObjs);
        console.log('safeParticipants:', safeParticipants);
        if (memberObjs.length > 1) {
            // Group chat
            return {
                isGroup: true,
                conversationId: String(conv._id),
                members: memberObjs,
                memberCount: memberObjs.length,
                name: conv.name || memberObjs.map((m: any) => m.username).join(', ') || `Group Chat (${memberObjs.length})`,
            };
        } else if (memberObjs.length === 1) {
            // 1:1 chat
            const other = memberObjs[0];
            return {
                isGroup: false,
                userId: String(other._id),
                username: other?.username || "Unknown",
                status: other?.status || "offline",
                customStatus: other?.customStatus || "",
                avatar: other?.avatar === "default.png" ? "/pingu.jpg" : other?.avatar || "/pingu.jpg",
                statusType: ["offline", "online", "away", "dnd"][other?.status || 0] || "offline"
            };
        } else {
            // Fallback: no member info found
            return {
                isGroup: false,
                userId: memberIds[0] || "unknown",
                username: "Chat",
                status: "offline",
                customStatus: "",
                avatar: "/pingu.jpg",
                statusType: "offline"
            };
        }
    });

    const friendsData = friends.map(friend => ({
      username: friend.username,
      status: friend.status || "",
      customStatus: friend.customStatus || "",
      avatar: friend.avatar === "default.png" ? "/pingu.jpg" : friend.avatar || "/pingu.jpg",
      statusType: ["offline", "online", "away", "dnd"][friend.status || 0] || "offline"
    }));

    // Placeholder for serversData (implement if you have servers)
    const serversData: any[] = [];

    // Filter data based on search value and previous tab
    const getFilteredData = () => {
        const searchLower = searchValue.toLowerCase();
        if (previousTab === "Chats") {
            return chatsData.filter(chat => {
                // DM: match username or status
                if (!chat.isGroup) {
                    return (
                        (chat.username && typeof chat.username === "string" ? chat.username.toLowerCase() : "").includes(searchLower) ||
                        (chat.status && typeof chat.status === "string" ? chat.status.toLowerCase() : "").includes(searchLower)
                    );
                }
                // Group chat: match group name or any member username
                const groupName = chat.name && typeof chat.name === "string" ? chat.name.toLowerCase() : "";
                const memberNames = Array.isArray(chat.members)
                    ? chat.members.map((m: any) => (m.username ? m.username.toLowerCase() : ""))
                    : [];
                return groupName.includes(searchLower) || memberNames.some(n => n.includes(searchLower));
            });
        } else if (previousTab === "Friends") {
            return friendsData.filter(friend => 
                friend.username.toLowerCase().includes(searchLower)
            );
        } else if (previousTab === "Servers") {
            return serversData.filter(server => 
                server.name.toLowerCase().includes(searchLower)
            );
        }
        return [];
    };

    React.useEffect(() => {
        if (activeTab === "Search") {
            const handleClick = (e: MouseEvent) => {
                if (searchBarRef.current && !searchBarRef.current.contains(e.target as Node)) {
                    setActiveTab(tabs[0]);
                }
            };
            document.addEventListener("mousedown", handleClick);
            return () => document.removeEventListener("mousedown", handleClick);
        }
    }, [activeTab]);

    // New chat / add friend handlers removed — user will implement if desired

    return (
        <main className="flex flex-row min-h-screen h-screen w-full m-0 p-0 relative">
            {loading && <LoadingScreen />}
            {showSpiral && (
                <div
                    style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        transform: "translate(-50%, -50%)",
                        zIndex: 10000, // Above loading screen
                        pointerEvents: "none"
                    }}
                >
                    <img
                        src="/pingu.jpg"
                        alt="Spiral"
                        style={{
                            width: "200px",
                            height: "200px",
                            animation: "spiralZoomOut 4s cubic-bezier(0.23, 1, 0.32, 1) forwards"
                        }}
                    />
                    <style>{`
                        @keyframes spiralZoomOut {
                            0% {
                                transform: scale(0.2) rotate(0deg);
                                opacity: 1;
                            }
                            80% {
                                transform: scale(1.2) rotate(720deg);
                                opacity: 1;
                            }
                            100% {
                                transform: scale(0.01) rotate(1080deg);
                                opacity: 0;
                            }
                        }
                    `}</style>
                </div>
            )}
           <ChatSidebar
               user={user}
          friends={friends}
          conversations={conversations}
          messages={messages}
          participants={participants}
          activeUserId={user._id}
          orientation="horizontal"
            />

            <div className="md:flex-1 w-full flex-col justify-center align-center items-center  hidden md:flex p-6 bg-white dark:bg-gray-950">
                <img className="w-24 h-24 mb-4" src="https://media.tenor.com/0TAtgtk6u6kAAAAj/cat-yippe.gif" alt="Eclipse Logo" />
                <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">Welcome to Eclipse!</h1>
                <p className="text-gray-700 dark:text-gray-300">&#8592; Use the sidebar to get started!</p>
            </div>
        </main>
    );
}