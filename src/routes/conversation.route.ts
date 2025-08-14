import { FastifyInstance } from "fastify";
import * as conversationController from "../controllers/conversation.controller";

export default async function conversationRoutes(fastify: FastifyInstance) {
  fastify.post("/", conversationController.createConversation);
  fastify.get("/:user1Id/:user2Id", conversationController.getConversation);
//   fastify.get("/", conversationController.listConversations);
}
