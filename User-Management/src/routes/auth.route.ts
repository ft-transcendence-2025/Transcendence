import { FastifyInstance } from "fastify";
import * as userController from "../controllers/user.controller";

export default async function userRoutes(fastify: FastifyInstance) {
  fastify.post("/login", userController.login);
  fastify.post("/register", userController.createUser);
  fastify.post("/:username/2fa/generate", userController.generate2FAQr);
  fastify.post("/:username/2fa/enable", userController.enable2FA);
  fastify.post("/:username/2fa/disable", userController.disable2FA);
}
