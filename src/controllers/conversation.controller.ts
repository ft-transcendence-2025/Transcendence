import { FastifyReply, FastifyRequest } from "fastify";
import prisma from "../lib/prisma";
import { markMessagesAsRead } from "../services/privatechat.service";
import { getUnreadNotifications, markNotificationsAsRead } from "../services/notifications.service";

export const createConversation = async (req: FastifyRequest, res: FastifyReply) => {
	const { user1Id, user2Id } = req.body as {
		user1Id: string;
		user2Id: string;
	}
	const conversation = await prisma.conversation.create({
		data: {user1Id, user2Id},
		include: {messages: true}
	});
	res.code(201).send({message: "Conversation created successfully!", conversation});
}

export const getConversation = async (req: FastifyRequest, res: FastifyReply) => {
	const { user1Id, user2Id } = req.params as {
		user1Id: string;
		user2Id: string;
	}
	const conversation = await prisma.conversation.findFirst({
		where: {
			OR: [
				{ user1Id: user1Id, user2Id: user2Id },
				{ user1Id: user2Id, user2Id: user1Id },
			],
		},
		include: { messages: true}
	});
	res.code(200).send(conversation);
}

export const listConversations = async (req: FastifyRequest, res: FastifyReply) => {
	const conversations = await prisma.conversation.findMany({
		include: { messages: true }
	});
	res.code(200).send(conversations);
}

export const getUnreadMessagesCount = async (req: FastifyRequest, res: FastifyReply) => {
	const { userId } = req.params as { userId: string };

	if (!userId) {
		return res.code(400).send({ error: "Missing userId." });
	}
	try {
		const count = await prisma.message.count({
			where: { 
				read: false,
				NOT: {
					senderId: userId,
				},
				conversation: {
					OR: [
						{ user1Id: userId },
						{ user2Id: userId }
					]
				}
			},
		});
		res.code(200).send({ count });
	} catch (error) {
		console.error("Failed to fetch unread messages count:", error);
		res.code(500).send({ error: "Internal server error." });
	}
};

export async function markConversationAsRead(req: FastifyRequest, res: FastifyReply) {
	const { senderId, recipientId } = req.body as { senderId: string; recipientId: string };

	if (!senderId || !recipientId) {
		return res.code(400).send({ error: "Missing senderId or recipientId." });
	}

	const user1Id = senderId;
	const user2Id = recipientId;
	console.log(`Marking messages as read between ${user1Id} and ${user2Id}`);
	try {
		const conversation = await prisma.conversation.findFirst({
			where: {
				OR: [
					{ user1Id: user1Id, user2Id: user2Id },
					{ user1Id: user2Id, user2Id: user1Id },
				],
			},
		});
		console.log("Found conversation:", conversation);

		if (!conversation) {
			return res.code(404).send({ error: "Conversation not found." });
		}

		await markMessagesAsRead(user1Id, conversation.id);
		res.code(200).send({ message: "Messages marked as read." });
	} catch (error) {
		console.error("Failed to mark messages as read:", error);
		res.code(500).send({ error: "Internal server error." });
	}
}


export async function fetchUnreadNotifications(req: FastifyRequest, res: FastifyReply) {
  const { userId } = req.params as { userId: string };

  if (!userId) {
    return res.code(400).send({ error: "Missing userId." });
  }

  try {
    const notifications = await getUnreadNotifications(userId);
    res.code(200).send(notifications);
  } catch (error) {
    console.error("Failed to fetch unread notifications:", error);
    res.code(500).send({ error: "Internal server error." });
  }
};

export const markNotifications = async (req: FastifyRequest, res: FastifyReply) => {
  const { recipientId, type, senderId } = req.body as { recipientId: string; type: string; senderId?: string };

  if (!recipientId || !type) {
    return res.code(400).send({ error: "Missing recipientId or type." });
  }

  try {
    const count = await markNotificationsAsRead(recipientId, type, senderId);
    res.code(200).send({ message: "Notifications marked as read.", count });
  } catch (error) {
    console.error("Failed to mark notifications as read:", error);
    res.code(500).send({ error: "Internal server error." });
  }
};