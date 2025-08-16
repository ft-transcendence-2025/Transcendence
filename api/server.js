
const fastify = require('fastify')({ logger: true });
const PORT = 3000

const userRoutes = require('./routes/users.js');
fastify.register(userRoutes);




// GET root Route
fastify.get('/', async (req, res) => {
    return { hello: 'world' };
});

const start = async () => {
    try {
        await fastify.listen( {port: PORT });
        fastify.log.info(`Server listening on ${fastify.server.address().port}`);
    }
    catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();