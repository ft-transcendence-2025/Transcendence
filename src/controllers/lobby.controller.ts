import prisma from "../lib/prisma";

const gameIdConnection = new Map<string, any>(); // Map to store gameId and WebSocket connection

const broadcastMessages = (message: any, gameId: string, userId: string) => {
	const connections = gameIdConnection.get(gameId);
	console.log(`Broadcasting message in game ${gameId} from user ${userId}: ${message.toString()}`);
	if (connections) {
		for (const { connection, userId: connUserId } of connections) {
			if (connUserId !== userId) {
				connection.send(`${userId}: ${message.toString()}`);
			}
		}
	}
};

export const LobbyHandler = (connection: any, request: any) => {
  const gameId = request.query.gameId as string; // Assume gameId is passed as a query parameter
  const userId = request.query.userId as string; // Assume userId is passed as a query parameter
  if (!gameId) {
    connection.close();
    return;
  }

  console.log(`User ${userId} connected in ${gameId}`);

  const connections = gameIdConnection.get(gameId) || [];
  connections.push({ connection, userId });
  gameIdConnection.set(gameId, connections);

  connection.on('message', async (message: any) => {
    broadcastMessages(message, gameId, userId);
  });


  connection.on('close', () => {
    console.log(`User ${userId} disconnected`);
    gameIdConnection.delete(gameId);
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