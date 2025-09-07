import { FastifyInstance, FastifyPluginAsync } from "fastify";
import proxy from "@fastify/http-proxy";
import auth from "../plugins/auth";

const gameProxy: FastifyPluginAsync = async (app: any) => {
	const upstream = "ws://pong:4000"

	// HTTP REQUESTS
	app.register(proxy, {
		upstream: upstream.replace("ws://", "http://"),
		prefix: "/api/getgame",
		rewritePrefix: "/getgame",
		preHandler: app.authenticate,
	});
	// HTTP REQUESTS
	app.register(proxy, {
		upstream: upstream.replace("ws://", "http://"),
		prefix: "/api/tournament",
		rewritePrefix: "/tournament",
		preHandler: app.authenticate,
	});

	// const wsReconnect = {
	// 	logs: true,
	// 	pingInterval: 100,
	// 	reconnectOnClose: true,
	// }

	// SOCKET CONNECTIONS
	app.register(proxy, {
		upstream: upstream,
		wsUpstream: upstream,
		prefix: "/ws/game",
		rewritePrefix: "/game",
		websocket: true,
		preHandler: app.authenticate,
	});
};

export default gameProxy;
