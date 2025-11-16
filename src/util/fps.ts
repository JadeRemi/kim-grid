export function calculateFPS(frameCount: number, elapsedTime: number): number {
  if (elapsedTime === 0) return 0
  return (frameCount * 1000) / elapsedTime
}