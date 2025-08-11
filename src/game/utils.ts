export interface Canvas {
  width: number,
  height: number,
};

export const canvas: Canvas = {
  width: 1000,
  height: 500,
}

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

