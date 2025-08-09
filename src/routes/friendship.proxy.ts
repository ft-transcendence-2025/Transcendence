import { FastifyPluginAsync } from "fastify";
import proxy from "@fastify/http-proxy";
import { friendshipPreHandler } from "../middlewares/friendship-prehandler";

const friendshipProxy: FastifyPluginAsync = async (app: any) => {
  const upstream =
    process.env.NODE_ENV === "production"
      ? process.env.PROD_FRIENDSHIP_URL
      : process.env.DEV_FRIENDSHIP_URL;

  app.register(proxy, {
    upstream,
    prehandler: friendshipPreHandler(app),
    prefix: "/api/friendships",
    rewritePrefix: "/friendships",
  });
};

export default friendshipProxy;
