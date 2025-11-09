import { Banner } from "./banner"
import { Avatar } from "./avatar"

export function Profile({ user }: { user: any }) {
    return (
        <div className="w-full flex flex-col bg-gray-200 dark:bg-gray-200">
            <Banner src={user.banner} />
            <div className="flex flex-row">
            <Avatar
                src={user.avatar === "default.png" ? "/pingu.jpg" : user.avatar || "/pingu.jpg"}
                status={["offline", "online", "away", "dnd"][user.status || 0] || "offline"}
            />
            <div className="text-center mt-2">
                <h2 className="font-semibold text-lg">{user.username}</h2>
                <p className="text-sm text-gray-400">{user.customStatus || toText(["offline", "online", "away", "dnd"][user.status || 0] || "offline")}</p>
            </div>
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
