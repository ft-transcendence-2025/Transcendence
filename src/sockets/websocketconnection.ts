import WebSocket, { WebSocketServer } from "ws"
import {
  Upgrade, upgradeRemoteTournament, upgradeLocalTournament,
  upgradeLocalGame, upgradeRemoteGame, upgradeCustomGame
} from "./upgrade.js";
import {
  Connection, localGameConnection, remoteConnection,
  localTournamentConnection, remoteTournamentConnection, customGameConnection
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
    const gameId: number = context.gameId;
    const mode: string = context.mode;
    const playerName: string = context.playerName;
    const remoteTournamentAction: string = context.remoteTournamentAction;

    if (mode in connect)
      connect[mode](ws, {
        ws, gameId, playerName,
        remoteTournamentAction
      });
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
