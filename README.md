### End Points

- Get http://localhost:4000/getgame/remote

```
	return {

		state: "Joined" | "Created",
  
		side: "left" | "right",
  
		gameMode: "remoteGame",
  
		id: gameId,
  
	}
```


- Get http://localhost:4000/getgame/singleplayer

  ```
	return {

		state: "Joined" | "Created",
  
		gameMode: "singleplayer" | "remotegame",
  
		id: GameId,
  
	}
  ```
  

#### WebSocket 

- ws://localhost:4000/game/singleplayer/${GameId}

- ws://localhost:4000/game/multiplayer/${GameId}

```
 gameState {
 
	  status: string,
   
	  canvas: Canvas,
   
	  paddleLeft: PaddleState,
   
	  paddleRight: PaddleState,
   
	  ball: BallState,
   
	  score: {
   
			player1: number,
   
			player2: number,
   
			winner: 1 | 2 | null,
   
	  },
   
	  isPaused: boolean,
   
}
```

```
 PaddleState {
 
  connected: boolean,
  
  moving: {
  
	up: boolean,
 
	down: boolean,
 
  },
  
  position: PaddlePositionState,
  
  attr: {
  
	width: number,
 
	height: number,
 
  },
  
  speed: number,
  
}
```
```
 PaddlePositionState {
 
  x: number,
  
  y: number,
  
}
```
```
 BallState {
 
  x: number,
  
  y: number,
  
  radius: number,
  
  isRunning: boolean,
  
  angle: number,
  
};

```
