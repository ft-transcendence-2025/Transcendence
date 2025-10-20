const { playerMatchSchema } = require('../schemas/playerMatchSchemas.js');

async function playerRoutes(fastify, options) {

    fastify.get('/players/:playerId/matches',{ schema: playerMatchSchema }, async (req, res) => {
        const startTime = Date.now();
        const playerId = req.params.playerId;

        try {
            const matches = await fastify.contract.getContract().getMatchesByPlayer(playerId);
            fastify.log.info(`Fetched ${matches.length} matches for player ${playerId} in ${Date.now() - startTime}ms`);
            
            const matchesCount = matches.length;

            const formattedMatches = matches.map(match => ({
                    tournamentId: match.tournamentId.toString(),
                    matchId: match.matchId.toString(),
                    player1: match.player1.toString(),
                    player2: match.player2.toString(),
                    score1: match.score1.toString(),
                    score2: match.score2.toString(),
                    winner: match.winner.toString(),
                    startTime: match.startTime.toString(),
                    endTime: match.endTime.toString(),
                    finalMatch: match.finalMatch,
            }));

            return { 
                count: matchesCount,
                matches: formattedMatches 
            };
        } catch (err) {
            fastify.log.error(`Error fetching matches for player ${playerId}: ${err.message}`);
            if (err.reason && err.reason.includes('PlayerDoesNotHaveMatches')) {
                res.code(404).send({ error: `No matches found for playerId ${playerId}` });
            } else {
                res.code(500).send({ error: 'Internal server error' });
            }
        }
        

    });
}
module.exports = playerRoutes;