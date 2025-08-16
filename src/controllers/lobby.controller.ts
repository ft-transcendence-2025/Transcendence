
	const gameIdConnection = new Map<string, any>(); // Map to store gameId and WebSocket connection

	const broadcastMessages = (message: any, gameId: string, userId: string) => {
		const connections = gameIdConnection.get(gameId);
		console.log(`Broadcasting message in game ${gameId} from user ${userId}: ${message.toString()}`);
		if (connections) {
			for (const { connection, userId: connUserId } of connections) {
				// if (connUserId !== userId) {
					connection.send(`${userId}: ${message.toString()}`);
				// }
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
		const connections = gameIdConnection.get(gameId) || [];
		const index = connections.findIndex((conn: any) => conn.connection === connection);
		if (index !== -1) {
			connections.splice(index, 1); // Remove only the disconnected user
			gameIdConnection.set(gameId, connections); // Update the map
		}
	});
	};
