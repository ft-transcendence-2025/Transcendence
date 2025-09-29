import WebSocket, { WebSocketServer } from "ws"

export interface Upgrade {
  [path: string]: (req: any, socket: any, head: any, wss: WebSocketServer) => void;
}

export function upgradeRemoteGame(req: any, socket: any, head: any, wss: WebSocketServer) {
  const mode = "remote";
  const pathname = req.url?.split("?")[0] || "";
  const gameId: number = parseInt(pathname.split('/')[3]);
  const playerName: string = pathname.split('/')[4];

  if (isNaN(gameId)) {
    return ;
  }

  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit('connection', ws, req, {
      gameId,
      mode,
      playerName
    });
  });
}

export function upgradeLocalGame(req: any, socket: any, head: any, wss: WebSocketServer) {
  const mode = "local";
  const pathname = req.url?.split("?")[0] || "";
  const gameId: number = parseInt(pathname.split('/')[3]);

  if (isNaN(gameId)) {
    return ;
  }

  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit('connection', ws, req, {
      gameId,
      mode,
    });
  });
}

export function upgradeLocalTournament(req: any, socket: any, head: any, wss: WebSocketServer) {
  const mode = "localtournament";
  const pathname = req.url?.split("?")[0] || "";
  const gameId: number = parseInt(pathname.split('/')[3]);

  if (isNaN(gameId)) {
    return ;
  }

  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit('connection', ws, req, {
      gameId,
      mode,
    });
  });
}

export function upgradeRemoteTournament(req: any, socket: any, head: any, wss: WebSocketServer) {
  const mode = "remotetournament";
  const pathname = req.url?.split("?")[0] || "";
  const gameId: number = parseInt(pathname.split('/')[3]);
  const playerName: string = pathname.split('/')[4];

  console.log("Upgrading Remote Tournament")
  if (isNaN(gameId)) {
    return ;
  }

  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit('connection', ws, req, {
      gameId,
      mode,
      playerName
    });
  });
}
