
const fastify = require('fastify')({ logger: true });

const PORT = process.env.PORT || 3000;

const { init: initContract, getContract, getAddress } = require('./contract');

// Health check endpoint
fastify.get('/health', async(req, res) => {
    return { status: 'healthy', message: 'API is running' };
});

initContract();

// Contract address endpoint
fastify.get('/contract/address', async (req, res) => {
    return { address: getAddress() };
});

fastify.get('/tournaments/:tournamentId/matchCount', async (req, res) => {
    const tournamentId = BigInt(req.params.tournamentId);
    const count = await getContract().getMatchCountPerTournament(tournamentId);
    return { count: count.toString() };
});

fastify.get('/tournaments/:tournamentId/matches/:matchId', async (req, res) => {
    const tournamentId = BigInt(req.params.tournamentId);
    const matchId = BigInt(req.params.matchId);
    const match = await getContract().getMatch(tournamentId, matchId);

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
    const matches = await getContract().getMatchesByTournament(tournamentId);

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

fastify.get('/players/:playerId/matches', async (req, res) => {
    const playerId = BigInt(req.params.playerId);
    const matches = await getContract().getMatchesByPlayer(playerId);

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

/*const userRoutes = require('./routes/users.js');
fastify.register(userRoutes);*/

const start = async () => {
    try {
        await fastify.listen( {port: PORT, host: '0.0.0.0' });
        fastify.log.info(`Server listening on ${PORT}`);
    }
    catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

module.exports = { start };

if (require.main === module) {
        start();
}
