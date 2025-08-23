const playerMatchSchema = {
    schema: {
        params: {
            type: 'object',
            required: ['playerId'],
            properties: {
                playerId: { type: 'string', minLength: 1 }
            }
        }
    }
};

module.exports = { playerMatchSchema };