
import { handleBlockUser, handleNotification, handlePrivateMessage, sendPendingMessages } from '../services/privatechat.service';
import { handleLobbyMessage, joinLobby, leaveLobby } from '../services/lobby.service';
import { handleUserStatus, USER_STATUS } from '../lib/userPresenceHandler';
import prisma from '../lib/prisma';

type WS = any;

const users = new Map<string, any>();

export async function chatHandler(socket: WS, request: any) {
  const userId = request.query.userId;
  const blockedUsersList: string[] = await fetch(`http://user-management:3000/friendships/blockedUsersList/${userId}`)
    .then(res => {
      if (!res.ok) {
        console.error(`Failed to fetch blocked users for userId ${userId}: ${res.statusText}`);
        return [];
      }
      return res.json();
    })
    .catch(err => {
      console.error(`Error fetching blocked users for userId ${userId}:`, err);
      return [];
    });

  if (!users.has(userId)) {
    users.set(userId, {
      connections: new Set<WS>(),
      games: new Set<string>(),
      lastPong: Date.now(),
      blockedUsersList,
    });
  }

  const userConn = users.get(userId);
  userConn.connections.add(socket); // Add the new WebSocket connection
  console.log("logged in users: ", Array.from(users.keys()));

  handleUserStatus(userId, USER_STATUS.ONLINE);

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
    console.warn(`fui chamado por ${userId} `, msg);

    switch (msg.kind) {
      case 'private/send':
        await handlePrivateMessage(users, userId, msg, socket);
        break;

      // case 'lobby/join':
      //   joinLobby(users, conn, msg);
      //   break;

      // case 'lobby/leave':
      //   leaveLobby(users, conn, msg);
      //   break;

      case 'lobby/send':
        handleLobbyMessage(users, userId, msg);
        break;

      case 'user/block':
        handleBlockUser(users, userId, msg);
        break;

      case 'notification/new':
        handleNotification(users, userId, msg, socket);
        break;

      default:
        socket.send(JSON.stringify({ event: 'system/error', message: 'unknown kind' }));
    }
  });

    socket.on('close', () => {
    // Remove the WebSocket connection from the user's set
    userConn.connections.delete(socket);

    // If no connections remain, remove the user from the map and mark them offline
    if (userConn.connections.size === 0) {
      users.delete(userId);
      handleUserStatus(userId, USER_STATUS.OFFLINE);
    }
  });

  socket.on('error', (err: any) => {
    console.error(`WebSocket error for user ${userId}:`, err);
    userConn.connections.delete(socket);

    if (userConn.connections.size === 0) {
      users.delete(userId);
      handleUserStatus(userId, USER_STATUS.OFFLINE);
    }
  });
}
