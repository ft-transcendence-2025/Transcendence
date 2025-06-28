import { FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";
import * as policy from "../policies/user-policy";
import { userService } from "../services/User-Management/user.service";

const userRoutes: FastifyPluginAsync = async (app: any) => {
  // const userService =
  app.get(
    "/",
    {
      preHandler: [app.authenticate /* , app.authorize(policy.canListUsers) */],
    },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const response = await userService.getUsers();
      reply.send(response.data);
    }
  );

  app.get(
    "/:username",
    {
      preHandler: [app.authenticate, app.authorize(policy.canViewUser)],
    },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { username } = req.params as { username: string };
      const response = await userService.getUserByUsername(username);
      reply.send(response.data);
    }
  );

  app.patch(
    "/:username",
    {
      preHandler: [app.authenticate /* , app.authorize(policy.canViewUser) */],
    },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { username } = req.params as { username: string };
      const response = await userService.disableUser(username);
      reply.send(response.data);
    }
  );

  app.put(
    "/:username",
    {
      preHandler: [app.authenticate /* , app.authorize(policy.canViewUser) */],
    },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { username } = req.params as { username: string };
      const response = await userService.updateUser(username, req.body);
      reply.send(response.data);
    }
  );

  app.delete(
    "/:username",
    {
      preHandler: [app.authenticate /* , app.authorize(policy.canViewUser) */],
    },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { username } = req.params as { username: string };
      const response = await userService.deleteUser(username);
      reply.send(response.data);
    }
  );
};

export default userRoutes;
