const fastify = require('fastify')()
const fastifyStatic = require('@fastify/static')
const path = require('node:path')

fastify.register(fastifyStatic, {
  root: path.join(__dirname, '../dist'),
  prefix: '/',
})

fastify.get('/pong', function (req, reply) {
  reply.sendFile('index.html');
})

// Run the server!
fastify.listen({ port: 5000 }, (err, address) => {
  if (err)
    throw err
})
