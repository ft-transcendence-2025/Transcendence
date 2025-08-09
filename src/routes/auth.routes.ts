import { FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";
import * as policy from "../policies/user.policy";
import { authService } from "../services/User-Management/auth.service";

const authRoutes: FastifyPluginAsync = async (app: any) => {
  app.post("/login", {}, async (req: FastifyRequest, reply: FastifyReply) => {
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
    "/register",
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

  app.post(
    "/:username/2fa/generate",
    {
      preHandler: [app.authenticate],
    },
    async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        const { username } = req.params as { username: string };
        const response = await authService.generate2FA(username, req.body);
        reply.send(response.data);
      } catch (error: any) {
        reply
          .status(error.response?.status || 500)
          .send(error.response?.data || { message: "Internal server error" });
      }
    }
  );

  app.post(
    "/:username/2fa/enable",
    {
      preHandler: [app.authenticate],
    },
    async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        const { username } = req.params as { username: string };
        const response = await authService.enable2FA(username, req.body);
        reply.send(response.data);
      } catch (error: any) {
        reply
          .status(error.response?.status || 500)
          .send(error.response?.data || { message: "Internal server error" });
      }
    }
  );

  app.post(
    "/:username/2fa/disable",
    {
      preHandler: [app.authenticate],
    },
    async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        const { username } = req.params as { username: string };
        const response = await authService.disable2FA(username, req.body);
        reply.send(response.data);
      } catch (error: any) {
        reply
          .status(error.response?.status || 500)
          .send(error.response?.data || { message: "Internal server error" });
      }
    }
  );
};

export default authRoutes;
