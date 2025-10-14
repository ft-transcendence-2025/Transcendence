import WebSocket, { WebSocketServer } from "ws"
import {
  Upgrade, upgradeLocalTournament,
  upgradeLocalGame, upgradeRemoteGame, upgradeCustomGame, upgradeRemoteTournament
} from "./upgrade.js";
import {
  Connection, localGameConnection, remoteConnection,
  localTournamentConnection, customGameConnection, remoteTournamentConnection
} from "./connection.js";


export function webSocketConnection(server: any) {
  const wss = new WebSocketServer({ noServer: true });
  upgrade(server, wss);
  connection(wss);
}

function connection(wss: WebSocketServer): void {
  const connect: Connection = {
    custom: customGameConnection,
    local: localGameConnection,
    remote: remoteConnection,
    localtournament: localTournamentConnection,
    remotetournament: remoteTournamentConnection,
  }

  wss.on("connection", (ws: WebSocket, request: any, context: any) => {
    const mode: string = context.mode;

    if (mode in connect) {
      // Pass the entire context to the connection handler
      // Different modes need different context properties:
      // - remote/local/custom: gameId, playerName
      // - remotetournament: tournamentId, username, action
      connect[mode](ws, context);
    }
  });

  wss.on("error", (e) => {
    console.log(e);
  });
}


function upgrade(server: any, wss: WebSocketServer): void {
  const upgradePath: Upgrade = {
    "/game/custom": upgradeCustomGame,
    "/game/local": upgradeLocalGame,
    "/game/remote": upgradeRemoteGame,
    "/game/localtournament": upgradeLocalTournament,
    "/game/remotetournament": upgradeRemoteTournament,
  }

  server.on("upgrade", (request: any, socket: any, head: any) => {
    const parts = request.url?.split("?")[0].split("/") || "";
    const pathname = "/" + parts[1] + "/" + parts[2];
    if (pathname in upgradePath)
      upgradePath[pathname](request, socket, head, wss);
  })
}
