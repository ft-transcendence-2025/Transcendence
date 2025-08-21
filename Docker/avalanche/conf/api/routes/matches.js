const { newMatchSchema } = require('../schemas/matchSchemas.js');


async function matchRoutes(fastify, options) {
    fastify.post('/matches', newMatchSchema, async (req, res) => {
        const params = req.body;
        try {
            const tx = await fastify.contract.getContract().newMatch(
                BigInt(params.tournamentId),
                BigInt(params.player1),
                BigInt(params.player2),
                BigInt(params.score1),
                BigInt(params.score2),
                BigInt(params.winner),
                BigInt(params.startTime),
                BigInt(params.endTime),
                params.remoteMatch
            );
            await tx.wait();
            return { txHash: tx.hash, message: 'Match created' };
        } catch (err) {
            res.code(500).send({ error: err.reason || err.message });
        }
    });
}

module.exports = matchRoutes;