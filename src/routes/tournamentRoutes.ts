import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  createLocalTournament,
} from "./routeUtils.js";
import { localTournaments } from "./../server.js";
import { TournamentManager } from "../tournament/TournamentManager.js";

let localTournamentId: number = 0;

export const localTournamentSchema = {
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
}

export function localTournament(req: FastifyRequest, reply: FastifyReply) {
  const cookies = req.cookies;

  // Create Tournament if cookie.GameId is not found
  if (cookies.localTournamentId === undefined) {
    createLocalTournament(req, reply, localTournamentId++);
  }
  else { // Joing tournament if cookie.localTournamentState is found
    const tournamentId = parseInt(cookies.localTournamentId);
    if (localTournaments.has(tournamentId)) {
      const tournament = localTournaments.get(tournamentId);
      tournament?.matchWinner();
      reply.send(tournament?.state);
    }
    else { // Has cookie.localTournamentState cookie but game does not exist
      reply.clearCookie("localTournamentId", {
        path: "/"
      });
      createLocalTournament(req, reply, localTournamentId++);
    }
  }
}

export function deleteLocalTournament(req: FastifyRequest, reply: FastifyReply) {
  const cookies = req.cookies;

  if (cookies.localTournamentId === undefined) {
    reply.send("Tournament Not Found");
    return;
  }
  const tournamentId = parseInt(cookies.localTournamentId);
  if (localTournaments.has(tournamentId)) {
    const tournament = localTournaments.get(tournamentId);
    tournament?.gameRoom.cleanup();
    localTournaments.delete(tournamentId);
    reply.clearCookie("localTournamentId", {
      path: "/"
    });
    reply.send(`Tournament ${tournamentId} Deleted`);
    return ;
  }
  reply.send("Tounament Not Found")
}

/**
 * ========================================
 * REMOTE TOURNAMENT REST API ROUTES
 * ========================================
 */

/**
 * Register all remote tournament HTTP endpoints
 */
export async function registerRemoteTournamentRoutes(fastify: FastifyInstance) {
  const manager = TournamentManager.getInstance();

  /**
   * GET /tournament/remote
   * List all active remote tournaments
   */
  fastify.get("/tournament/remote", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const tournaments = manager.getActiveTournaments();
      
      reply.send({
        success: true,
        data: tournaments.map(t => t.toJSON()),
      });
    } catch (error) {
      console.error("[Tournament API] Error listing tournaments:", error);
      reply.status(500).send({
        success: false,
        message: "Failed to list tournaments",
      });
    }
  });

  /**
   * GET /tournament/remote/:id
   * Get specific tournament details
   */
  fastify.get<{
    Params: { id: string };
  }>("/tournament/remote/:id", async (request, reply) => {
    try {
      const { id } = request.params;
      const tournament = manager.getTournament(id);

      if (!tournament) {
        reply.status(404).send({
          success: false,
          message: "Tournament not found",
        });
        return;
      }

      reply.send({
        success: true,
        data: tournament.toJSON(),
      });
    } catch (error) {
      console.error("[Tournament API] Error getting tournament:", error);
      reply.status(500).send({
        success: false,
        message: "Failed to get tournament",
      });
    }
  });

  /**
   * POST /tournament/remote
   * Create a new remote tournament
   */
  fastify.post<{
    Body: {
      name: string;
      createdBy: string;
      config?: {
        maxPlayers?: number;
        minPlayers?: number;
        registrationTimeout?: number;
        matchTimeout?: number;
        isRanked?: boolean;
        allowSpectators?: boolean;
      };
    };
  }>("/tournament/remote", async (request, reply) => {
    try {
      const { name, createdBy, config } = request.body;

      if (!name || !createdBy) {
        reply.status(400).send({
          success: false,
          message: "Name and createdBy are required",
        });
        return;
      }

      const tournament = manager.createTournament(name, createdBy, config);

      reply.status(201).send({
        success: true,
        data: tournament.toJSON(),
      });
    } catch (error) {
      console.error("[Tournament API] Error creating tournament:", error);
      reply.status(500).send({
        success: false,
        message: "Failed to create tournament",
      });
    }
  });

  /**
   * DELETE /tournament/remote/:id
   * Delete a tournament (admin only)
   */
  fastify.delete<{
    Params: { id: string };
  }>("/tournament/remote/:id", async (request, reply) => {
    try {
      const { id } = request.params;
      
      const deleted = manager.deleteTournament(id);

      if (!deleted) {
        reply.status(404).send({
          success: false,
          message: "Tournament not found",
        });
        return;
      }

      reply.send({
        success: true,
        message: "Tournament deleted successfully",
      });
    } catch (error) {
      console.error("[Tournament API] Error deleting tournament:", error);
      reply.status(500).send({
        success: false,
        message: "Failed to delete tournament",
      });
    }
  });

  /**
   * GET /tournament/remote/:id/bracket
   * Get tournament bracket
   */
  fastify.get<{
    Params: { id: string };
  }>("/tournament/remote/:id/bracket", async (request, reply) => {
    try {
      const { id } = request.params;
      const tournament = manager.getTournament(id);

      if (!tournament) {
        reply.status(404).send({
          success: false,
          message: "Tournament not found",
        });
        return;
      }

      if (!tournament.bracket) {
        reply.status(404).send({
          success: false,
          message: "Bracket not yet generated",
        });
        return;
      }

      reply.send({
        success: true,
        data: tournament.bracket,
      });
    } catch (error) {
      console.error("[Tournament API] Error getting bracket:", error);
      reply.status(500).send({
        success: false,
        message: "Failed to get bracket",
      });
    }
  });

  /**
   * GET /tournament/remote/stats
   * Get tournament statistics
   */
  fastify.get("/tournament/remote/stats", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const stats = manager.getStats();

      reply.send({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("[Tournament API] Error getting stats:", error);
      reply.status(500).send({
        success: false,
        message: "Failed to get stats",
      });
    }
  });

  console.log("[Tournament API] Remote tournament routes registered");
}
