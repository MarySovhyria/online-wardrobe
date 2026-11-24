"use client";
import { useRef } from "react";
import type { Clothing } from "@/lib/supabase";
import {
  orderedItems,
  itemPose,
  hasOuterwear,
  frame,
  poseFor,
  type Layout,
  type Pose,
} from "@/lib/outfit-layout";

type Props = {
  items: Clothing[];
  layout: Layout;
  active?: string;
  onSelect?: (slot: string) => void;
  onChange?: (slot: string, pose: Pose) => void;
};
export function OutfitCollage({
  items,
  layout,
  active,
  onSelect,
  onChange,
}: Props) {
  const board = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    slot: string;
    x: number;
    y: number;
    pose: Pose;
  } | null>(null);
  const hasJacket = hasOuterwear(items);
  return (
    <div
      ref={board}
      className={`collage-board ${onChange ? "editable" : ""}`}
      aria-label="Outfit collage"
    >
      {orderedItems(items).map((item) => {
        const slot = item.id;
        const box = frame(item.category, hasJacket);
        const pose = itemPose(item, items, layout);
        const style = {
          left: `${pose.x}%`,
          top: `${pose.y}%`,
          width: `${box.width}%`,
          height: `${box.height}%`,
          transform: `translate(-50%, -50%) rotate(${pose.rotation}deg) scale(${pose.scale})`,
        };
        const picture = (
          <img
            src={item.url}
            alt={item.name}
            draggable={false}
            style={{ transform: pose.flip ? "scaleX(-1)" : undefined }}
          />
        );
        return onChange ? (
          <button
            type="button"
            key={slot}
            className={`collage-piece ${active === slot ? "active" : ""}`}
            style={style}
            aria-label={`Position ${item.name}. Use arrow keys to move.`}
            aria-pressed={active === slot}
            onClick={() => onSelect?.(slot)}
            onFocus={() => onSelect?.(slot)}
            onPointerDown={(event) => {
              if (event.button !== 0) return;
              onSelect?.(slot);
              drag.current = { slot, x: event.clientX, y: event.clientY, pose };
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onPointerMove={(event) => {
              const start = drag.current;
              const rect = board.current?.getBoundingClientRect();
              if (!start || start.slot !== slot || !rect) return;
              onChange(
                slot,
                poseFor(item.category, hasJacket, {
                  ...start.pose,
                  x:
                    start.pose.x +
                    ((event.clientX - start.x) / rect.width) * 100,
                  y:
                    start.pose.y +
                    ((event.clientY - start.y) / rect.height) * 100,
                }),
              );
            }}
            onPointerUp={() => {
              drag.current = null;
            }}
            onPointerCancel={() => {
              drag.current = null;
            }}
            onLostPointerCapture={() => {
              drag.current = null;
            }}
            onKeyDown={(event) => {
              const offsets: Record<string, [number, number]> = {
                ArrowLeft: [-1, 0],
                ArrowRight: [1, 0],
                ArrowUp: [0, -1],
                ArrowDown: [0, 1],
              };
              if (!offsets[event.key]) return;
              event.preventDefault();
              const [x, y] = offsets[event.key];
              const step = event.shiftKey ? 5 : 1;
              onChange(
                slot,
                poseFor(item.category, hasJacket, {
                  ...pose,
                  x: pose.x + x * step,
                  y: pose.y + y * step,
                }),
              );
            }}
          >
            {picture}
          </button>
        ) : (
          <span key={slot} className="collage-piece" style={style}>
            {picture}
          </span>
        );
      })}
      {!items.length && (
        <div className="collage-empty">
          <span className="eyebrow">YOUR NEXT LOOK</span>
          <p>Start with a favorite piece.</p>
          <span>
            Pick clothing from your wardrobe to build a one-page outfit.
          </span>
        </div>
      )}
    </div>
  );
}

export async function downloadCollage(
  items: Clothing[],
  layout: Layout,
  name: string,
) {
  if (!items.length) throw new Error("Choose at least one piece first.");
  const canvas = document.createElement("canvas");
  canvas.width = 1600;
  canvas.height = 2240;
  const context = canvas.getContext("2d");
  if (!context)
    throw new Error("Your browser could not create the outfit image.");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  const hasJacket = hasOuterwear(items);
  for (const item of orderedItems(items)) {
    if (!item.url)
      throw new Error(
        "A clothing photo is unavailable. Refresh the wardrobe and try again.",
      );
    const response = await fetch(item.url, {
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok)
      throw new Error(
        "A clothing photo could not be downloaded. Refresh the wardrobe and try again.",
      );
    const image = await createImageBitmap(await response.blob());
    try {
      const box = frame(item.category, hasJacket),
        pose = itemPose(item, items, layout);
      const fit = Math.min(
        ((box.width / 100) * canvas.width) / image.width,
        ((box.height / 100) * canvas.height) / image.height,
      );
      context.save();
      context.translate(
        (pose.x / 100) * canvas.width,
        (pose.y / 100) * canvas.height,
      );
      context.rotate((pose.rotation * Math.PI) / 180);
      context.scale(pose.scale * (pose.flip ? -1 : 1), pose.scale);
      context.drawImage(
        image,
        (-image.width * fit) / 2,
        (-image.height * fit) / 2,
        image.width * fit,
        image.height * fit,
      );
      context.restore();
    } finally {
      image.close();
    }
  }
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) =>
        b ? resolve(b) : reject(new Error("Could not export your outfit.")),
      "image/png",
    ),
  );
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${(name.trim() || "my-outfit").replace(/[^\p{L}\p{N} _-]/gu, "").slice(0, 80) || "outfit"}.png`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
