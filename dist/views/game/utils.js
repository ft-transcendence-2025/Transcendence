export var PaddleSide;
(function (PaddleSide) {
    PaddleSide[PaddleSide["Left"] = 0] = "Left";
    PaddleSide[PaddleSide["Right"] = 1] = "Right";
})(PaddleSide || (PaddleSide = {}));
;
export var PaddleState;
(function (PaddleState) {
    PaddleState[PaddleState["Up"] = 0] = "Up";
    PaddleState[PaddleState["Down"] = 1] = "Down";
})(PaddleState || (PaddleState = {}));
export var GameMode;
(function (GameMode) {
    GameMode[GameMode["PvP"] = 0] = "PvP";
    GameMode[GameMode["PvE"] = 1] = "PvE";
})(GameMode || (GameMode = {}));
export function degreesToRadians(degree) {
    return degree * Math.PI / 180;
}
export function getRandomAngle() {
    const minDeg = -45;
    const maxDeg = 45;
    const randomDeg = Math.random() * (maxDeg - minDeg) + minDeg;
    const rng = Math.random();
    if (rng < 0.5)
        return degreesToRadians(randomDeg) + Math.PI;
    return degreesToRadians(randomDeg);
}
