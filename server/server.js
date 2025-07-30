const fs = require('fs');
const fastifyStatic = require('@fastify/static')
const path = require('node:path')
const fastify = require('fastify')({
  https: {
    key: fs.readFileSync(path.join(__dirname, '../ssl/key.pem')),
    cert: fs.readFileSync(path.join(__dirname, '../ssl/cert.pem'))
  }
})

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
