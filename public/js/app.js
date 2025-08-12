const ws = new WebSocket("ws://localhost:6969");

// Wait for connection to open
ws.addEventListener('open', () => {
  console.log("WebSocket connected!");
});

ws.addEventListener("message", (event) => {
  console.log(JSON.parse(event.data));
});

let payLoad = {};

// Listen for keydown events on the document
document.addEventListener("keydown", (event) => {
  if (["s", "S", "w", "W", "ArrowDown", "ArrowUp"].includes(event.key)) {
    event.preventDefault();
  }
  // Send key data to server through WebSocket
  if (ws.readyState === WebSocket.OPEN) {
    payLoad["type"] = "keydown";
    payLoad["key"] = event.key;
    ws.send(JSON.stringify(payLoad));
  }
  else {
    console.log("WebSocket not ready. State:", ws.readyState);
  }
});

document.addEventListener("keyup", (event) => {
  // Send key data to server through WebSocket
  if (ws.readyState === WebSocket.OPEN) {
    payLoad["type"] = "keyup";
    payLoad["key"] = event.key;
    ws.send(JSON.stringify(payLoad));
  }
  else {
    console.log("WebSocket not ready. State:", ws.readyState);
  }
});
