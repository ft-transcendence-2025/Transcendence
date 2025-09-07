import { FastifyReply, FastifyRequest } from "fastify";
import prisma from "../lib/prisma";

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
