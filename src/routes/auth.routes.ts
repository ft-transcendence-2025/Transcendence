import { FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";
import { authService } from "../services/auth.service";
import proxy from "@fastify/http-proxy";

const authRoutes: FastifyPluginAsync = async (app: any) => {
  app.post(
    "/api/auth/login",
    {},
    async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        const response = await authService.login(req.body);
        const user = response.data?.user;
        // @ts-ignore
        const token = await reply.accessTokenJwtSign(
          { id: user.id, email: user?.email, username: user.username },
          { expiresIn: "10m" }
        );
        // @ts-ignore
        const refreshToken = await reply.refreshTokenJwtSign(
          { id: user.id, email: user?.email, username: user.username },
          { expiresIn: "30d" }
        );
        reply
          .setCookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: true,
          })
          .code(200)
          .send({ token });
      } catch (error: any) {
        reply
          .status(error.response?.status || 500)
          .send(
            error.response?.data || { message: "Internal server error", error }
          );
      }
    }
  );

  app.post(
    "/api/auth/refresh",
    { preHandler: [app.authenticateRefresh] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      // @ts-ignore
      const user = await req.refreshTokenJwtDecode({ onlyCookie: true });
      console.log("este e o user: ", user);
      // @ts-ignore
      const token = await reply.accessTokenJwtSign(
        { id: user.id, email: user?.email, username: user.username },
        { expiresIn: "10m" }
      );
      reply.code(200).send({ token });
    }
  );

  app.post(
    "/api/auth/register",
    {},
    async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        const response = await authService.register(req.body);
        const user = response.data?.user;
        // @ts-ignore
        const token = await reply.accessTokenJwtSign(
          { id: user.id, email: user?.email, username: user.username },
          { expiresIn: "10m" }
        );
        // @ts-ignore
        const refreshToken = await reply.refreshTokenJwtSign(
          { id: user.id, email: user?.email, username: user.username },
          { expiresIn: "30d" }
        );
        reply
          .setCookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: true,
          })
          .code(201)
          .send({ token });
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
