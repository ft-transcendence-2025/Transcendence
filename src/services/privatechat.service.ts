import prisma from '../lib/prisma';

export async function sendPendingMessages(userId: string, socket: any) {
  const pending = await prisma.message.findMany({
    where: {
      conversation: { OR: [{ user1Id: userId }, { user2Id: userId }] },
      delivered: false,
    },
  });

  for (const msg of pending) {
    socket.send(JSON.stringify({ event: 'private/message', ...msg }));
    await prisma.message.update({ where: { id: msg.id }, data: { delivered: true } });
  }
}

export async function handlePrivateMessage(users: Map<string, any>, senderId: string, msg: any) {
  const { recipientId, content, type = 'TEXT' } = msg;
  if (!recipientId || !content) return;

  let conversation = await prisma.conversation.findFirst({
    where: {
      OR: [{ user1Id: senderId, user2Id: recipientId }, { user1Id: recipientId, user2Id: senderId }],
    },
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({ data: { user1Id: senderId, user2Id: recipientId } });
  }

  const saved = await prisma.message.create({
    data: { senderId, conversationId: conversation.id, content, type, delivered: false },
  });

  // const senderConn = users.get(senderId);
  // if (senderConn) senderConn.socket.send(JSON.stringify({ event: 'private/message', echo: true, ...saved }));

  const recipientConn = users.get(recipientId);
  if (recipientConn) {
	await prisma.message.update({ where: { id: saved.id }, data: { delivered: true } });
    recipientConn.socket.send(JSON.stringify({ event: 'private/message', ...saved }));
  }
}
