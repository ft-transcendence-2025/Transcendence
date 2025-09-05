import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Game, GameState} from "./game/Game.js";
import { SinglePlayerGameRoom } from "./game/SinglePlayerGameRoom.js";
import { RemoteGameRoom } from "./game/RemoteGameRoom.js";
import { tournaments, remoteGameRooms, singlePlayerGameRooms, singlePlayerLastActivity } from "./server.js";
import { Tournament, Players, Winner, TournamentId } from "./tournament.js";

let singlePlayerGameId: number = 0;
let remoteGameId: number = 0;
let tournamentId: number = 0;

export async function tournament(fastify: FastifyInstance) {
  fastify.post("/create", {
    schema: {
      body: {
        type: "object",
        required: ["player1", "player2", "player3", "player4" ],
        properties: {
          player1: { type: "string" },
          player2: { type: "string" },
          player3: { type: "string" },
          player4: { type: "string" }
        }
      }
    }
  },(req: FastifyRequest, reply: FastifyReply) => {
      const data = req.body as Players;
      const tournament = new Tournament(data.player1, data.player2, data.player3, data.player4, tournamentId);
      tournaments.set(tournamentId++, tournament);
      reply.send(tournament.state);
    });

  fastify.post("/matchwinner", { 
    schema: {
      body: {
        type: "object",
        required: ["id", "match", "winner"],
        properties: {
          id: { type: "number" },
          match: { type: "number" },
          winner: { type: "string" },
        }
      }
    }
  }, (req: FastifyRequest, reply: FastifyReply) => {
      const data = req.body as Winner;
      const tournament = tournaments.get(data.id);
      if (!tournament) {
        return "tournament id don't exist";
      }
      if (data.match === 1) {
        reply.send(tournament.match1Winner(data.winner));
      }
      else if (data.match === 2) {
        reply.send(tournament.match2Winner(data.winner));
      }
      else if (data.match === 3) {
        reply.send(tournament.match3Winner(data.winner));
      }
      else {
        return "tournament has only match 1, 2 or 3";
      }
    });

  fastify.get("/get/:id",{
    schema: {
      querystring: {
        type: "object",
        properties: {
          id: { type: "number" },
        }
      }
    }
  }, (req: FastifyRequest, reply: FastifyReply) => {
      const data = req.params as TournamentId;
      const tournament = tournaments.get(Number(data.id));
      if (!tournament)
        return "tournament Not Found!";
      reply.send(tournament.state);
    });
}

export async function getgame(fastify: FastifyInstance) {
  fastify.get("/singleplayer", (req, reply) => {
    const cookies = req.cookies;

    // Create game if cookie.GameId is not found
    if (cookies.singlePlayerGameId === undefined) {
      createSinglePlayerGame(reply, singlePlayerGameId++);
    }
    else { // Joing game if cookie.GameId is found
      const cookieGameId: number = parseInt(cookies.singlePlayerGameId);
      if (singlePlayerGameRooms.has(cookieGameId)) {
        singlePlayerLastActivity.set(cookieGameId, Date.now());
        reply.send({
          state: "Joined",
          gameMode: "singleplayer",
          id: cookieGameId,
        });
      }
      else { // Has gameId cookie but game does not exist
        reply.clearCookie("singlePlayerGameId", {
          path: "/"
        });
        createSinglePlayerGame(reply, singlePlayerGameId++);
      }
    }
  });

  fastify.get("/remote", (req, reply) => {
    const cookies = req.cookies;
    if (cookies.remoteGameId === undefined) {
      const id = searchGameRoom();
      if (id === -1) {
        createRemoteGame(reply, remoteGameId++);
      }
      else {
        enterGameRoom(reply, id);
      }
    }
    else {
      const cookieGameId: number = parseInt(cookies.remoteGameId);
      if (remoteGameRooms.has(cookieGameId)) {
        enterGameRoom(reply, cookieGameId);
      }
      else {
        reply.clearCookie("remoteGameId", {
          path: "/"
        });
        createRemoteGame(reply, remoteGameId++);
      }
    }
  });
}

function enterGameRoom(reply: FastifyReply, gameId: number): void {
  const gameRoom = remoteGameRooms.get(gameId);
  let side: string = "full";

  if (gameRoom) {
    if (!gameRoom.player1) {
      side = "left";
    }
    else if (!gameRoom.player2) {
      side = "right";
    }
  }

  reply.send({
    state: "Joined",
    side: side,
    gameMode: "remotegame",
    id: gameId,
  });
}

function searchGameRoom(): number {
  for (const [id, gameRoom] of remoteGameRooms) {
    if (!gameRoom.player1 && !gameRoom.player2) {
      if (gameRoom.game.gameState.score.player1 === 0 && gameRoom.game.gameState.score.player2 === 0) {
        return id;
      }
      else {
        continue;
      }
    }
    if (!gameRoom.player1 || !gameRoom.player2) {
      return id;
    }
  }
  return -1;
}

function createRemoteGame(reply: FastifyReply, gameId: number) {
  const gameRoom = new RemoteGameRoom(gameId);
  remoteGameRooms.set(gameId, gameRoom);

  reply.setCookie("remoteGameId", gameId.toString(), {
    path: "/",
    sameSite: "none",
    secure: true,
    httpOnly: true,
  });

  reply.send({
    state: "Created",
    side: "left",
    gameMode: "remoteGame",
    id: gameId,
  });
}

function createSinglePlayerGame(reply: FastifyReply, gameId: number) {
  singlePlayerGameRooms.set(gameId, new SinglePlayerGameRoom(gameId));
  singlePlayerLastActivity.set(gameId, Date.now());

  reply.setCookie("singlePlayerGameId", gameId.toString(), {
    path: "/",
    sameSite: "none",
    secure: true,
    httpOnly: true,
  });

  reply.send({
    state: "Created",
    gameMode: "singleplayer",
    id: gameId,
  });
}
