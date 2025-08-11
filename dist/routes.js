import { Game } from "./game/Game.js";
export async function routes(fastify) {
    fastify.get('/', (req, reply) => {
        let game = new Game();
        let gameState = game.gameState;
        return { gameState };
    });
}
;
