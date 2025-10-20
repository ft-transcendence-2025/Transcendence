import { FastifyInstance } from "fastify";
import * as profileController from "../controllers/profile.controller";

export default async function profileRoutes(app: FastifyInstance) {
  app.post("/:username", profileController.createProfile);
  app.post("/:username/avatar", profileController.uploadAvatar);
  app.get("/:username/avatar", profileController.getAvatar);
  app.get("/:username", profileController.getProfileByUsername);
  app.put("/:username", profileController.updateProfile);
  app.delete("/:username", profileController.deleteProfile);
}
