export async function routes(fastify) {
    fastify.get('/', (req, reply) => {
        reply.sendFile('./html/index.html');
    });
    fastify.get("/:id", async (req, reply) => {
        const { id } = req.params;
        reply.send(id);
    });
}
;
