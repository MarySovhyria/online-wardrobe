import { createClient } from "@supabase/supabase-js";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// Capture callback intent before the auth client consumes the URL fragment.
const callbackUrl =
  typeof window !== "undefined" ? new URL(window.location.href) : null;
const callbackHash = new URLSearchParams(callbackUrl?.hash.slice(1));
export const authCallback = {
  recovery:
    callbackUrl?.searchParams.get("recovery") === "1" ||
    callbackHash.get("type") === "recovery",
  error:
    callbackHash.get("error_description") ||
    callbackUrl?.searchParams.get("error_description") ||
    callbackHash.get("error") ||
    callbackUrl?.searchParams.get("error") ||
    "",
};
export const supabase =
  url && key && !url.includes("your-project") ? createClient(url, key) : null;
export const categories = ["top", "bottom", "jacket", "shoes"] as const;
export type Category = (typeof categories)[number];
export const labels: Record<Category, string> = {
  top: "Tops",
  bottom: "Bottoms",
  jacket: "Jackets",
  shoes: "Shoes",
};
export type Clothing = {
  id: string;
  user_id: string;
  name: string;
  category: Category;
  color: string | null;
  image_path: string;
  created_at: string;
  url?: string;
};
export type Outfit = {
  id: string;
  name: string;
  created_at: string;
  outfit_items: { clothing_item_id: string; slot: Category }[];
};
export async function preparePhoto(file: File): Promise<Blob> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw new Error(
      "Choose a JPEG, PNG, or WebP image. For HEIC photos, export as JPEG first.",
    );
  if (file.size > 10 * 1024 * 1024)
    throw new Error("Please choose a photo smaller than 10 MB.");
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Your browser could not process this image.");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (blob) =>
          blob
            ? resolve(blob)
            : reject(new Error("Could not process this photo.")),
        "image/webp",
        0.88,
      ),
    );
  } finally {
    bitmap.close();
  }
}
