import { state } from '../state.js';

// Simple line-of-sight check against active wall sprites.
// Samples N points along the enemy→player segment and tests each against
// every wall whose centre lies within the bounding box of that segment.
// No tile grid, no BFS — works with the random wall layout.

const HALF = 35;  // slightly larger than wall half-size (66px/2 = 33px) for margin
const STEPS = 8;

export function hasLineOfSight(ex, ey) {
  const { player, walls } = state;
  const px = player.x, py = player.y;

  const minX = Math.min(ex, px) - HALF;
  const maxX = Math.max(ex, px) + HALF;
  const minY = Math.min(ey, py) - HALF;
  const maxY = Math.max(ey, py) + HALF;

  const children = walls.getChildren();

  for (let s = 1; s < STEPS; s++) {
    const t  = s / STEPS;
    const sx = ex + (px - ex) * t;
    const sy = ey + (py - ey) * t;

    for (let i = 0; i < children.length; i++) {
      const w = children[i];
      if (!w.active) continue;
      if (w.x < minX || w.x > maxX || w.y < minY || w.y > maxY) continue;
      if (Math.abs(sx - w.x) < HALF && Math.abs(sy - w.y) < HALF) return false;
    }
  }
  return true;
}
