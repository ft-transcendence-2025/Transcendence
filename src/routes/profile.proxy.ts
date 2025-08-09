import { FastifyPluginAsync } from "fastify";
import proxy from "@fastify/http-proxy";
import { profilePreHandler } from "../middlewares/profile-prehandler";

const profileRoutes: FastifyPluginAsync = async (app: any) => {
  const upstream =
    process.env.NODE_ENV === "production"
      ? process.env.PROD_PROFILE_URL
      : process.env.DEV_PROFILE_URL;

  app.register(proxy, {
    upstream,
    prefix: "api/profiles",
    rewritePrefix: "/profiles",
    prehandler: profilePreHandler(app),
  });
};

export default profileRoutes;
