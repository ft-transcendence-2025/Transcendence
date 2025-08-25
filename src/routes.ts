import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Game, GameState} from "./game/Game.js";
import { SinglePlayerGameRoom } from "./game/SinglePlayerGameRoom.js";
import { singlePlayerGameRooms, lastActivity } from "./server.js";

let singlePlayerGameId = 0;
// let multiPlayerGameId = 0;

export async function singlePlayerRoute(fastify: FastifyInstance) {
  fastify.get("/getgame/singleplayer", (req, reply) => {
    const cookies = req.cookies;

    // Create game if cookie.GameId is not found
    if (cookies.singlePlayerGameId === undefined) {
      createSinglePlayerGame(reply, singlePlayerGameId++);
    }
    else { // Joing game if cookie.GameId is found
      const cookieGameId: number = parseInt(cookies.singlePlayerGameId);
      if (singlePlayerGameRooms.has(cookieGameId)) {
        lastActivity.set(cookieGameId, Date.now());
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
}

function createSinglePlayerGame(reply: FastifyReply, gameId: number) {
  singlePlayerGameRooms.set(gameId, new SinglePlayerGameRoom(gameId));
  lastActivity.set(gameId, Date.now());

  
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

// export async function multiPlayerRoute(fastify: FastifyInstance) {
//   fastify.get("/getgame/multiplayer", (req, reply) => {
//     const cookies = req.cookies;
//
//     // Create game if cookie.GameId is not found
//     if (cookies.multiPlayerGameId === undefined) {
//       // createGame(reply, "multiplayer", multiPlayerGameId++);
//       console.log("Something");
//     }
//     else { // Joing game if cookie.GameId is found
//       const cookieGameId: number = parseInt(cookies.multiPlayerGameId);
//       if (multiPlayerGameRooms.has(cookieGameId)) {
//         // lastActivity.set(cookieGameId, Date.now());
//         console.log("Joined multiplayer", cookieGameId);
//         reply.send({
//           state: "Joined",
//           gameMode: "multiplayer",
//           id: cookieGameId,
//         });
//       }
//       else { // Has gameId cookie but game does not exist
//         reply.clearCookie("multiPlayerGameId", {
//           path: "/"
//         });
//         console.log("Something");
//         // createGame(reply, "multiplayer", multiPlayerGameId++);
//       }
//     }
//   });
// }

