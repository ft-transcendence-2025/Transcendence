
import { handlePrivateMessage, sendPendingMessages } from '../services/privatechat.service';
import { handleLobbyMessage, joinLobby, leaveLobby } from '../services/lobby.service';

type WS = any;

const users = new Map<string, any>();

export async function chatHandler(socket: WS, request: any) {
  const userId = request.query.userId;
  const blockedUsersList: string[] = await fetch(`http://user-management:3000/friendships/blockedUsersList/${userId}`)
    .then(res => res.json());
  const conn = { socket, userId, games: new Set<string>(), lastPong: Date.now(), blockedUsersList };
  users.set(userId, conn);
  console.log("lista de usuários bloqueados para ", userId, " : ", blockedUsersList);
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
