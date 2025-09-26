export interface GameState {
  player1Name?: string,
  player2Name?: string,
  status?: string,
  role?: string | null,
  canvas?: Canvas,
  paddleLeft?: PaddleState,
  paddleRight?: PaddleState,
  ball?: BallState,
  score?: {
    player1: number,
    player2: number,
    winner?: 1 | 2,
  },
  isPaused: boolean,
  timeToWait: number,
};

export interface FetchData {
  state: string,
  side: string,
  gameMode: string,
  name: string,
  id: number,
}

export interface Canvas {
  width: number,
  height: number,
};

export enum PaddleSide {
  Left = 0,
  Right = 1,
};

export interface PaddleState {
  connected: boolean,
  moving: {
    up: boolean,
    down: boolean,
  },
  position: {
    x: number,
    y: number,
  },
  attr: {
    width: number,
    height: number,
  }
  speed: number,
}

export enum GameMode {
  PvP = 0,
  PvE = 1,
  Online = 3,
}

export interface BallState {
  x: number,
  y: number,
  radius: number,
  isRunning: boolean,
  angle: number,
};

export const SECOND: number = 100;

export function degreesToRadians(degree: number): number {
  return degree * Math.PI/180;
}

export function getRandomAngle(): number {
  const minDeg = -45;
  const maxDeg = 45;
  const randomDeg = Math.random() * (maxDeg - minDeg) + minDeg;
  const rng = Math.random();

  if (rng < 0.5)
    return degreesToRadians(randomDeg) + Math.PI;
  return degreesToRadians(randomDeg);
}
