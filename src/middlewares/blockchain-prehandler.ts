import { FastifyRequest, FastifyReply } from "fastify";

interface JwtPayload {
  id: string;
  email?: string;
  username: string;
  iat?: number;
  exp?: number;
}

export const blockchainPreHandler = (app: any) => async (
    request: FastifyRequest, 
    reply: FastifyReply
  ) => {
    // Exige autenticação = UM JWT VALIDO
    await app.authenticate(request, reply);

    // Exige autorização

    const match = request.url.match(/^\/api\/blockchain\/players\/([^/]+)\/matches$/);
    if (!match) {
      return;
    }
    const playerId = match[1];

    const user = request.user as JwtPayload;
    if (user.username !== playerId) {
      return reply.status(403).send({ error: "Unauthorized to access this player's matches" });
    }
  };

