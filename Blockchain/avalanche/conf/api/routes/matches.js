const { newMatchSchema } = require('../schemas/matchSchemas.js');


async function matchRoutes(fastify, options) {
    fastify.post('/matches', newMatchSchema, async (req, res) => {
        const params = req.body;
        try {
            console.log(req.body);
            const tx = await fastify.contract.getContract().newMatch(
                BigInt(params.tournamentId),
                params.player1,
                params.player2,
                BigInt(params.score1),
                BigInt(params.score2),
                params.winner,
                BigInt(params.startTime),
                BigInt(params.endTime),
                params.finalMatch
            );
            await tx.wait();
            const result = { txHash: tx.hash, message: 'Match created' };
            console.log(result);
            return result;
        } catch (err) {
            fastify.log.error(`Error saving the match: ${err.message}`);
            if (err.reason && err.reason.includes('EmptyPlayerNotAllowed')){
                res.code(400).send({ error: `Invalid Input: Player ID cannot be empty - Player 1: ${player1} - Player 2: ${player2}.` });
            } else if (err.reason && err.reason.includes('InvalidPlayers')) {
                res.code(400).send({ error: `Invalid Input: Player IDs cannot be equal - Player 1: ${player1} - Player 2: ${player2}.` });
            } else if (err.reason && err.reason.includes('InvalidWinner')) {
                res.code(400).send({ error: `Invalid Input: Winner must be Player 1: ${player1} or Player 2: ${player2}.` });
            } else if (err.reason && err.reason.includes('InvalidTimeStamps')) {
                res.code(400).send({ error: `Invalid Input: Final timestamp: ${endTime} cannot be smaller than Initial timestamp: ${startTime}.` });
            } else if (err.reason && err.reason.includes('FinalMatchAlreadyExists')) {
                res.code(400).send({ error: `Invalid Input: The tournament ${tournamentId} already have a final match.` });
            } else {
                res.code(500).send({ error: err.reason || err.message });
            }
        }
    });

    fastify.get('/matches', async (req, res) => {
        try {
            const matches = await fastify.contract.getContract().getAllMatches();
            fastify.log.info(`Fetched ${matches.length} matches.`);

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
                    finalMatch: match.finalMatch,
                };
            });
            return {
                count: matchesCount,
                matches: formattedMatches
            }
        }catch (err) {
            fastify.log.error(`Error fetching matches: ${err.message}`);
            if (err.reason && err.reason.includes('NoMatchesWereSavedYet')) {
                res.code(404).send({ error: 'No matches found.' });
            } else {
                res.code(500).send({ error: 'Internal server error' });
            }
        }
    });
}

module.exports = matchRoutes;