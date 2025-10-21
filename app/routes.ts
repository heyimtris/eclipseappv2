
import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
	index("routes/home.tsx"),
	route("auth", "routes/auth.tsx"),
	route("app", "routes/app.tsx"),
	route("messages/direct/:userId", "routes/messages.direct.$userId.tsx"),
	route("messages/group/:conversationId", "routes/messages.group.$conversationId.tsx"),
	route("api/auth", "routes/api.auth.tsx"),
	route("api/dbcheck", "routes/api.dbcheck.tsx")
] satisfies RouteConfig;
