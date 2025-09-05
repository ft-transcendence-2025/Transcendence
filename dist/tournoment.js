export class Tournoment {
    constructor(p1, p2, p3, p4, id) {
        this.startTime = Date.now();
        this.id = id;
        this.player1 = p1;
        this.player2 = p2;
        this.player3 = p3;
        this.player4 = p4;
        this.state = {
            id: this.id,
            match1: {
                player1: this.player1,
                player2: this.player2,
                winner: null,
            },
            match2: {
                player1: this.player3,
                player2: this.player4,
                winner: null,
            },
            match3: {
                player1: null,
                player2: null,
                winner: null,
            },
        };
    }
    match1Winner(player) {
        console.log(player);
        if (player !== this.state.match1.player1 && player !== this.state.match1.player2)
            return "Player not in match";
        if (this.state.match1.winner)
            return "Winner Already Set";
        this.state.match1.winner = player;
        this.state.match3.player1 = player;
        return this.state.match1;
    }
    match2Winner(player) {
        if (player !== this.state.match2.player1 && player !== this.state.match2.player2)
            return "Player not in match";
        if (this.state.match2.winner)
            return "Winner Already Set";
        this.state.match2.winner = player;
        this.state.match3.player2 = player;
        return this.state.match2;
    }
    match3Winner(player) {
        if (player !== this.state.match3.player1 && player !== this.state.match3.player2)
            return "Player not in match";
        if (this.state.match3.winner)
            return "Winner Already Set";
        this.state.match3.winner = player;
        return this.state.match3;
    }
}
