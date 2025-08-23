
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
