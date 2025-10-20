import { FastifyInstance } from "fastify";
import * as userController from "../controllers/user.controller";

export default async function userRoutes(fastify: FastifyInstance) {
  fastify.get("/", userController.getAll);
  fastify.get("/:username", userController.getByUsername);
  fastify.put("/:username", userController.updateUser);
  fastify.patch("/:username", userController.disableUser);
  fastify.delete("/:username", userController.deleteUser);
}
