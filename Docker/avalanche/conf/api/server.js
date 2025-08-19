
const fastify = require('fastify')({ logger: true });
const PORT = process.env.PORT || 3000;


const { init: initContract, getContract, getAddress } = require('./integrations/contract.js');

initContract();

fastify.decorate('contract', {
    getContract: getContract,
    getAddress: getAddress
});

// Routes
const tournamentRoutes = require('./routes/tournaments.js');
fastify.register(tournamentRoutes);

const playerRoutes = require('./routes/players.js');
fastify.register(playerRoutes);

const matchRoutes = require('./routes/matches.js');
fastify.register(matchRoutes);

// Health check endpoint
fastify.get('/health', async(req, res) => {
    return { status: 'healthy', message: 'API is running' };
});

// Contract address endpoint
fastify.get('/contract/address', async (req, res) => {
    return { address: getAddress() };
});

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
