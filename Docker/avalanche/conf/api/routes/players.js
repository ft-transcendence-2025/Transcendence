async function playerRoutes(fastify, options) {

    fastify.get('/players/:playerId/matches', async (req, res) => {
        const playerId = BigInt(req.params.playerId);
        const matches = await fastify.contract.getContract().getMatchesByPlayer(playerId);

        const formattedMatches = matches.map(match => {
            return {
                tournamentId: match.tournamentId.toString(),
                matchId: match.matchId.toString(),
                player1: match.player1.toString(),
                player2: match.player2.toString(),
                score1: match.score1.toString(),
                score2: match.score2.toString(),
                winner: match.winner.toString(),
                startTime: match.startTime.toString(),
                endTime: match.endTime.toString(),
                remoteMatch: match.remoteMatch,
            };
        });
        return { matches: formattedMatches };
    });
}
module.exports = playerRoutes;