import prisma from "../lib/prisma";

const connectedUsers = new Map<string, any>(); // Map to store userId and WebSocket connection

export const PrivateChatHandler = (connection: any, request: any) => {
  const userId = request.query.userId as string; // Assume userId is passed as a query parameter
  if (!userId) {
    connection.close();
    return;
  }

  console.log(`User ${userId} connected`);
  connectedUsers.set(userId, connection);

  // Send pending messages to the user
  sendPendingMessages(userId, connection);

  connection.on('message', async (message: any) => {
    const { conversationId, content, type } = JSON.parse(message.toString());
    if (!conversationId || !content || !type) {
      console.error(`Invalid message format: ${message.toString()}`);
      return;
    }

    // Find the conversation first
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      console.error(`Conversation ${conversationId} not found`);
      return;
    }

    // Validate user participation
    if (conversation.user1Id !== userId && conversation.user2Id !== userId) {
      console.error(`User ${userId} is not a participant in conversation ${conversationId}`);
      return;
    }

    // Save the message only after validation
    const savedMessage = await prisma.message.create({
      data: {
        senderId: userId,
        conversationId,
        content,
        type,
        delivered: false,
      },
    });

    console.log(`Message from ${userId} in conversation ${conversationId}: ${content}`);

    const recipientId = conversation.user1Id === userId ? conversation.user2Id : conversation.user1Id;
    const recipientConnection = connectedUsers.get(recipientId);
    if (recipientConnection) {
      recipientConnection.send(JSON.stringify({
        senderId: userId,
        content,
        type,
        timestamp: savedMessage.createdAt,
      }));

      await prisma.message.update({
        where: { id: savedMessage.id },
        data: { delivered: true },
      });
    }
  });

  connection.on('close', () => {
    console.log(`User ${userId} disconnected`);
    connectedUsers.delete(userId);
  });
};



// Function to send pending messages to a user
const sendPendingMessages = async (userId: string, connection: any) => {
  const pendingMessages = await prisma.message.findMany({
    where: {
      conversation: {
        OR: [
          { user1Id: userId },
          { user2Id: userId },
        ],
      },
      delivered: false,
    },
  });

  for (const message of pendingMessages) {
    connection.send(JSON.stringify({
      senderId: message.senderId,
      content: message.content,
      type: message.type,
      timestamp: message.createdAt,
    }));

    // Mark the message as delivered
    await prisma.message.update({
      where: { id: message.id },
      data: { delivered: true },
    });
  }
};