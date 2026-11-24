"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Upload } from "lucide-react";
import { preparePhoto } from "@/lib/supabase";
import { removeBackground } from "@/lib/background-removal";
import {
  lightPhoto,
  readPhoto,
  suggestLighting,
  neutralLighting,
  type PhotoAdjustments,
} from "@/lib/photo-lighting";

export type PhotoChoice = { photo: Blob | null; hasReplacement: boolean };
type Props = {
  existingUrl?: string;
  disabled: boolean;
  onChange: (choice: PhotoChoice) => void;
};
const errorMessage = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "Could not prepare the photo. Please try again.";
function usePhotoUrl(photo: Blob | null) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    if (!photo) {
      setUrl("");
      return;
    }
    const value = URL.createObjectURL(photo);
    setUrl(value);
    return () => URL.revokeObjectURL(value);
  }, [photo]);
  return url;
}
export function PhotoPreparation({ existingUrl, disabled, onChange }: Props) {
  const [source, setSource] = useState<Blob | null>(null);
  const [base, setBase] = useState<Blob | null>(null);
  const [result, setResult] = useState<Blob | null>(null);
  const [remove, setRemove] = useState(false);
  const [adjustments, setAdjustments] = useState<PhotoAdjustments>({
    ...neutralLighting,
  });
  const [processing, setProcessing] = useState(false);
  const [phase, setPhase] = useState("");
  const [error, setError] = useState("");
  const [backgroundError, setBackgroundError] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [compare, setCompare] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const generation = useRef(0);
  const editRevision = useRef(0);
  const sourceUrl = usePhotoUrl(source);
  const resultUrl = usePhotoUrl(result);
  useEffect(
    () => () => {
      generation.current++;
      editRevision.current++;
    },
    [],
  );
  function invalidate() {
    editRevision.current++;
    setAccepted(false);
    setResult(null);
    setProcessing(true);
    onChange({ photo: null, hasReplacement: true });
  }
  async function choose(file?: File) {
    if (!file || disabled) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 10 * 1024 * 1024
    ) {
      setError(
        "Choose a JPEG, PNG, or WebP image smaller than 10 MB. Export HEIC photos as JPEG first.",
      );
      return;
    }
    const revision = ++generation.current;
    invalidate();
    setSource(null);
    setBase(null);
    setRemove(false);
    setCompare(false);
    setAdjustments({ ...neutralLighting });
    setError("");
    setBackgroundError("");
    setPhase("Preparing photo…");
    try {
      const prepared = await preparePhoto(file);
      if (generation.current !== revision) return;
      setSource(prepared);
    } catch (error) {
      if (generation.current === revision) {
        setError(errorMessage(error));
        setProcessing(false);
        setPhase("");
      }
    }
  }
  useEffect(() => {
    if (!source) return;
    const controller = new AbortController();
    let current = true;
    setBase(null);
    setBackgroundError("");
    setProcessing(true);
    if (!remove) {
      setBase(source);
      return;
    }
    setPhase("Loading background removal…");
    const timeout = setTimeout(() => controller.abort(), 120_000);
    removeBackground(
      source,
      (status) => {
        if (current) setPhase(status);
      },
      controller.signal,
    )
      .then((photo) => {
        if (current) setBase(photo);
      })
      .catch((error) => {
        if (!current) return;
        setBackgroundError(
          controller.signal.aborted
            ? "Background removal took too long. Retry or keep the background."
            : `${errorMessage(error)} Retry or keep the background.`,
        );
        setProcessing(false);
        setPhase("");
      })
      .finally(() => clearTimeout(timeout));
    return () => {
      current = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [source, remove, attempt]);
  useEffect(() => {
    if (!base) return;
    let current = true;
    const revision = editRevision.current;
    setProcessing(true);
    setPhase("Updating preview…");
    const timer = setTimeout(() => {
      lightPhoto(base, adjustments)
        .then((photo) => {
          if (current && revision === editRevision.current) {
            setResult(photo);
            setProcessing(false);
            setPhase("");
          }
        })
        .catch((error) => {
          if (current && revision === editRevision.current) {
            setError(errorMessage(error));
            setProcessing(false);
            setPhase("");
          }
        });
    }, 60);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [base, adjustments]);
  function changeLighting(next: PhotoAdjustments) {
    invalidate();
    setError("");
    setAdjustments(next);
  }
  async function autoLight() {
    if (!base || disabled || processing) return;
    const revision = editRevision.current;
    try {
      const { pixels } = await readPhoto(base);
      if (revision === editRevision.current)
        changeLighting(suggestLighting(pixels.data));
    } catch (error) {
      setError(errorMessage(error));
    }
  }
  const displayed = compare ? sourceUrl : resultUrl || sourceUrl || existingUrl;
  return (
    <div className="editor-preview">
      <label
        className="upload-zone"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          void choose(e.dataTransfer.files[0]);
        }}
      >
        {displayed ? (
          <img
            className={`upload-preview${remove && result && !compare ? " cutout-preview" : ""}`}
            src={displayed}
            alt={
              compare
                ? "Prepared original clothing photo"
                : source
                  ? "Clothing photo preview"
                  : "Saved clothing photo"
            }
          />
        ) : (
          <>
            <Upload size={40} strokeWidth={1} />
            <h2>A new favorite?</h2>
            <p>
              Tap to choose a photo
              <br />
              or drop one here.
            </p>
          </>
        )}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          aria-label={
            existingUrl ? "Replace clothing photo" : "Choose clothing photo"
          }
          disabled={disabled}
          onChange={(e) => {
            void choose(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <span className="button secondary">
          {displayed ? "Choose another photo" : "Choose photo"}
        </span>
      </label>
      <p className="subtitle">
        Use one upright clothing item photographed without a person. A pair of
        shoes is fine.
        <br />
        JPEG, PNG or WebP · Up to 10 MB
      </p>
      {source && (
        <div className="cutout-controls form-stack">
          <label className="photo-background-choice">
            <input
              type="checkbox"
              checked={remove}
              disabled={disabled}
              onChange={(e) => {
                invalidate();
                setRemove(e.target.checked);
              }}
            />{" "}
            Remove background
          </label>
          <p className="subtitle">
            Photo processing stays on this device. Background removal downloads
            a small model on first use. Check fine edges before saving.
          </p>
          {backgroundError && (
            <div className="notice error" role="alert">
              <p>{backgroundError}</p>
              <div className="form-row">
                <button
                  type="button"
                  className="button secondary"
                  disabled={disabled}
                  onClick={() => {
                    invalidate();
                    setAttempt((value) => value + 1);
                  }}
                >
                  Retry background removal
                </button>
                <button
                  type="button"
                  className="button secondary"
                  disabled={disabled}
                  onClick={() => {
                    invalidate();
                    setRemove(false);
                  }}
                >
                  Keep background
                </button>
              </div>
            </div>
          )}
          {remove && processing && !base && (
            <button
              type="button"
              className="inline-link"
              disabled={disabled}
              onClick={() => {
                invalidate();
                setRemove(false);
              }}
            >
              Cancel removal · keep background
            </button>
          )}
          <div className="form-row">
            <button
              type="button"
              className="button secondary"
              disabled={disabled || processing || !base}
              onClick={autoLight}
            >
              Auto light
            </button>
            <button
              type="button"
              className="button secondary"
              disabled={disabled || !base}
              onClick={() => changeLighting({ ...neutralLighting })}
            >
              Reset lighting
            </button>
          </div>
          {(["brightness", "contrast", "shadows"] as const).map((key) => (
            <label className="field" key={key}>
              {key[0].toUpperCase() + key.slice(1)}{" "}
              <span>{adjustments[key]}</span>
              <input
                aria-label={key[0].toUpperCase() + key.slice(1)}
                type="range"
                min={key === "shadows" ? 0 : -30}
                max={key === "shadows" ? 40 : 30}
                step="1"
                value={adjustments[key]}
                disabled={disabled || !base}
                onChange={(e) =>
                  changeLighting({
                    ...adjustments,
                    [key]: Number(e.target.value),
                  })
                }
              />
            </label>
          ))}
          <p className="subtitle">
            Lighting changes are optional. Auto light is a gentle starting
            point; compare the color with your clothing. This does not remove
            folds or recreate fabric.
          </p>
          <div className="form-row">
            <button
              type="button"
              className="button secondary"
              disabled={disabled || !source}
              aria-pressed={compare}
              onClick={() => setCompare((value) => !value)}
            >
              {compare ? "Show edited photo" : "Compare original"}
            </button>
            <button
              type="button"
              className="button primary"
              disabled={disabled || processing || !result || accepted}
              onClick={() => {
                if (result && !processing) {
                  setAccepted(true);
                  onChange({ photo: result, hasReplacement: true });
                }
              }}
            >
              <Check size={18} />
              {accepted ? "Photo ready to save" : "Use this photo"}
            </button>
          </div>
          <p className="subtitle" role="status" aria-live="polite">
            {processing
              ? phase
              : compare
                ? "Showing the prepared original. Use this photo accepts the edited result."
                : accepted
                  ? "Edited photo accepted. Add the details and save."
                  : result
                    ? "Review the edited photo, then choose Use this photo."
                    : error
                      ? "Photo not ready. Reset lighting or choose another photo to continue."
                      : "Choose Retry or Keep background to continue."}
          </p>
        </div>
      )}
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      {!source && processing && (
        <p className="subtitle" role="status">
          {phase}
        </p>
      )}
    </div>
  );
}
