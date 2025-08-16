
const fastify = require('fastify')({ logger: true });
const PORT = process.env.PORT || 3000;

// Health check endpoint
fastify.get('/health', async(req, res) => {
    return { status: 'healthy', message: 'API is running' };
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
