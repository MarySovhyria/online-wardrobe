export type Slot =
  "top" | "bottom" | "jacket" | "cardigan" | "hat" | "shoes" | "jewelry";
export type Pose = {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  flip: boolean;
};
export type Layout = Partial<Record<string, Pose>>;
export const drawOrder: Slot[] = [
  "jacket",
  "cardigan",
  "bottom",
  "top",
  "shoes",
  "hat",
  "jewelry",
];
export const boardRatio = 1.4;
const clamp = (n: number, low: number, high: number) =>
  Math.min(high, Math.max(low, n));
export function frame(slot: Slot, hasJacket: boolean) {
  const frames = hasJacket
    ? {
        jacket: [27, 28, 45, 47],
        cardigan: [27, 40, 42, 43],
        hat: [18, 9, 25, 15],
        jewelry: [23, 63, 27, 21],
        top: [73, 26, 46, 36],
        bottom: [72, 69, 41, 55],
        shoes: [27, 86, 45, 23],
      }
    : {
        jacket: [24, 28, 40, 44],
        cardigan: [24, 28, 40, 44],
        hat: [15, 10, 24, 16],
        jewelry: [18, 61, 26, 22],
        top: [50, 23, 64, 36],
        bottom: [50, 62, 48, 47],
        shoes: [50, 92, 52, 14],
      };
  const [x, y, width, height] = frames[slot];
  return { x, y, width, height };
}
export function poseFor(
  slot: Slot,
  hasJacket: boolean,
  value?: Partial<Pose>,
): Pose {
  const base = frame(slot, hasJacket);
  const finite = (v: unknown, fallback: number) =>
    typeof v === "number" && Number.isFinite(v) ? v : fallback;
  const rotation = clamp(finite(value?.rotation, 0), -180, 180);
  let scale = clamp(finite(value?.scale, 1), 0.4, 1.6);
  const radians = (rotation * Math.PI) / 180;
  const width =
    Math.abs(Math.cos(radians)) * base.width +
    Math.abs(Math.sin(radians)) * base.height * boardRatio;
  const height =
    (Math.abs(Math.sin(radians)) * base.width) / boardRatio +
    Math.abs(Math.cos(radians)) * base.height;
  scale = Math.min(scale, 96 / width, 96 / height);
  const dx = (width * scale) / 2,
    dy = (height * scale) / 2;
  return {
    x: clamp(finite(value?.x, base.x), dx, 100 - dx),
    y: clamp(finite(value?.y, base.y), dy, 100 - dy),
    scale,
    rotation,
    flip: value?.flip === true,
  };
}
type LayoutItem = { id: string; category: Slot };
export function hasOuterwear(items: readonly LayoutItem[]) {
  return items.some(
    (item) => item.category === "jacket" || item.category === "cardigan",
  );
}
/** Stable layering shared by the interactive preview and PNG export. */
export function orderedItems<T extends LayoutItem>(items: readonly T[]): T[] {
  return [...items].sort(
    (a, b) => drawOrder.indexOf(a.category) - drawOrder.indexOf(b.category),
  );
}
/** Resolve independent item positions while preserving existing category-based layouts. */
export function itemPose(
  item: LayoutItem,
  items: readonly LayoutItem[],
  layout: Layout,
): Pose {
  const layered = hasOuterwear(items);
  const peers = items.filter((peer) => peer.category === item.category);
  const index = peers.findIndex((peer) => peer.id === item.id);
  const saved =
    layout[item.id] ?? (index === 0 ? layout[item.category] : undefined);
  if (saved) return poseFor(item.category, layered, saved);
  if (peers.length <= 1) return poseFor(item.category, layered);
  const base = frame(item.category, layered);
  const columns = Math.ceil(Math.sqrt(peers.length));
  const rows = Math.ceil(peers.length / columns);
  return poseFor(item.category, layered, {
    x:
      base.x + ((index % columns) - (columns - 1) / 2) * (base.width / columns),
    y:
      base.y +
      (Math.floor(index / columns) - (rows - 1) / 2) * (base.height / rows),
    scale: Math.max(0.4, 1 / Math.sqrt(peers.length)),
  });
}
export function readLayouts(userId: string): Record<string, Layout> {
  try {
    const raw = JSON.parse(
      localStorage.getItem(`wardrobe-layouts:${userId}`) || "{}",
    );
    return raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  } catch {
    return {};
  }
}
export function storeLayout(userId: string, outfitId: string, layout: Layout) {
  const all = readLayouts(userId);
  all[outfitId] = layout;
  localStorage.setItem(`wardrobe-layouts:${userId}`, JSON.stringify(all));
}
