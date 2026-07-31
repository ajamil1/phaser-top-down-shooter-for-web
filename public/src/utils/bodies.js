// Pooled-body lifecycle helpers.
//
// Phaser's arcade World.step() does two things over *every* body in
// world.bodies, regardless of whether the owning sprite is active:
//   1. integrates it  (`if (body.enable) body.update(delta)`)
//   2. rebuilds the collision RTree from scratch (`tree.clear(); tree.load(bodies)`)
//
// Setting `sprite.setActive(false)` does neither — the dead body stays in the
// simulation forever. With ~7k pooled bodies the per-step tree rebuild alone
// costs ~2ms and grows as the pools fill, which is what makes a long run crawl.
//
// world.disableBody() removes the body from world.bodies AND the tree;
// world.add() puts it back and re-enables it. Always pair them.

export function sleepBody(obj) {
  const body = obj?.body;
  if (!body || !body.enable) return;
  obj.scene?.physics?.world?.disableBody(body);
}

export function wakeBody(obj) {
  const body = obj?.body;
  if (!body || body.enable) return;
  obj.scene?.physics?.world?.add(body);
}
