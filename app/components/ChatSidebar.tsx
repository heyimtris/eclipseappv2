import React, { useState, useRef } from "react";
import { useNavigate } from "react-router";
import { Avatar } from "./avatar";
import { GroupChatAvatar } from "./groupchat-avatar";
import { User } from "./user";
import { Tab, TabContainer } from "./tabs";
import { Button } from "./button";
import { Banner } from "./banner"
import { Profile } from "../components/profile";


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

interface ChatSidebarProps {
    user: any;
    friends: any[];
    conversations: any[];
    messages: Record<string, any[]>;
    participants: any[];
    activeConversationId?: string;
    activeUserId?: string;
    orientation?: "horizontal" | "vertical";
}

export function ChatSidebar({ 
    user, 
    friends, 
    conversations, 
    messages, 
    participants,
    activeConversationId,
    activeUserId,
    orientation = "horizontal"
}: ChatSidebarProps) {
    const navigate = useNavigate();
    const tabs = ["Chats", "Servers", "Friends", "Avatar", "Search"];
    const [activeTab, setActiveTab] = useState("Chats");
    const [previousTab, setPreviousTab] = useState("Chats");
    const [searchValue, setSearchValue] = useState("");
    const searchBarRef = useRef<HTMLDivElement>(null);

    const safeConversations = Array.isArray(conversations) ? conversations : [];
    const safeParticipants = Array.isArray(participants) ? participants : [];

    const chatsData = safeConversations.map(conv => {
        const ids = Array.isArray(conv.members)
            ? conv.members.map((id: any) => String(id))
            : Array.isArray(conv.participants)
            ? conv.participants.map((id: any) => String(id))
            : [];
        const memberIds = ids.filter((id: string) => id !== String(user._id));
        const memberObjs = memberIds.map((id: string) => {
            const found = safeParticipants.find((u: any) => String(u._id) === String(id));
            return found;
        }).filter(Boolean);

        if (memberObjs.length > 1) {
            return {
                isGroup: true,
                conversationId: String(conv._id),
                members: memberObjs,
                memberCount: memberObjs.length,
                name: conv.name || memberObjs.map((m: any) => m.username).join(', ') || `Group Chat (${memberObjs.length})`,
                isActive: activeConversationId === String(conv._id)
            };
        } else if (memberObjs.length === 1) {
            const other = memberObjs[0];
            return {
                isGroup: false,
                userId: String(other._id),
                username: other?.username || "Unknown",
                status: other?.status || "offline",
                customStatus: other?.customStatus || "",
                avatar: other?.avatar === "default.png" ? "/pingu.jpg" : other?.avatar || "/pingu.jpg",
                statusType: ["offline", "online", "away", "dnd"][other?.status || 0] || "offline",
                isActive: activeUserId === String(other._id)
            };
        } else {
            return {
                isGroup: false,
                userId: memberIds[0] || "unknown",
                username: "Chat",
                status: "offline",
                customStatus: "",
                avatar: "/pingu.jpg",
                statusType: "offline",
                isActive: false
            };
        }
    });

    // get users that friended us but we haven't friend them back yet (incoming requests)
    const friendRequests = safeParticipants.filter(participant => {
        return participant.friends && participant.friends.includes(user._id) && !friends.find(friend => friend._id === participant._id);
    });

    // get users that we friended but they haven't friended us back yet (outgoing requests)
    const outgoingRequests = safeParticipants.filter(participant => {
        return user.friends && user.friends.includes(participant._id) && !participant.friends?.includes(user._id);
    });

    const friendsData = friends.map(friend => ({
        username: friend.username,
        status: friend.status || "",
        customStatus: friend.customStatus || "",
        avatar: friend.avatar === "default.png" ? "/pingu.jpg" : friend.avatar || "/pingu.jpg",
        statusType: ["offline", "online", "away", "dnd"][friend.status || 0] || "offline"
    }));

    const serversData: any[] = [];

    const getFilteredData = () => {
        const searchLower = searchValue.toLowerCase();
        if (previousTab === "Chats") {
            return chatsData.filter(chat => {
                if (!chat.isGroup) {
                    return (
                        (chat.username && typeof chat.username === "string" ? chat.username.toLowerCase() : "").includes(searchLower) ||
                        (chat.status && typeof chat.status === "string" ? chat.status.toLowerCase() : "").includes(searchLower)
                    );
                }
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
            return serversData.filter(server => {
                const tabs = ["Chats", "Friends", "Avatar", "Search"];
            });
        }
        return [];
    };
                    // Popup state for + and user avatar
                    const [showPlusPopup, setShowPlusPopup] = useState(false);
                    const [showUserPopup, setShowUserPopup] = useState(false);

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

    function acceptFriendRequest(requesterId: string) {
        fetch('/api/friend/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ friendId: requesterId, userId: String(user._id) })
        });
    }

    function rejectFriendRequest(requesterId: string) {
        // remove us from their friends list
        fetch('/api/friend/rejectRequest', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ friendId: requesterId, userId: String(user._id) })
        });
    }

    function cancelFriendRequest(requesteeId: string) {
        // remove them from our friends list
        fetch('/api/friend/cancelRequest', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ friendId: requesteeId, userId: String(user._id) })
        });
    }

    return (
        <>
        {showPlusPopup && (
                     <div className="absolute top-0 left-0 w-screen h-screen  bg-opacity-50 flex items-center justify-center z-50" style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.5)'
                     }} onClick={() => setShowPlusPopup(false)}>
                        <div className="bg-gray-800 dark:bg-gray-800 p-12 rounded-2xl shadow-lg text-center flex flex-col" onClick={(e) => e.stopPropagation()}>
                            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
                                {activeTab == "Friends" ? "Add a new friend" : `Create a new ${activeTab.toLowerCase().slice(0, -1)}`}
                            </h2>
                            {activeTab == "Chats" && (
                                <>                                  <p className="text-gray-600 dark:text-gray-300 mb-6">DMs, group chats, anything goes!</p>
                                <div className="mb-6">
                                    <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Select friends to start a group chat:</h3>
                                    <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                                        {friends.map((friend: any) => (
                                            <label
                                                key={friend._id}
                                                className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                                            >
                                                <input
                                                    type="checkbox"
                                                    value={friend._id}
                                                    className="form-checkbox h-5 w-5 text-blue-600"
                                                />
                                                <Avatar src={friend.avatar === "default.png" ? "/pingu.jpg" : friend.avatar || "/pingu.jpg"} style={{ width: 32, height: 32 }} />
                                                <span className="font-medium text-gray-900 dark:text-gray-100">{friend.username || friend.nickname || "Unknown"}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <Button variant="primary" className="w-full" onClick={() => {
                                    fetch('/api/chats/create', {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json' 
                                        },
                                        body: JSON.stringify({
                                            memberIds: Array.from(document.querySelectorAll('input[type="checkbox"]:checked')).map((input: any) => input.value).concat([String(user._id)]),
                                        })
                                    }).then(response => {
                                        if (response.ok) {
                                            // Handle successful chat creation
                                            setShowPlusPopup(false);
                                        } else {
                                            alert("Failed to create chat.");
                                        }
                                    });
                                }}>
                                    Create Chat
                                </Button>
                                </>
                                )}
                            {activeTab == "Friends" && (
                                <>
                                <p className="text-gray-600 dark:text-gray-300 mb-6">enter their username below. it's that simple!</p>
                                <input
                                    type="text"
                                    placeholder="Friend's username"
                                    className="w-full p-3 rounded-lg mb-4 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <Button variant="primary" className="w-full" onClick={() => {
                                    const input = document.querySelector('input[type="text"]') as HTMLInputElement;
                                    fetch('/api/friend/add', {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json' 
                                        },
                                        body: JSON.stringify({
                                            friendUsername: input.value,
                                            userId: String(user._id)
                                        })
                                    }).then(async response => {
                                        if (response.ok) {
                                            // Handle successful friend request
                                            setShowPlusPopup(false);
                                        } else {
                                            const res = await response.json();
                                            alert("Failed to send friend request. Reason: " + res.error);
                                        }
                                    });
                                }}>
                                    Send Friend Request
                                </Button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            <div className={`sidebar p-4 w-full bg-gray-100 dark:bg-gray-800 border-r border-gray-300 dark:border-gray-700 flex ${
                orientation === "horizontal" ? "flex-col" : "flex-row"
            } ${
                orientation === "horizontal" ? "h-screen" : "h-full"
            }`}>
                
            {/* TabContainer at top for desktop only */}
            <div className={`hidden md:block mb-4 ${orientation === "vertical" ? "overflow-x-auto" : ""}`}>
                <TabContainer externalActiveTab={activeTab}>
                    {activeTab === "Search"
                        ? (
                            <div
                                ref={searchBarRef}
                                className="flex items-center relative rounded-3xl overflow-hidden bg-gray-850 dark:bg-gray-900"
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
            <div className={`flex-1 mt-5 md:mt-0 overflow-hidden`}>
                {activeTab === "Chats" && (
                    <div className={`sidebar-list flex items-center ${orientation === "vertical" ? "justify-start" : "justify-center"} mt-6 md:mt-0 gap-1 ${
                        orientation === "horizontal" ? "flex-col" : "flex-row"
                    }`}>
                        {chatsData.map((chat, index) => (
                            chat.isGroup ? (
                                <User 
                                    key={index}
                                    onClick={() => navigate(`/messages/group/${chat.conversationId}`)}
                                    isActive={chat.isActive}
                                    style={orientation === "vertical" ? { width: 48, height: 48, minWidth: 48, minHeight: 48, padding: 0, justifyContent: 'center' } : {}}
                                >
                                    <GroupChatAvatar members={chat.members} />
                                    {orientation === "horizontal" && (
                                        <div>
                                            <h2 className="font-semibold text-lg">{chat.name}</h2>
                                            <p className="text-sm text-gray-400">{chat.memberCount + 1} Members</p>
                                        </div>
                                    )}
                                </User>
                            ) : (
                                <User 
                                    key={index}
                                    onClick={() => navigate(`/messages/direct/${chat.userId}`)}
                                    isActive={chat.isActive}
                                    style={orientation === "vertical" ? { width: 48, height: 48, minWidth: 48, minHeight: 48, padding: 0, justifyContent: 'center' } : {}}
                                >
                                    <Avatar src={chat.avatar} status={chat.statusType} style={orientation === "vertical" ? { width: 40, height: 40 } : {}} />
                                    {orientation === "horizontal" && (
                                        <div>
                                            <h2 className="font-semibold text-lg">{chat.username}</h2>
                                            <p className="text-sm text-gray-400">{chat.customStatus ? chat.customStatus : ""}</p>
                                        </div>
                                    )}
                                </User>
                            )
                        ))}
                    </div>
                )}

                {activeTab === "Servers" && (
                    <div className={`sidebar-list flex items-center ${orientation === "vertical" ? "justify-start" : "justify-center"} mt-6 md:mt-0 gap-1 ${
                        orientation === "horizontal" ? "flex-col" : "flex-row"
                    }`}>
                        {serversData.map((server, index) => (
                            <User key={index} style={orientation === "vertical" ? { width: 48, height: 48, minWidth: 48, minHeight: 48, padding: 0, justifyContent: 'center' } : {}}>
                                <div className="server-avatar bg-purple-400 text-white rounded-full flex items-center justify-center text-lg font-bold" style={orientation === "vertical" ? { width: 40, height: 40 } : {}}>
                                    {server.name.substring(0, 2).toUpperCase()}
                                </div>
                                {orientation === "horizontal" && (
                                    <div className="flex flex-col">
                                        <h2 className="font-semibold text-lg">{server.name}</h2>
                                        <p className="text-sm text-gray-400">
                                            {server.unread > 0 && <span className="unread-circle bg-blue-400 h-3 w-3 rounded-full inline-block mr-1"></span>}
                                            {server.unread > 0 ? `${server.unread} unread messages` : 'No new messages'}
                                        </p>
                                    </div>
                                )}
                            </User>
                        ))}
                    </div>
                )}

                {activeTab === "Friends" && (
                    <div className={`sidebar-list flex items-center ${orientation === "vertical" ? "justify-start" : "justify-center"} mt-6 md:mt-0 gap-1 ${
                        orientation === "horizontal" ? "flex-col" : "flex-row"
                    }`}>
                        {friendRequests.map((request, index) => (
                            <User key={index} style={orientation === "vertical" ? { width: 48, height: 48, minWidth: 48, minHeight: 48, padding: 0, justifyContent: 'center' } : {}}>
                                <Avatar src={request.avatar} status={request.statusType} style={orientation === "vertical" ? { width: 40, height: 40 } : {}} />
                                {orientation === "horizontal" && (
                                    <div>
                                        <h2 className="font-semibold text-lg">{request.username}</h2>
                                        <p className="text-sm text-gray-400">Incoming Friend Request</p>
                                    </div>
                                )}
                                <Button variant="primary" onClick={() => acceptFriendRequest(request._id)}>Accept</Button>
                                <Button variant="secondary" onClick={() => rejectFriendRequest(request._id)}>Reject</Button>
                            </User>
                        ))}
                        {outgoingRequests.map((request, index) => (
                            <User key={`outgoing-${index}`} style={orientation === "vertical" ? { width: 48, height: 48, minWidth: 48, minHeight: 48, padding: 0, justifyContent: 'center' } : {}}>
                                <Avatar src={request.avatar === "default.png" ? "/pingu.jpg" : request.avatar || "/pingu.jpg"} status={["offline", "online", "away", "dnd"][request.status || 0] || "offline"} style={orientation === "vertical" ? { width: 40, height: 40 } : {}} />
                                {orientation === "horizontal" && (
                                    <div>
                                        <h2 className="font-semibold text-lg">{request.username}</h2>
                                        <p className="text-sm text-gray-400">Outgoing Friend Request</p>
                                    </div>
                                )}
                                <Button variant="secondary" onClick={() => cancelFriendRequest(request._id)}>Cancel</Button>
                            </User>
                        ))}
                        {friendsData.map((friend, index) => (
                            <User key={index} style={orientation === "vertical" ? { width: 48, height: 48, minWidth: 48, minHeight: 48, padding: 0, justifyContent: 'center' } : {}}>
                                <Avatar src={friend.avatar} status={friend.statusType} style={orientation === "vertical" ? { width: 40, height: 40 } : {}} />
                                {orientation === "horizontal" && (
                                    <div>
                                        <h2 className="font-semibold text-lg">{friend.username}</h2>
                                        <p className="text-sm text-gray-400">{friend.customStatus ? friend.customStatus : toText(friend.statusType)}</p>
                                    </div>
                                )}
                            </User>
                        ))}
                    </div>
                )}

                {activeTab === "Search" && (
                    <div className={`sidebar-list flex items-center ${orientation === "vertical" ? "justify-start" : "justify-center"} mt-6 md:mt-0 gap-1 ${
                        orientation === "horizontal" ? "flex-col" : "flex-row"
                    }`}>
                        {searchValue ? (
                            <>
                                {previousTab === "Chats" && getFilteredData().length > 0 && (
                                    getFilteredData().map((chat: any, index: number) => (
                                        chat.isGroup ? (
                                            <User 
                                                key={index}
                                                onClick={() => navigate(`/messages/group/${chat.conversationId}`)}
                                                isActive={chat.isActive}
                                                style={orientation === "vertical" ? { width: 48, height: 48, minWidth: 48, minHeight: 48, padding: 0, justifyContent: 'center' } : {}}
                                            >
                                                <GroupChatAvatar members={chat.members} />
                                                {orientation === "horizontal" && (
                                                    <div>
                                                        <h2 className="font-semibold text-lg">{chat.name}</h2>
                                                        <p className="text-sm text-gray-400">{chat.memberCount + 1} Members</p>
                                                    </div>
                                                )}
                                            </User>
                                        ) : (
                                            <User 
                                                key={index}
                                                onClick={() => navigate(`/messages/direct/${chat.userId}`)}
                                                isActive={chat.isActive}
                                                style={orientation === "vertical" ? { width: 48, height: 48, minWidth: 48, minHeight: 48, padding: 0, justifyContent: 'center' } : {}}
                                            >
                                                <Avatar src={chat.avatar} status={chat.statusType} style={orientation === "vertical" ? { width: 40, height: 40 } : {}} />
                                                {orientation === "horizontal" && (
                                                    <div>
                                                        <h2 className="font-semibold text-lg">{chat.username}</h2>
                                                        <p className="text-sm text-gray-400">{chat.customStatus ? chat.customStatus : chat.status}</p>
                                                    </div>
                                                )}
                                            </User>
                                        )
                                    ))
                                )}
                                {previousTab === "Friends" && getFilteredData().length > 0 && (
                                    getFilteredData().map((friend: any, index: number) => (
                                        <User key={index} style={orientation === "vertical" ? { width: 48, height: 48, minWidth: 48, minHeight: 48, padding: 0, justifyContent: 'center' } : {}}>
                                            <Avatar src={friend.avatar} status={friend.statusType} style={orientation === "vertical" ? { width: 40, height: 40 } : {}} />
                                            {orientation === "horizontal" && (
                                                <div>
                                                    <h2 className="font-semibold text-lg">{friend.username}</h2>
                                                    <p className="text-sm text-gray-400">{friend.status}</p>
                                                </div>
                                            )}
                                        </User>
                                    ))
                                )}
                                {previousTab === "Servers" && getFilteredData().length > 0 && (
                                    getFilteredData().map((server: any, index: number) => (
                                        <User key={index} style={orientation === "vertical" ? { width: 48, height: 48, minWidth: 48, minHeight: 48, padding: 0, justifyContent: 'center' } : {}}>
                                            <div className="server-avatar bg-purple-400 text-white rounded-full flex items-center justify-center text-lg font-bold" style={orientation === "vertical" ? { width: 40, height: 40 } : {}}>
                                                {server.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            {orientation === "horizontal" && (
                                                <div className="flex flex-col">
                                                    <h2 className="font-semibold text-lg">{server.name}</h2>
                                                    <p className="text-sm text-gray-400">
                                                        {server.unread > 0 && <div className="unread-circle bg-blue-400 h-3 w-3 rounded-full inline-block mr-1"></div>}
                                                        {server.unread > 0 ? `${server.unread} unread messages` : 'No new messages'}
                                                    </p>
                                                </div>
                                            )}
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
                    <div className="sidebar-list flex flex-col mt-6 px-2 py-4 w-full">
                       <Profile
                           user={user}
                       />
                        
                        <div className="flex flex-row w-full gap-4 align-middle mt-6 text-center">
                            <Button variant="secondary" className="w-full mb-2">Settings</Button>
                            <Button variant="danger" className="w-full mb-2"
                            onClick={
                                () => {
                                    fetch('/api/auth/logout', {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json'
                                        }
                                    }).then(() => {
                                        navigate('/auth');
                                    });
                                }
                            }
                            >Logout</Button>
                        </div>
                    </div>
                )}
            </div>

            {/* plus button at bottom right of sidebar, for creating new chats/servers/friends */}
            { activeTab !== "Avatar" && activeTab !== "Search" ? (
            <div className="flex w-full justify-end mt-4 relative">
                <Button 
                    variant="primary"
                    className="rounded-full p-3"
                    onClick={() => setShowPlusPopup(!showPlusPopup)}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                </Button>
            </div>
            ) : null }

            {/* TabContainer at bottom for mobile only, matches desktop design and search logic */}
            <div className="md:hidden mt-auto pt-4">
                <TabContainer externalActiveTab={activeTab}>
                    {activeTab === "Search"
                        ? (
                            <div
                                ref={searchBarRef}
                                className="flex items-center relative rounded-3xl overflow-hidden bg-gray-850 dark:bg-gray-900"
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
        </>
    );
}
