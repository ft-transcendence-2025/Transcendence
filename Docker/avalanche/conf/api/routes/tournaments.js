
async function tournamentRoutes(fastify, options) {
    
    fastify.get('/tournaments/:tournamentId/matchCount', async (req, res) => {
        const tournamentId = req.params.tournamentId;
        
        let tournamentIdBigInt;
        try {
            tournamentIdBigInt = BigInt(tournamentId);
            if (tournamentIdBigInt < 0n) {
                fastify.log.error(`Invalid tournamentId: ${tournamentId} (cannot be a negative value)` );
                res.code(400).send({ error: 'Invalid tournamentId: must be a valid positive integer (0 included - Local Game)' });
                return;
            }
        } catch (err) {
            fastify.log.error(`Invalid tournamentId: ${tournamentId} (cannot be a negative value)` );
            res.code(400).send({ error: 'Invalid tournamentId: must be a valid positive integer (0 included - Local Game)' });
            return;
        }
        
        const count = await fastify.contract.getContract().getMatchCountPerTournament(tournamentIdBigInt);
        return { count: count.toString() };
    });

    fastify.get('/tournaments/:tournamentId/matches/:matchId', async (req, res) => {
    const tournamentId = BigInt(req.params.tournamentId);
    const matchId = BigInt(req.params.matchId);
    const match = await fastify.contract.getContract().getMatch(tournamentId, matchId);

    const formattedMatch = {
        tournamentId: match.tId.toString(),
            matchId: match.mId.toString(),
            player1: match.pl1.toString(),
            player2: match.pl2.toString(),
            score1: match.scr1.toString(),
            score2: match.scr2.toString(),
            winner: match.win.toString(),
            startTime: match.sTime.toString(),
            endTime: match.eTime.toString(),
            remoteMatch: match.remoteMatch,
        };
    return { match: formattedMatch };
});


fastify.get('/tournaments/:tournamentId/matches', async (req, res) => {
    const tournamentId = BigInt(req.params.tournamentId);
    const matches = await fastify.contract.getContract().getMatchesByTournament(tournamentId);

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

module.exports = tournamentRoutes;
