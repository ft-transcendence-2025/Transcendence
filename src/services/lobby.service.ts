const gameRooms = new Map<string, Set<string>>();

function broadcastToGame(users: Map<string, any>, gameId: string, payload: any, excludeUserId?: string) {
  const members = gameRooms.get(gameId);
  if (!members) return;
  for (const uid of members) {
    if (uid === excludeUserId) continue;
    const conn = users.get(uid);
    if (conn) conn.socket.send(JSON.stringify(payload));
  }
}

export function joinLobby(users: Map<string, any>, conn: any, msg: any) {
  const gameId = msg.gameId;
  if (!gameId) return;

  conn.games.add(gameId);
  let set = gameRooms.get(gameId);
  if (!set) { set = new Set(); gameRooms.set(gameId, set); }
  set.add(conn.userId);

  broadcastToGame(users, gameId, { event: 'lobby/user-joined', gameId, userId: conn.userId }, conn.userId);
  conn.socket.send(JSON.stringify({ event: 'lobby/joined', gameId, members: Array.from(set) }));
}

export function leaveLobby(users: Map<string, any>, conn: any, msg: any) {
  const gameId = msg.gameId;
  if (!gameId) return;

  conn.games.delete(gameId);
  const set = gameRooms.get(gameId);
  if (set) {
    set.delete(conn.userId);
    if (set.size === 0) gameRooms.delete(gameId);
  }
  broadcastToGame(users, gameId, { event: 'lobby/user-left', gameId, userId: conn.userId }, conn.userId);
  conn.socket.send(JSON.stringify({ event: 'lobby/left', gameId }));
}

export function handleLobbyMessage(users: Map<string, any>, userId: string, msg: any) {
  const { gameId, content } = msg;
  if (!gameId || !content) return;

  const payload = { event: 'lobby/message', gameId, senderId: userId, content, timestamp: new Date().toISOString() };
  const conn = users.get(userId);
  if (conn) conn.socket.send(JSON.stringify({ ...payload, echo: true }));
  broadcastToGame(users, gameId, payload, userId);
}
