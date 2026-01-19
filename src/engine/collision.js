// Collision detection utilities
export function aabb(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

export function checkPlayerObstacleCollision(playerRect, obstacle) {
  return aabb(
    playerRect.x, playerRect.y, playerRect.w, playerRect.h,
    obstacle.x, obstacle.y - obstacle.h, obstacle.w, obstacle.h
  );
}
