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
  // sendPendingMessages(userId, connection);

  connection.on("message", async (message: any) => {
    try {
      const { recipientId, content, type } = JSON.parse(message.toString());
      if (!recipientId || !content) {
        console.error(`Invalid message format: ${message.toString()}`);
        return;
      }

      // Find or create the conversation between userId and recipientId
      let conversation = await prisma.conversation.findFirst({
        where: {
          OR: [
            { user1Id: userId, user2Id: recipientId },
            { user1Id: recipientId, user2Id: userId },
          ],
        },
      });

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            user1Id: userId,
            user2Id: recipientId,
          },
        });
        console.log(
          `Created new conversation between ${userId} and ${recipientId}`
        );
      }

      // Save the message
      const savedMessage = await prisma.message.create({
        data: {
          senderId: userId,
          conversationId: conversation.id,
          content,
          type,
          delivered: false,
        },
      });

      console.log(
        `Message from ${userId} to ${recipientId} in conversation ${conversation.id}: ${content}`
      );

      const recipientConnection = connectedUsers.get(recipientId);
      if (recipientConnection) {
        recipientConnection.send(
          JSON.stringify({
            senderId: userId,
            content,
            type,
            timestamp: savedMessage.createdAt,
          })
        );

        await prisma.message.update({
          where: { id: savedMessage.id },
          data: { delivered: true },
        });
      }
    } catch (error) {
      console.error(`Error handling message for user ${userId}:`, error);
      connection.close();
    }
  });

  connection.on("close", () => {
    console.log(`Error in message format: User ${userId} disconnected`);
    connectedUsers.delete(userId);
  });
};

// Function to send pending messages to a user
const sendPendingMessages = async (userId: string, connection: any) => {
  const pendingMessages = await prisma.message.findMany({
    where: {
      conversation: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
      delivered: false,
    },
  });

  for (const message of pendingMessages) {
    connection.send(
      JSON.stringify({
        senderId: message.senderId,
        content: message.content,
        type: message.type,
        timestamp: message.createdAt,
      })
    );

    // Mark the message as delivered
    await prisma.message.update({
      where: { id: message.id },
      data: { delivered: true },
    });
  }
};
