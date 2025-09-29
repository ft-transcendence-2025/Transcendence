import WebSocket, { WebSocketServer } from "ws"
import {
  Upgrade, upgradeRemoteTournament, upgradeLocalTournament,
  upgradeLocalGame, upgradeRemoteGame 
} from "./upgrade.js";
import {
  Connection, localGameConnection, remoteConnection,
  localTournamentConnection, remoteTournamentConnection 
} from "./connection.js";


export function webSocketConnection(server: any) {
  const wss = new WebSocketServer({ noServer: true });
  upgrade(server, wss);
  connection(wss);
}

function connection(wss: WebSocketServer): void {
  const connect: Connection = {
    local: localGameConnection,
    remote: remoteConnection,
    localtournament: localTournamentConnection,
    remotetournament: remoteTournamentConnection,
  }

  wss.on("connection", (ws: WebSocket, request: any, context: any) => {
    const gameId: number = context.gameId;
    const mode: string = context.mode;
    const playerName: string = context.playerName;

    if (mode in connect)
      connect[mode](ws, {ws, gameId, playerName});
  });

  wss.on("error", (e) => {
    console.log(e);
  });
}


function upgrade(server: any, wss: WebSocketServer): void {
  const upgradePath: Upgrade = {
    "/game/local": upgradeLocalGame,
    "/game/remote": upgradeRemoteGame,
    "/game/localtournament": upgradeLocalTournament,
    "/game/remotetournament": upgradeRemoteTournament,
  }

  server.on("upgrade", (request: any, socket: any, head: any) => {
    const parts = request.url?.split("?")[0].split("/") || "";
    const pathname = "/" + parts[1] + "/" + parts[2];
    console.log("PathName:", pathname);
    if (pathname in upgradePath)
      upgradePath[pathname](request, socket, head, wss);
  })
}
