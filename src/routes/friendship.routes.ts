import { FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";
import * as policy from "../policies/user-policy";
import { friendshipService } from "../services/User-Management/friendship.service";

const profileRoutes: FastifyPluginAsync = async (app: any) => {
  app.post(
    "/",
    {
      preHandler: [app.authenticate /* , app.authorize(policy.canViewUser) */],
    },
    async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        // const { username } = req.params as { username: string };
        const response = await friendshipService.sendFriendRequest(req.body);
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
    "/requests/:username",
    {
      preHandler: [app.authenticate /* , app.authorize(policy.canViewUser) */],
    },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { username } = req.params as { username: string };
      const response = await friendshipService.getFriendRequests(username);
      reply.send(response.data);
    }
  );

  app.get(
    "/list/:username",
    {
      preHandler: [app.authenticate /* , app.authorize(policy.canViewUser) */],
    },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { username } = req.params as { username: string };
      const response = await friendshipService.listFriends(username);
      reply.send(response.data);
    }
  );

  app.patch(
    "/respond/:friendshipId",
    {
      preHandler: [app.authenticate /* , app.authorize(policy.canViewUser) */],
    },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { friendshipId } = req.params as { friendshipId: string };
      const response = await friendshipService.respondToFriendRequest(
        friendshipId,
        req.body
      );
      reply.send(response.data);
    }
  );

  app.delete(
    "/",
    {
      preHandler: [app.authenticate /* , app.authorize(policy.canViewUser) */],
    },
    async (req: FastifyRequest, reply: FastifyReply) => {
      // const { username } = req.params as { username: string };
      const response = await friendshipService.removeFriend(req.body);
      reply.send(response.data);
    }
  );
};

export default profileRoutes;
