import { Button } from "../components/button";
import { Input } from "../components/input";
import { Avatar } from "../components/avatar";
import { GroupChatAvatar } from "../components/groupchat-avatar";
import { User } from "../components/user";
import { useNavigate } from "react-router";

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
            <div className="sidebar h-screen p-4 w-full md:w-[400px] bg-gray-100 dark:bg-gray-800 border-r border-gray-300 dark:border-gray-700 flex flex-col">
                {/* TabContainer at top for desktop only */}
                <div className="hidden md:block mb-4">
                    <TabContainer externalActiveTab={activeTab}>
                    {activeTab === "Search"
                        ? (
                            <div
                                ref={searchBarRef}
                                className={`flex items-center relative rounded-3xl overflow-hidden bg-gray-850 dark:bg-gray-900`}
                                style={{
                                    minWidth: '48px',
                                    width: '100%',
                                    maxWidth: '100%',
                                    transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
                                }}
                            >
                                <button
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-white dark:text-white focus:outline-none z-10"
                                    style={{ transition: 'opacity 0.4s', opacity: 1 }}
                                    onClick={() => {
                                        setActiveTab(previousTab);
                                        setSearchValue("");
                                    }}
                                    tabIndex={0}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchValue}
                                    onChange={e => setSearchValue(e.target.value)}
                                    autoFocus
                                    className="pl-12 pr-4 py-3 rounded-3xl bg-gray-850 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-0 w-full"
                                    style={{
                                        opacity: 1,
                                        transform: 'translateX(0)',
                                        transition: 'opacity 0.4s, transform 0.4s',
                                    }}
                                />
                            </div>
                        )
                        : tabs.map(tab => (
                            tab === "Search"
                                ? <div
                                    key={tab}
                                    ref={searchBarRef}
                                    className="flex items-center relative w-12 h-12 bg-gray-850 dark:bg-gray-950 rounded-3xl overflow-hidden justify-center"
                                    style={{ minWidth: '48px', maxWidth: '48px' }}
                                >
                                    <button
                                        className="flex items-center justify-center px-4 h-10 rounded-3xl text-white bg-gray-850 dark:bg-gray-850 hover:scale-105 transition-transform duration-150 ease-in-out"
                                        onClick={() => {
                                            setPreviousTab(activeTab === "Avatar" ? "Chats" : activeTab);
                                            setActiveTab("Search");
                                        }}
                                        style={{ outline: 'none', border: 'none', background: 'none', minWidth: '48px', maxWidth: '48px' }}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                                        </svg>
                                    </button>
                                </div>
                                : <Tab
                                    key={tab}
                                    label={tab}
                                    isActive={activeTab === tab}
                                    onClick={() => {
                                        if (tab === "Chats") {
                                            setChatsClickCount(prev => {
                                                const next = prev + 1;
                                                if (next >= 10) {
                                                    setShowSpiral(true);
                                                    setTimeout(() => setShowSpiral(false), 4000);
                                                    return 0;
                                                }
                                                return next;
                                            });
                                        } else {
                                            setChatsClickCount(0);
                                        }
                                        if (activeTab !== "Search") {
                                            setPreviousTab(activeTab);
                                        }
                                        setActiveTab(tab);
                                        if (tab !== "Search") setSearchValue("");
                                    }}
                                />
                        ))
                    }
                </TabContainer>
                </div>

                {/* Content area - scrollable */}
                <div className="flex-1 overflow-y-auto mt-5 md:mt-0">
{activeTab === "Chats" && (
    <div className="sidebar-list flex flex-col items-center justify-center mt-6 md:mt-0">
        {chatsData.map((chat, index) => (
            chat.isGroup ? (
                <User 
                    key={index}
                    onClick={() => navigate(`/messages/group/${chat.conversationId}`)}
                    isActive={false}
                >
                    <GroupChatAvatar members={chat.members} />
                    <div>
                        <h2 className="font-semibold text-lg">{chat.name}</h2>
                        <p className="text-sm text-gray-400">{chat.memberCount + 1} Members</p>
                    </div>
                </User>
            ) : (
                <User 
                    key={index}
                    onClick={() => navigate(`/messages/direct/${chat.userId}`)}
                    isActive={false}
                >
                    <Avatar src={chat.avatar} status={chat.statusType} />
                    <div>
                        <h2 className="font-semibold text-lg">{chat.username}</h2>
                        <p className="text-sm text-gray-400">{chat.customStatus ? chat.customStatus : chat.status}</p>
                    </div>
                </User>
            )
        ))}
    </div>
)}

{activeTab === "Servers" && (
    <div className="sidebar-list flex flex-col items-center justify-center mt-6 md:mt-0">
        {serversData.map((server, index) => (
            <User key={index}>
                <div className="server-avatar bg-purple-400 text-white rounded-full h-10 w-10 flex items-center justify-center text-lg font-bold">
                    {server.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex flex-col">
                    <h2 className="font-semibold text-lg">{server.name}</h2>
                    <p className="text-sm text-gray-400">
                        {server.unread > 0 && <span className="unread-circle bg-blue-400 h-3 w-3 rounded-full inline-block mr-1"></span>}
                        {server.unread > 0 ? `${server.unread} unread messages` : 'No new messages'}
                    </p>
                </div>
            </User>
        ))}
    </div>
)}

{activeTab === "Friends" && (
    <div className="sidebar-list flex flex-col items-center justify-center mt-6 md:mt-0">
        {friendsData.map((friend, index) => (
            <User key={index}>
                <Avatar src={friend.avatar} status={friend.statusType} />
                <div>
                    <h2 className="font-semibold text-lg">{friend.username}</h2>
                    <p className="text-sm text-gray-400">{friend.customStatus ? friend.customStatus : toText(friend.statusType)}</p>
                </div>
            </User>
        ))}
    </div>
)}

    {activeTab === "Search" && (
    <div className="sidebar-list flex flex-col items-center justify-center mt-6 md:mt-0">
        {searchValue ? (
            <>
                {previousTab === "Chats" && getFilteredData().length > 0 && (
                    getFilteredData().map((chat: any, index: number) => (
                        chat.isGroup ? (
                            <User 
                                key={index}
                                onClick={() => navigate(`/messages/group/${chat.conversationId}`)}
                                isActive={false}
                            >
                                <GroupChatAvatar members={chat.members} />
                                <div>
                                    <h2 className="font-semibold text-lg">{chat.name}</h2>
                                    <p className="text-sm text-gray-400">{chat.memberCount + 1} Members</p>
                                </div>
                            </User>
                        ) : (
                            <User 
                                key={index}
                                onClick={() => navigate(`/messages/direct/${chat.userId}`)}
                                isActive={false}
                            >
                                <Avatar src={chat.avatar} status={chat.statusType} />
                                <div>
                                    <h2 className="font-semibold text-lg">{chat.username}</h2>
                                    <p className="text-sm text-gray-400">{chat.customStatus ? chat.customStatus : chat.status}</p>
                                </div>
                            </User>
                        )
                    ))
                )}
                {previousTab === "Friends" && getFilteredData().length > 0 && (
                    getFilteredData().map((friend: any, index: number) => (
                        <User key={index}>
                            <Avatar src={friend.avatar} status={friend.statusType} />
                            <div>
                                <h2 className="font-semibold text-lg">{friend.username}</h2>
                                <p className="text-sm text-gray-400">{friend.status}</p>
                            </div>
                        </User>
                    ))
                )}
                {previousTab === "Servers" && getFilteredData().length > 0 && (
                    getFilteredData().map((server: any, index: number) => (
                        <User key={index}>
                            <div className="server-avatar bg-purple-400 text-white rounded-full h-10 w-10 flex items-center justify-center text-lg font-bold">
                                {server.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                                <h2 className="font-semibold text-lg">{server.name}</h2>
                                <p className="text-sm text-gray-400">
                                    {server.unread > 0 && <div className="unread-circle bg-blue-400 h-3 w-3 rounded-full inline-block mr-1"></div>}
                                    {server.unread > 0 ? `${server.unread} unread messages` : 'No new messages'}
                                </p>
                            </div>
                        </User>
                    ))
                )}
                {getFilteredData().length === 0 && (
                    <p className="text-gray-400">No results found for "{searchValue}"</p>
                )}
            </>
        ) : (
            <p className="text-gray-400">Type to search {previousTab.toLowerCase()}...</p>
        )}
    </div>
    )}

        {activeTab === "Avatar" && (
            <div className="sidebar-list flex flex-col mt-6 px-2 py-4">
                <User
                
                >
                    <Avatar src={user.avatar === "default.png" ? "/pingu.jpg" : user.avatar || "/pingu.jpg"} status={["offline", "online", "away", "dnd"][user.status || 0] || "offline"} />
                    <div className="text-center">
                        <h2 className="font-semibold text-lg">{user.username}</h2>
                        <p className="text-sm text-gray-400">{user.customStatus || toText(["offline", "online", "away", "dnd"][user.status || 0] || "offline")}</p>
                    </div>
                </User>
                <div className="bio text-left mt-2 px-2">
                    <p className="text-gray-600 dark:text-gray-300">{user.bio || "No bio set."}</p>
                </div>
                <div className="flex flex-row w-full gap-4 align-middle mt-6 text-center">
                    <Button variant="primary" className="w-full mb-2">Edit Profile</Button>
                    <Button variant="secondary" className="w-full mb-2">Settings</Button>
                </div>
            </div>
        )}
                </div>

                {/* TabContainer at bottom for mobile only */}
                <div className="md:hidden mt-auto pt-4">
                    <TabContainer externalActiveTab={activeTab}>
                        {activeTab === "Search"
                            ? (
                                <div
                                    ref={searchBarRef}
                                    className={`flex items-center relative rounded-3xl overflow-hidden bg-gray-850 dark:bg-gray-900`}
                                    style={{
                                        minWidth: '48px',
                                        width: '100%',
                                        maxWidth: '100%',
                                        transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
                                    }}
                                >
                                    <button
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-white dark:text-white focus:outline-none z-10"
                                        style={{ transition: 'opacity 0.4s', opacity: 1 }}
                                        onClick={() => {
                                            setActiveTab(previousTab);
                                            setSearchValue("");
                                        }}
                                        tabIndex={0}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={searchValue}
                                        onChange={e => setSearchValue(e.target.value)}
                                        autoFocus
                                        className="pl-12 pr-4 py-3 rounded-3xl bg-gray-850 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-0 w-full"
                                        style={{
                                            opacity: 1,
                                            transform: 'translateX(0)',
                                            transition: 'opacity 0.4s, transform 0.4s',
                                        }}
                                    />
                                </div>
                            )
                            : tabs.map(tab => (
                                tab === "Search"
                                    ? <div
                                        key={tab}
                                        ref={searchBarRef}
                                        className="flex items-center relative w-12 h-12 bg-gray-850 dark:bg-gray-950 rounded-3xl overflow-hidden justify-center"
                                        style={{ minWidth: '48px', maxWidth: '48px' }}
                                    >
                                        <button
                                            className="flex items-center justify-center px-4 h-10 rounded-3xl text-white bg-gray-850 dark:bg-gray-850 hover:scale-105 transition-transform duration-150 ease-in-out"
                                            onClick={() => {
                                                setPreviousTab(activeTab === "Avatar" ? "Chats" : activeTab);
                                                setActiveTab("Search");
                                            }}
                                            style={{ outline: 'none', border: 'none', background: 'none', minWidth: '48px', maxWidth: '48px' }}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                                            </svg>
                                        </button>
                                    </div>
                                    : <Tab
                                        key={tab}
                                        label={tab}
                                        isActive={activeTab === tab}
                                        onClick={() => {
                                            if (tab === "Chats") {
                                                setChatsClickCount(prev => {
                                                    const next = prev + 1;
                                                    if (next >= 10) {
                                                        setShowSpiral(true);
                                                        setTimeout(() => setShowSpiral(false), 4000);
                                                        return 0;
                                                    }
                                                    return next;
                                                });
                                            } else {
                                                setChatsClickCount(0);
                                            }
                                            if (activeTab !== "Search") {
                                                setPreviousTab(activeTab);
                                            }
                                            setActiveTab(tab);
                                            if (tab !== "Search") setSearchValue("");
                                        }}
                                    />
                            ))
                        }
                    </TabContainer>
                </div>

</div>
            <div className="md:flex-1 w-full flex-col justify-center align-center items-center  hidden md:flex p-6 bg-white dark:bg-gray-950">
                <img className="w-24 h-24 mb-4" src="https://media.tenor.com/0TAtgtk6u6kAAAAj/cat-yippe.gif" alt="Eclipse Logo" />
                <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">Welcome to Eclipse!</h1>
                <p className="text-gray-700 dark:text-gray-300">&#8592; Use the sidebar to get started!</p>
            </div>
        </main>
    );
}