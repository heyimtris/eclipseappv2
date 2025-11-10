
import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
	index("routes/home.tsx"),
	route("auth", "routes/auth.tsx"),
	route("app", "routes/app.tsx"),
	route("messages/direct/:userId", "routes/messages.direct.$userId.tsx"),
	route("messages/group/:conversationId", "routes/messages.group.$conversationId.tsx"),
	route("api/auth", "routes/api.auth.tsx"),
	route("api/dbcheck", "routes/api.dbcheck.tsx"),
	route("api/messages/send", "routes/api/messages/send.tsx"),
	route("api/chats/create", "routes/api.chats.create.tsx"),
	route("api/friend/add", "routes/api.friend.add.tsx"),
	route("api/friend/rejectRequest", "routes/api.friend.rejectRequest.tsx"),
	route("api/auth/logout", "routes/api.auth.logout.tsx")
] satisfies RouteConfig;
