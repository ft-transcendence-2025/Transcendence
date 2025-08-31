const newMatchSchema = {
    schema: {
        body: {
            type: 'object',
            required: ['tournamentId', 'player1', 'player2', 'score1', 'score2', 'winner', 'startTime', 'endTime', 'finalMatch'],
            properties: {
                tournamentId: { type: 'string' },
                player1: { type: 'string' },
                player2: { type: 'string' },
                score1: { type: 'string' },
                score2: { type: 'string' },
                winner: { type: 'string' },
                startTime: { type: 'string' },
                endTime: { type: 'string' },
                finalMatch: { type: 'boolean' }
            }
        }
    }
};

module.exports = { newMatchSchema };