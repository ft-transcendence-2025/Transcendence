
import { handlePrivateMessage, sendPendingMessages } from '../services/privatechat.service';
import { handleLobbyMessage, joinLobby, leaveLobby } from '../services/lobby.service';

type WS = any;

const users = new Map<string, any>();

export function chatHandler(socket: WS, request: any) {
  const userId = request.query.userId;
  const conn = { socket, userId, games: new Set<string>(), lastPong: Date.now() };
  users.set(userId, conn);

  // Send ready + pending messages
  socket.send(JSON.stringify({ event: 'system/ready', userId, ts: Date.now() }));
  sendPendingMessages(userId, socket);

  socket.on('message', async (raw: Buffer) => {
    let msg: any;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      socket.send(JSON.stringify({ event: 'system/error', message: 'invalid JSON' }));
      return;
    }
    
    switch (msg.kind) {
      case 'private/send':
        await handlePrivateMessage(users, userId, msg);
        break;

      case 'lobby/join':
        joinLobby(users, conn, msg);
        break;

      case 'lobby/leave':
        leaveLobby(users, conn, msg);
        break;

      case 'lobby/send':
        handleLobbyMessage(users, userId, msg);
        break;

      default:
        socket.send(JSON.stringify({ event: 'system/error', message: 'unknown kind' }));
    }
  });

  socket.on('close', () => {
    users.delete(userId);
  });
}
// import prisma from "../lib/prisma";



// const gameIdConnection = new Map<string, any>(); // Map to store gameId and WebSocket connection
// const connectedUsers = new Map<string, any>(); // Map to store userId and WebSocket connection



// const broadcastMessages = (message: any, gameId: string, userId: string) => {
// 	const connections = gameIdConnection.get(gameId);
// 	console.log(
// 		`Broadcasting message in game ${gameId} from user ${userId}: ${message.toString()}`
// 	);
// 	if (connections) {
// 		for (const { connection, userId: connUserId } of connections) {
// 			// if (connUserId !== userId) {
// 				connection.send(`${userId}: ${message.toString()}`);
// 				// }
// 			}
// 		}
// 	};

// async function handleLobby(
//   connection: any,
//   message: any,
//   gameId: any,
//   userId: any
// ) {
// const connections = gameIdConnection.get(gameId) || [];
// if (!connections.some((conn: any) => conn.userId === userId)) {
// 	connections.push({ connection, userId });
// 	gameIdConnection.set(gameId, connections);
// }
//   broadcastMessages(message, gameId, userId);
// }

// export const chatHandler = (connection: any, request: any) => {
//   const userId = request.query.userId as string; // Assume userId is passed as a query parameter
//   if (!userId) {
//     connection.close();
//     return;
//   }

//   connectedUsers.set(userId, connection);
// //   sendPendingMessages(userId, connection);

//   connection.on("message", async (message: any) => {
//     const { recipientId, content, type, gameId, channel } = JSON.parse(
//       message.toString()
//     );
//     if (gameId && channel == "lobby") {
//       handleLobby(connection, content, gameId, userId);
//     } else {
//       if (!recipientId || !content) {
//         console.error(`Invalid message format: ${message.toString()}`);
//         return;
//       }

//       // Find or create the conversation between userId and recipientId
//       let conversation = await prisma.conversation.findFirst({
//         where: {
//           OR: [
//             { user1Id: userId, user2Id: recipientId },
//             { user1Id: recipientId, user2Id: userId },
//           ],
//         },
//       });

//       if (!conversation) {
//         conversation = await prisma.conversation.create({
//           data: {
//             user1Id: userId,
//             user2Id: recipientId,
//           },
//         });
//         console.log(
//           `Created new conversation between ${userId} and ${recipientId}`
//         );
//       }

//       // Save the message
//       const savedMessage = await prisma.message.create({
//         data: {
//           senderId: userId,
//           conversationId: conversation.id,
//           content,
//           type,
//           delivered: false,
//         },
//       });

//       console.log(
//         `Message from ${userId} to ${recipientId} in conversation ${conversation.id}: ${content}`
//       );

//       const recipientConnection = connectedUsers.get(recipientId);
//       if (recipientConnection) {
//         recipientConnection.send(
//           JSON.stringify({
//             senderId: userId,
//             content,
//             type,
//             timestamp: savedMessage.createdAt,
//           })
//         );

//         await prisma.message.update({
//           where: { id: savedMessage.id },
//           data: { delivered: true },
//         });
//       }
//     }
//   });

//   connection.on("close", () => {
//     console.log(`User ${userId} disconnected`);
// 	for (const [gameId, connections] of gameIdConnection.entries()) {
// 		const index = connections.findIndex((conn: any) => conn.userId === userId);
// 		if (index !== -1) {
// 			connections.splice(index, 1);

// 			// Notify remaining users in the lobby that the user left
// 			for (const { connection: conn, userId: connUserId } of connections) {
// 				conn.send(JSON.stringify({
// 					type: "user_left",
// 					userId,
// 					gameId,
// 					message: `User ${userId} has left the lobby.`,
// 				}));
// 			}

// 			if (connections.length === 0) {
// 				gameIdConnection.delete(gameId);
// 			} else {
// 				gameIdConnection.set(gameId, connections);
// 			}
// 		}
// 	}
//     connectedUsers.delete(userId);
//   });
// };



// // Function to send pending messages to a user
// const sendPendingMessages = async (userId: string, connection: any) => {
//   const pendingMessages = await prisma.message.findMany({
//     where: {
//       conversation: {
//         OR: [{ user1Id: userId }, { user2Id: userId }],
//       },
//       delivered: false,
//     },
//   });

//   for (const message of pendingMessages) {
//     connection.send(
//       JSON.stringify({
//         senderId: message.senderId,
//         content: message.content,
//         type: message.type,
//         timestamp: message.createdAt,
//       })
//     );

//     // Mark the message as delivered
//     await prisma.message.update({
//       where: { id: message.id },
//       data: { delivered: true },
//     });
//   }
// };
