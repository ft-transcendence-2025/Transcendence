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

    // Save the message in the database
    const savedMessage = await prisma.message.create({
      data: {
        senderId: userId,
        conversationId,
        content,
        type,
        delivered: false, // Initially marked as not delivered
      },
    });

    console.log(`Message from ${userId} in conversation ${conversationId}: ${content}`);

    // Find the other user in the conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      console.error(`Conversation ${conversationId} not found`);
      return;
    }

    const recipientId = conversation.user1Id === userId ? conversation.user2Id : conversation.user1Id;

    // Send the message to the recipient if they are connected
    const recipientConnection = connectedUsers.get(recipientId);
    if (recipientConnection) {
      recipientConnection.send(JSON.stringify({
        senderId: userId,
        content,
        type,
        timestamp: savedMessage.createdAt,
      }));

      // Mark the message as delivered
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