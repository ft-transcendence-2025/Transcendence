import { FastifyPluginAsync } from "fastify";
import proxy from "@fastify/http-proxy";
import { usersPreHandler } from "../middlewares/user-prehandler";

const userProxy: FastifyPluginAsync = async (app: any) => {
  const upstream =
    process.env.NODE_ENV === "production"
      ? process.env.PROD_USER_URL
      : process.env.DEV_USER_URL;

  app.register(proxy, {
    upstream,
    prefix: "/api/users",
    rewritePrefix: "/users",
    preHandler: usersPreHandler(app),
  });
};

export default userProxy;
