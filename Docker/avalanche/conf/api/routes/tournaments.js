
async function tournamentRoutes(fastify, options) {
    
    fastify.get('/tournaments/:tournamentId/matchCount', async (req, res) => {
        
        const tournamentId = req.params.tournamentId;
        let tournamentIdBigInt;
        
        try {
            tournamentIdBigInt = BigInt(tournamentId);
            if (tournamentIdBigInt < 0n) {
                fastify.log.error( `Invalid tournamentId: ${tournamentId} (cannot be a negative value)` );
                res.code(400).send({ error: 'Invalid tournamentId: must be a valid positive integer (0 included - Local Game)' });
                return;
            }
        } catch (err) {
            fastify.log.error(`Invalid tournamentId: ${tournamentId} (must be an integer value)` );
            res.code(400).send({ error: 'Invalid tournamentId: must be a valid positive integer (0 included - Local Game)' });
            return;
        }
        
        const count = await fastify.contract.getContract().getMatchCountPerTournament(tournamentIdBigInt);
        return { count: count.toString() };
    });

    fastify.get('/tournaments/:tournamentId/matches/:matchId', async (req, res) => {
        const startTime = Date.now();
        const tournamentId = req.params.tournamentId;
        const matchId = req.params.matchId;
        let tournamentIdBigInt, matchIdBigInt;

        try {
            tournamentIdBigInt = BigInt(tournamentId);
            matchIdBigInt = BigInt(matchId);
            if (tournamentIdBigInt < 0n || matchIdBigInt < 0n) {
                fastify.log.error( `Invalid input: tournamentId ${tournamentId} and/or matchId ${matchId} cannot be less than 0.` );
                res.code(400).send({ error: 'Invalid input: tournamentId and/or matchId must be bigger or equal than 0.' });
                return;
            }
        } catch (err) {
            fastify.log.error(`Invalid input: tournamentId ${tournamentId} and/or matchId ${matchId} cannot be less than 0.` );
            res.code(400).send({ error: 'Invalid input: tournamentId and/or matchId must be bigger or equal than 0.' });
            return;
        }

        try {
            const match = await fastify.contract.getContract().getMatch(tournamentIdBigInt, matchIdBigInt);
            fastify.log.info(`Fetched the match requested, tournamentId ${tournamentId}, matchId ${matchId} in ${Date.now() - startTime}ms`);
    
    
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
        } catch (err) {
            fastify.log.error(`Error fetching the match requested, tournamentId ${tournamentId}, matchId ${matchId}. Error:  ${err.message}`);
            if (err.reason && err.reason.includes('MatchDoesNotExist')) {
                res.code(404).send({ error: `tournamentId ${tournamentId} matchId ${matchId} not found.` });
            } else {
                res.code(500).send({ error: 'Internal server error' });
            }
        }
});


    fastify.get('/tournaments/:tournamentId/matches', async (req, res) => {
        
        const startTime = Date.now();
        const tournamentId = req.params.tournamentId;
        let tournamentIdBigInt;

        try {
            tournamentIdBigInt = BigInt(tournamentId);
            if (tournamentIdBigInt < 0n) {
                fastify.log.error( `Invalid input: tournamentId ${tournamentId} cannot be less than 0.` );
                res.code(400).send({ error: 'Invalid input: tournamentId must be bigger or equal than 0.' });
                return;
            }
        } catch (err) {
            fastify.log.error(`Invalid input: tournamentId ${tournamentId} cannot be less than 0.` );
            res.code(400).send({ error: 'Invalid input: tournamentId must be bigger or equal than 0.' });
            return;
        }
        
        try {
            const matches = await fastify.contract.getContract().getMatchesByTournament(tournamentIdBigInt);
            fastify.log.info(`Fetched ${matches.length} matches for tournamentId ${tournamentId} in ${Date.now() - startTime}ms`);

            const matchesCount = matches.length;
            
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

            return { 
                count: matchesCount,
                matches: formattedMatches 
            };
        }catch (err) {
            fastify.log.error(`Error fetching matches for tournamentId ${tournamentId}: ${err.message}`);
            if (err.reason && err.reason.includes('TournamentDoesNotHaveMatches')) {
                res.code(404).send({ error: `No matches found for tournamentId ${tournamentId}` });
            } else {
                res.code(500).send({ error: 'Internal server error' });
            }
        }
    });
}

module.exports = tournamentRoutes;
