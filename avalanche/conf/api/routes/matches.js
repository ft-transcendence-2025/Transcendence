const { newMatchSchema } = require('../schemas/matchSchemas.js');


async function matchRoutes(fastify, options) {
    fastify.post('/matches', newMatchSchema, async (req, res) => {
        const params = req.body;
        try {
            const tx = await fastify.contract.getContract().newMatch(
                BigInt(params.tournamentId),
                params.player1,
                params.player2,
                BigInt(params.score1),
                BigInt(params.score2),
                params.winner,
                BigInt(params.startTime),
                BigInt(params.endTime),
                params.remoteMatch
            );
            await tx.wait();
            return { txHash: tx.hash, message: 'Match created' };
        } catch (err) {
            fastify.log.error(`Error saving the match: ${err.message}`);
            if (err.reason && err.reason.includes('EmptyPlayerNotAllowed')){
                res.code(400).send({ error: `Invalid Input: Player ID and/or Winner cannot be empty - Player 1: ${player1} - Player 2: ${player2} - Winner: ${winner}` });
            } else {
                res.code(500).send({ error: err.reason || err.message });
            }
        }
    });
}

module.exports = matchRoutes;