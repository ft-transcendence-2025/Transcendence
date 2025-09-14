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
  const sender = users.get(senderId);

  console.log("Blocked users:", sender.blockedUsersList);
  if (sender.blockedUsersList.includes(recipientId)) {
    sender.socket.send("Message not delivered.");
    return;
  }

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



  // Send the message and notification in real-time if the recipient is online
  const recipientConn = users.get(recipientId);
  if (recipientConn) {
    await prisma.message.update({ where: { id: saved.id }, data: { delivered: true } });
    recipientConn.socket.send(JSON.stringify({ event: 'private/message', ...saved }));
  }
}


export async function handleBlockUser(users: Map<string, any>, userId: string, msg: any) {
  const { recipientId } = msg;

  const user = users.get(userId);
  if (!user) return;

  console.log(`User ${userId} is blocking ${recipientId}`);
  if (!user.blockedUsersList.includes(recipientId)) {
    user.blockedUsersList.push(recipientId);
    const targetUser = users.get(recipientId);
    if (targetUser && !targetUser.blockedUsersList.includes(userId)) {
      targetUser.blockedUsersList.push(userId);
    }
  } else {
    user.blockedUsersList = user.blockedUsersList.filter((id: string) => id !== recipientId);
    const targetUser = users.get(recipientId);
    if (targetUser) {
      targetUser.blockedUsersList = targetUser.blockedUsersList.filter((id: string) => id !== userId);
    }
  }
}

export async function markMessagesAsRead(userId: string, conversationId: string): Promise<void> {
  try {
    await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: userId,
        read: false,
      },
      data: {
        read: true,
      },
    });
  } catch (error) {
    console.error(`Failed to mark messages as read for user ${userId} in conversation ${conversationId}:`, error);
    throw new Error("Failed to mark messages as read.");
  }
}

export async function handleNotification(users: Map<string, any>, userId: string, msg: any) {
  const { recipientId, type, content } = msg;
  if (!recipientId || !content || !type) return;
  
  const sender = users.get(userId);
  if (sender.blockedUsersList.includes(recipientId) && type !== "FRIEND_UNBLOCKED") {
    sender.socket.send("Notification not delivered.");
    return;
  }

  if (users.has(recipientId)) {
    const recipientConn = users.get(recipientId);
    recipientConn.socket.send(JSON.stringify({ event: 'notification/new', ...msg }));
  }
}