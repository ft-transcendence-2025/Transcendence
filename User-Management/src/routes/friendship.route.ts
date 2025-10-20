import { FastifyInstance } from "fastify";
import * as friendshipController from "../controllers/friendship.controller";

export default async function friendshipRoutes(app: FastifyInstance) {
  app.post("/", friendshipController.sendFriendRequest);
  app.get("/requests/:username", friendshipController.getFriendRequests);
  app.get("/status/:requester/:addressee", friendshipController.getFriendshipStatus);
  app.get("/blockedUsersList/:username", friendshipController.getBlockedUsers);
  app.patch("/block/:friendId", friendshipController.blockUser);
  app.patch("/unblock/:friendId", friendshipController.unblockUser);
  app.patch(
    "/respond/:friendshipId",
    friendshipController.respondToFriendRequest
  );
  app.get("/list/:username", friendshipController.listFriends);
  app.delete("/", friendshipController.removeFriend);
}
