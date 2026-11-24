"use client";

import { useEffect, useRef, useState } from "react";
import {
  categories,
  labels,
  type Category,
  type Clothing,
} from "../lib/supabase";
import type { Pose } from "../lib/outfit-layout";
import styles from "./mobile-outfit-tools.module.css";

type Props = {
  items: Clothing[];
  selectedIds: string[];
  selectedItems: Clothing[];
  activeId?: string;
  activePose: Pose;
  category: Category;
  onCategory: (category: Category) => void;
  onSelect: (id: string) => void;
  onToggle: (item: Clothing) => void;
  onRemove: (id: string) => void;
  onPose: (id: string, pose: Pose) => void;
  onReset: (id: string) => void;
  onAdd: () => void;
  onPickerChange: (open: boolean) => void;
  disabled: boolean;
};

export function MobileOutfitTools(props: Props) {
  const {
    items,
    selectedIds,
    selectedItems,
    activeId,
    activePose,
    category,
    onCategory,
    onSelect,
    onToggle,
    onRemove,
    onPose,
    onReset,
    onAdd,
    onPickerChange,
    disabled,
  } = props;
  const [open, setOpen] = useState(false);
  const [tool, setTool] = useState<"rotate" | "size" | "actions">("rotate");
  const dialog = useRef<HTMLDialogElement>(null);
  const pieceList = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const categoryRef = useRef(category);
  const notifyRef = useRef(onPickerChange);
  categoryRef.current = category;
  notifyRef.current = onPickerChange;

  useEffect(() => setTool("rotate"), [activeId]);
  useEffect(() => {
    if (open && pieceList.current) pieceList.current.scrollTop = 0;
  }, [open, category]);
  useEffect(() => {
    if (!open) return;
    const modal = dialog.current;
    if (!modal) return;
    const scrollY = window.scrollY;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    modal.showModal();
    notifyRef.current(true);
    const resize = () => {
      if (window.matchMedia("(min-width: 761px)").matches) setOpen(false);
    };
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      modal.close();
      document.body.style.overflow = previousOverflow;
      notifyRef.current(false);
      window.scrollTo({ top: scrollY, behavior: "instant" });
      const target = window.matchMedia("(min-width: 761px)").matches
        ? document.querySelector<HTMLElement>(
            `[data-studio-category="${categoryRef.current}"]`,
          )
        : opener.current;
      target?.focus({ preventScroll: true });
    };
  }, [open]);

  const chooseCategory = (value: Category, trigger: HTMLButtonElement) => {
    opener.current = trigger;
    onCategory(value);
    setOpen(true);
  };
  const setPose = (patch: Partial<Pose>) => {
    if (activeId) onPose(activeId, { ...activePose, ...patch });
  };
  const active = selectedItems.find((item) => item.id === activeId);
  const visible = items.filter((item) => item.category === category);

  return (
    <div className={styles.mobile}>
      <div className={styles.selected} aria-label="Pieces in this outfit">
        {selectedItems.length ? (
          selectedItems.map((item) => (
            <button
              key={item.id}
              type="button"
              disabled={disabled}
              aria-pressed={activeId === item.id}
              onClick={() => onSelect(item.id)}
            >
              {item.name}
            </button>
          ))
        ) : (
          <span>Choose a category below to add pieces.</span>
        )}
      </div>
      <div
        className={`${styles.controls} ${tool === "rotate" ? styles.rotateControls : ""}`}
      >
        <div className={styles.tools} aria-label="Adjust selected piece">
          {(["rotate", "size", "actions"] as const).map((value) => (
            <button
              type="button"
              key={value}
              disabled={disabled || !active}
              aria-pressed={tool === value}
              onClick={() => setTool(value)}
            >
              {value === "rotate"
                ? "Rotate"
                : value === "size"
                  ? "Size"
                  : "Actions"}
            </button>
          ))}
          {tool === "rotate" &&
            [-90, 90].map((delta) => (
              <button
                type="button"
                key={delta}
                aria-label={`Rotate ${delta < 0 ? "left" : "right"} 90 degrees`}
                disabled={disabled || !active}
                onClick={() =>
                  setPose({
                    rotation: ((activePose.rotation + delta + 540) % 360) - 180,
                  })
                }
              >
                {delta < 0 ? "−90°" : "+90°"}
              </button>
            ))}
        </div>
        <div className={styles.adjustment}>
          {tool === "rotate" && (
            <label>
              <span className={styles.srOnly}>
                Rotation of {active?.name || "selected piece"}
              </span>
              <input
                type="range"
                min="-180"
                max="180"
                step="1"
                aria-label={`Rotation of ${active?.name || "selected piece"}`}
                value={activePose.rotation}
                disabled={disabled || !active}
                onChange={(event) =>
                  setPose({ rotation: Number(event.target.value) })
                }
              />
              <output>{Math.round(activePose.rotation)}°</output>
            </label>
          )}
          {tool === "size" && (
            <label>
              <span className={styles.srOnly}>
                Size of {active?.name || "selected piece"}
              </span>
              <input
                type="range"
                min="0.4"
                max="1.6"
                step="0.01"
                aria-label={`Size of ${active?.name || "selected piece"}`}
                value={activePose.scale}
                disabled={disabled || !active}
                onChange={(event) =>
                  setPose({ scale: Number(event.target.value) })
                }
              />
              <output>{Math.round(activePose.scale * 100)}%</output>
            </label>
          )}
          {tool === "actions" && (
            <div className={styles.actions}>
              <button
                type="button"
                disabled={disabled || !active}
                aria-pressed={activePose.flip}
                onClick={() => setPose({ flip: !activePose.flip })}
              >
                Flip
              </button>
              <button
                type="button"
                disabled={disabled || !activeId}
                onClick={() => activeId && onReset(activeId)}
              >
                Reset
              </button>
              <button
                type="button"
                disabled={disabled || !activeId}
                onClick={() => activeId && onRemove(activeId)}
              >
                Remove
              </button>
            </div>
          )}
        </div>
      </div>
      <div className={styles.categories} aria-label="Add clothing by category">
        {categories.map((value) => (
          <button
            type="button"
            key={value}
            disabled={disabled}
            data-mobile-category={value}
            aria-haspopup="dialog"
            aria-expanded={open && category === value}
            onClick={(event) => chooseCategory(value, event.currentTarget)}
          >
            {labels[value]}
          </button>
        ))}
      </div>
      <dialog
        ref={dialog}
        className={styles.sheet}
        aria-label={`Choose ${labels[category].toLowerCase()}`}
        onCancel={(event) => {
          event.preventDefault();
          setOpen(false);
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) setOpen(false);
        }}
      >
        <div className={styles.sheetContent}>
          <header className={styles.header}>
            <h2>{labels[category]}</h2>
            <button
              type="button"
              aria-label="Close clothing picker"
              onClick={() => setOpen(false)}
            >
              ✕
            </button>
          </header>
          <div className={styles.tabs} aria-label="Clothing categories">
            {categories.map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={category === value}
                onClick={() => onCategory(value)}
              >
                {labels[value]}
              </button>
            ))}
          </div>
          <div ref={pieceList} className={styles.pieces}>
            {visible.length ? (
              visible.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={styles.piece}
                  aria-pressed={selectedIds.includes(item.id)}
                  disabled={disabled}
                  onClick={() => onToggle(item)}
                >
                  {item.url && <img src={item.url} alt="" />}
                  <span>{item.name}</span>
                  <span className={styles.selectionMark}>
                    {selectedIds.includes(item.id) ? "Added ✓" : "Add"}
                  </span>
                </button>
              ))
            ) : (
              <div className={styles.empty}>
                <p>No {labels[category].toLowerCase()} in your wardrobe yet.</p>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    setOpen(false);
                    onAdd();
                  }}
                >
                  Add a piece
                </button>
              </div>
            )}
          </div>
          <footer className={styles.footer}>
            <span>
              {selectedIds.length}{" "}
              {selectedIds.length === 1 ? "piece" : "pieces"} in outfit
            </span>
            <button type="button" onClick={() => setOpen(false)}>
              Done
            </button>
          </footer>
        </div>
      </dialog>
    </div>
  );
}
