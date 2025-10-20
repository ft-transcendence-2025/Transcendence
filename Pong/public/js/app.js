const ws = new WebSocket("ws://localhost:6969");

let score = document.getElementById("score-area");
let canvas = document.getElementById("pong-canvas");
let ctx = canvas.getContext("2d");
let gameState = {};


// Wait for connection to open
ws.addEventListener('open', () => {

  ws.addEventListener("message", (event) => {
    gameState = JSON.parse(event.data);
    canvas.width = gameState.canvas.width;
    canvas.height = gameState.canvas.height;
    requestAnimationFrame(gameLoop);
  });

});

function gameLoop() {
  score.innerHTML = `${gameState.score.player1} - ${gameState.score.player2}`;

  ctx.clearRect(0, 0, gameState.canvas.width, gameState.canvas.height);
  renderBall(gameState.ball);
  renderPaddle(gameState.paddleLeft);
  renderPaddle(gameState.paddleRight);

  requestAnimationFrame(gameLoop);
}


function renderBall(ball) {
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2); // Full circle
  ctx.fillStyle = "#FE4E00";
  ctx.fill();

  ctx.strokeStyle = "#253031";
  ctx.lineWidth = 2;
  ctx.stroke();
}


function renderPaddle(paddle) {
  ctx.fillStyle =  "#5FAD56";
  ctx.fillRect(paddle.position.x, paddle.position.y, paddle.attr.width, paddle.attr.height);
  ctx.strokeStyle =  "#396733";
  ctx.lineWidth = 0;
  ctx.strokeRect(paddle.position.x, paddle.position.y, paddle.attr.width, paddle.attr.height);
}


// Listen for keydown events on the document
document.addEventListener("keydown", (event) => {
  if ([" ", "s", "S", "w", "W", "ArrowDown", "ArrowUp"].includes(event.key)) {
    event.preventDefault();
  }
  // Send key data to server through WebSocket
  if (ws.readyState === WebSocket.OPEN) {
    const payLoad = {
      type: "keydown",
      key: event.key,
    };
    ws.send(JSON.stringify(payLoad));
  }
  else {
    console.log("WebSocket not ready. State:", ws.readyState);
  }
});

document.addEventListener("keyup", (event) => {
  // Send key data to server through WebSocket
  if (ws.readyState === WebSocket.OPEN) {
    const payLoad = {
      type: "keyup",
      key: event.key,
    };
    ws.send(JSON.stringify(payLoad));
  }
  else {
    console.log("WebSocket not ready. State:", ws.readyState);
  }
});
