type Dependencies = {
  verifyUser: (token: string) => Promise<string | null>;
  extract: (
    photo: Buffer,
    mode: string,
    piece: string,
  ) => Promise<{ masks?: unknown; error?: string }>;
};
function failure(error: string, status: number) {
  return Response.json(
    { error },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}
export function createExtractionHandler({ verifyUser, extract }: Dependencies) {
  // Only one local model worker at a time to bound CPU and memory use.
  let busy = false;
  return async function POST(request: Request) {
    const token = request.headers
      .get("authorization")
      ?.match(/^Bearer (.+)$/)?.[1];
    if (!token) return failure("Sign in before extracting clothing.", 401);
    try {
      if (!(await verifyUser(token)))
        return failure("Your session expired. Please sign in again.", 401);
    } catch {
      return failure("Could not verify your session. Please try again.", 503);
    }
    const params = new URL(request.url).searchParams;
    const mode = params.get("mode");
    const piece = params.get("piece");
    if (
      !mode ||
      !["worn", "standalone"].includes(mode) ||
      !piece ||
      !["upper", "pants", "skirt", "shoes"].includes(piece)
    )
      return failure("Choose a photo type and a clothing type.", 400);
    if (request.headers.get("content-type") !== "image/webp")
      return failure("Choose a supported photo and try again.", 415);
    const maxBytes = 3 * 1024 * 1024;
    if (Number(request.headers.get("content-length")) > maxBytes)
      return failure(
        "The prepared photo is too large. Choose a smaller photo.",
        413,
      );
    if (busy)
      return failure(
        "Another photo is being processed. Please try again in a moment.",
        429,
      );
    busy = true;
    try {
      const reader = request.body?.getReader();
      if (!reader) return failure("Choose a photo first.", 400);
      const chunks: Uint8Array[] = [];
      let size = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > maxBytes) {
          await reader.cancel();
          return failure(
            "The prepared photo is too large. Choose a smaller photo.",
            413,
          );
        }
        chunks.push(value);
      }
      const photo = Buffer.concat(chunks);
      if (
        photo.length < 12 ||
        photo.toString("ascii", 0, 4) !== "RIFF" ||
        photo.toString("ascii", 8, 12) !== "WEBP"
      )
        return failure(
          "This photo could not be read. Choose another image.",
          400,
        );
      const result = await extract(photo, mode, piece);
      if (result.error === "busy")
        return failure(
          "Another photo is being processed. Please try again in a moment.",
          429,
        );
      if (result.error === "setup_required")
        return failure(
          "Local extraction needs a one-time setup. Run npm run ai:setup in the app folder, then try again.",
          503,
        );
      if (result.error === "no_clothing")
        return failure(
          "No matching clothing found. Check the clothing type or try a clearer photo.",
          422,
        );
      const masks = result.masks;
      if (
        result.error ||
        !Array.isArray(masks) ||
        masks.length !== 1 ||
        !masks.every(
          (mask) =>
            typeof mask === "string" &&
            mask.length < 6 * 1024 * 1024 &&
            /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(mask),
        )
      )
        return failure(
          "Could not extract this clothing. Check the photo type and try a clearer photo.",
          502,
        );
      return Response.json(
        { masks },
        { headers: { "Cache-Control": "no-store" } },
      );
    } catch (error) {
      if (error instanceof Error && error.message === "setup_required")
        return failure(
          "Local extraction needs a one-time setup. Run npm run ai:setup in the app folder, then try again.",
          503,
        );
      return failure(
        error instanceof Error && error.message === "timeout"
          ? "Local extraction took too long. Try a smaller photo."
          : "Local extraction could not finish. Please try again.",
        502,
      );
    } finally {
      busy = false;
    }
  };
}
