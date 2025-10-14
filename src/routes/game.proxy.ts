import { FastifyInstance, FastifyPluginAsync } from "fastify";
import proxy from "@fastify/http-proxy";
import auth from "../plugins/auth";

const gameProxy: FastifyPluginAsync = async (app: any) => {
	const upstream = "ws://pong:4000"

	// HTTP REQUESTS - Game endpoints
	app.register(proxy, {
		upstream: upstream.replace("ws://", "http://"),
		prefix: "/api/getgame",
		rewritePrefix: "/getgame",
		// preHandler: app.authenticate,
	});
	
	// HTTP REQUESTS - Tournament endpoints
	app.register(proxy, {
		upstream: upstream.replace("ws://", "http://"),
		prefix: "/api/tournament",
		rewritePrefix: "/tournament",
		// preHandler: app.authenticate,
	});

	// WebSocket reconnection settings - more conservative
	const wsReconnect = {
		logs: true,
		pingInterval: 30000, // 30 seconds (match frontend heartbeat)
		reconnectOnClose: false, // Let the client handle reconnection logic
	}

	// SOCKET CONNECTIONS - Game WebSocket
	app.register(proxy, {
		upstream: upstream,
		wsUpstream: upstream,
		prefix: "/ws/game",
		rewritePrefix: "/game",
		websocket: true,
		// preHandler: app.authenticate,
		wsReconnect,
		http2: false, // Ensure HTTP/1.1 for WebSocket
		replyOptions: {
			rewriteRequestHeaders: (originalReq: any, headers: any) => {
				console.log('[Game Proxy] WebSocket upgrade request:', originalReq.url);
				return headers;
			},
		},
		wsClientOptions: {
			rejectUnauthorized: false,
		},
	});
};

export default gameProxy;
