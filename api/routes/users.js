const { createUserSchema } = require('../schemas/userSchemas.js');

// In-memory database
let users = [
    { id: 1, name: 'John' },
    { id: 2, name: 'Marie' },
];


async function userRoutes(fastify, options) {
    // GET all users Route
    fastify.get('/users', async (req, res) => {
        return users;
    });

    // GET a single user Route
    fastify.get('/users/:id', async (req, res) => {
        const id = Number(req.params.id);
        const user = users.find(u => u.id === id);
        if (!user){
            res.code(404);
            return { error: 'User not found' };
        }
        return user;
    });

    // POST new user Route
    fastify.post('/users', createUserSchema, async (req, res) => {
        const newUser = req.body;
        newUser.id = users.length + 1;
        users.push(newUser);
        res.code(201);
        return newUser;
    });
}

module.exports = userRoutes;