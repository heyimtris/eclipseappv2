import { Banner } from "./banner"
import { Avatar } from "./avatar"
import { Button } from "./button"

export function Profile({ user }: { user: any }) {
    return (
        <div className="w-full flex flex-col gap-0 bg-gray-900 rounded-2xl overflow-hidden">
            <Banner src={user.banner} style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }} />
            <div className="flex flex-row p-4 space-x-2 items-center">
            <Avatar
                src={user.avatar === "default.png" ? "/pingu.jpg" : user.avatar || "/pingu.jpg"}
                status={["offline", "online", "away", "dnd"][user.status || 0] || "offline"}
                style={{ minWidth: 46, minHeight: 46 }}
            />
            <div className="text-left flex flex-col w-full gap-0 m-0 p-0">
                <h2 className="font-semibold text-lg m-0 p-0">{user.username}</h2>
                <p className={`text-sm text-gray-400 overflow-hidden`}>{user.customStatus || toText(["offline", "online", "away", "dnd"][user.status || 0] || "offline")}</p>
            </div>
            <Button
                variant="secondary"
                onClick={() => {
                    window.location.href = '/app/settings/profile';
                }}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                    <path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd" />

    </svg>
            </Button>
            </div>
            <div className="flex flex-col p-4 space-y-2">
                <h3 className="font-semibold text-sm mb-2 text-gray-500">About Me</h3>
                <p className="text-sm text-white">{user.bio || "No bio set."}</p>
            </div>
        </div>
    );
}

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
