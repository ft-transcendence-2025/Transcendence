import { FastifyInstance, FastifyPluginAsync } from "fastify";
import proxy from "@fastify/http-proxy";

const chatProxy: FastifyPluginAsync = async (app: FastifyInstance) => {
  const upstream =
    process.env.NODE_ENV === "production"
      ? process.env.PROD_CHAT_URL || "ws://chat-service:3000"
      : process.env.DEV_CHAT_URL || "ws://localhost:3000";

  // HTTP REQUESTS
  app.register(proxy, {
    upstream: upstream.replace("ws://", "http://"),
    prefix: "/api/chat",
    rewritePrefix: "/",
  });

  // SOCKET CONNECTIONS
  app.register(proxy, {
    upstream: upstream,
    wsUpstream: upstream,
    prefix: "/ws/chat",
    rewritePrefix: "/ws",
    websocket: true,
  });
};

export default chatProxy;
