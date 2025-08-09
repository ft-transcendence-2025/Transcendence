import { FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";
import { authService } from "../services/auth.service";
import proxy from "@fastify/http-proxy";

const authRoutes: FastifyPluginAsync = async (app: any) => {
  app.post("/api/auth/login", {}, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const response = await authService.login(req.body);
      const user = response.data?.user;
      const token = await reply.jwtSign(
        { id: user.id, email: user?.email, username: user.username },
        { expiresIn: "10m" }
      );
      reply.send({ token });
    } catch (error: any) {
      reply
        .status(error.response?.status || 500)
        .send(
          error.response?.data || { message: "Internal server error", error }
        );
    }
  });

  app.post(
    "/api/auth/register",
    {},
    async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        const response = await authService.register(req.body);
        const user = response.data?.user;
        const token = await reply.jwtSign(
          { id: user.id, email: user?.email, username: user.username },
          { expiresIn: "10m" }
        );
        reply.send({ token });
      } catch (error: any) {
        reply
          .status(error.response?.status || 500)
          .send(error.response?.data || { message: "Internal server error" });
      }
    }
  );

  const upstream =
    process.env.NODE_ENV === "production"
      ? process.env.PROD_AUTH_URL
      : process.env.DEV_AUTH_URL;


  app.register(proxy, {
    upstream,
    prefix: "/api/auth/:username",
    rewritePrefix: "/auth/:username",
    // preHandler: [app.authenticate], 
  });
};

export default authRoutes;
