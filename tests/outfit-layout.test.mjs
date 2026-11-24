import { test } from "node:test";
import assert from "node:assert/strict";
import {
  frame,
  poseFor,
  drawOrder,
  boardRatio,
  readLayouts,
  storeLayout,
  itemPose,
  orderedItems,
  hasOuterwear,
} from "../src/lib/outfit-layout.ts";

test("arranges a look from top to bottom, with the jacket beside the top", () => {
  for (const jacket of [false, true]) {
    assert.ok(frame("top", jacket).y < frame("bottom", jacket).y);
    assert.ok(frame("bottom", jacket).y < frame("shoes", jacket).y);
  }
  assert.ok(frame("jacket", true).x < frame("top", true).x);
});
test("rotation and resizing stay within the exported sheet", () => {
  for (const slot of drawOrder)
    for (const rotation of [-180, -90, -45, 0, 35, 90, 180]) {
      const f = frame(slot, true);
      const p = poseFor(slot, true, { x: -50, y: 250, rotation, scale: 1.6 });
      const r = (rotation * Math.PI) / 180;
      const halfW =
        ((Math.abs(Math.cos(r)) * f.width +
          Math.abs(Math.sin(r)) * f.height * boardRatio) *
          p.scale) /
        2;
      const halfH =
        (((Math.abs(Math.sin(r)) * f.width) / boardRatio +
          Math.abs(Math.cos(r)) * f.height) *
          p.scale) /
        2;
      assert.ok(p.x - halfW >= -1e-8 && p.x + halfW <= 100 + 1e-8);
      assert.ok(p.y - halfH >= -1e-8 && p.y + halfH <= 100 + 1e-8);
    }
});
test("normalizes corrupt local values rather than breaking the board", () => {
  const p = poseFor("top", false, {
    x: NaN,
    y: Infinity,
    rotation: 9999,
    scale: -30,
    flip: "yes",
  });
  assert.ok(
    Object.values(p).every(
      (value) => typeof value === "boolean" || Number.isFinite(value),
    ),
  );
  assert.equal(p.flip, false);
  assert.equal(p.rotation, 180);
  assert.equal(p.scale, 0.4);
});
test("saved layouts are separated by account and recover from invalid storage", () => {
  const memory = new Map();
  const original = globalThis.localStorage;
  globalThis.localStorage = {
    getItem: (key) => memory.get(key),
    setItem: (key, value) => memory.set(key, value),
  };
  try {
    const layout = { top: poseFor("top", false, { rotation: 25 }) };
    storeLayout("alice", "outfit", layout);
    assert.deepEqual(readLayouts("alice").outfit, layout);
    assert.deepEqual(readLayouts("bob"), {});
    memory.set("wardrobe-layouts:alice", "{invalid");
    assert.deepEqual(readLayouts("alice"), {});
  } finally {
    if (original === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = original;
  }
});

test("all items survive layering, including repeated categories and accessories", () => {
  const items = [
    { id: "necklace", category: "jewelry" },
    { id: "shirt-a", category: "top" },
    { id: "hat", category: "hat" },
    { id: "shirt-b", category: "top" },
    { id: "cardigan", category: "cardigan" },
    { id: "ring", category: "jewelry" },
  ];
  const ordered = orderedItems(items);
  assert.equal(ordered.length, items.length);
  assert.equal(new Set(ordered.map((item) => item.id)).size, items.length);
  assert.deepEqual(
    ordered.filter((item) => item.category === "top").map((item) => item.id),
    ["shirt-a", "shirt-b"],
  );
  assert.equal(hasOuterwear(items), true);
  assert.notDeepEqual(
    itemPose(items[1], items, {}),
    itemPose(items[3], items, {}),
  );
  assert.notDeepEqual(
    itemPose(items[0], items, {}),
    itemPose(items[5], items, {}),
  );
});
test("item poses edit independently and preserve legacy layouts without stacking new pieces", () => {
  const items = [
    { id: "a", category: "top" },
    { id: "b", category: "top" },
  ];
  const legacy = poseFor("top", false, { rotation: 30, x: 40, y: 35 });
  const layout = { top: legacy };
  assert.deepEqual(itemPose(items[0], items, layout), legacy);
  assert.notDeepEqual(itemPose(items[1], items, layout), legacy);
  const secondBefore = itemPose(items[1], items, layout);
  const updated = { ...layout, a: { ...legacy, rotation: -20 } };
  assert.equal(itemPose(items[0], items, updated).rotation, -20);
  assert.deepEqual(itemPose(items[1], items, updated), secondBefore);
});
test("repeat placement is deterministic and remains within the board for every category", () => {
  for (const category of drawOrder) {
    const items = Array.from({ length: 6 }, (_, i) => ({
      id: `${category}-${i}`,
      category,
    }));
    const positions = items.map((item) => itemPose(item, items, {}));
    assert.equal(
      new Set(positions.map(({ x, y }) => `${x}:${y}`)).size,
      items.length,
    );
    assert.deepEqual(
      items.map((item) => itemPose(item, items, {})),
      positions,
    );
    const box = frame(category, hasOuterwear(items));
    for (const pose of positions) {
      assert.ok(pose.x - (box.width * pose.scale) / 2 >= 0);
      assert.ok(pose.x + (box.width * pose.scale) / 2 <= 100);
      assert.ok(pose.y - (box.height * pose.scale) / 2 >= 0);
      assert.ok(pose.y + (box.height * pose.scale) / 2 <= 100);
    }
  }
});
