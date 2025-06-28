import { FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";
import * as policy from "../policies/user-policy";
import { profileService } from "../services/User-Management/profile.service";

const profileRoutes: FastifyPluginAsync = async (app: any) => {
  app.post(
    "/:username",
    { preHandler: [app.authenticate, app.authorize(policy.canViewUser)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        const { username } = req.params as { username: string };
        const response = await profileService.createProfile(username, req.body);
        reply.send(response.data);
      } catch (error: any) {
        reply
          .status(error.response?.status || 500)
          .send(
            error.response?.data || { message: "Internal server error", error }
          );
      }
    }
  );

  app.get(
    "/:username",
    {
      preHandler: [app.authenticate, app.authorize(policy.canViewUser)],
    },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { username } = req.params as { username: string };
      const response = await profileService.getProfileByUsername(username);
      reply.send(response.data);
    }
  );

  app.put(
    "/:username",
    {
      preHandler: [app.authenticate, app.authorize(policy.canViewUser)],
    },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { username } = req.params as { username: string };
      const response = await profileService.updateProfile(username, req.body);
      reply.send(response.data);
    }
  );

  app.delete(
    "/:username",
    {
      preHandler: [app.authenticate, app.authorize(policy.canViewUser)],
    },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { username } = req.params as { username: string };
      const response = await profileService.deleteProfile(username);
      reply.send(response.data);
    }
  );
};

export default profileRoutes;
