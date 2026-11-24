type Dependencies = {
  verifyUser: (token: string) => Promise<string | null>;
  generate: (
    photo: Buffer,
    piece: string,
  ) => Promise<{ image?: unknown; error?: string }>;
};

const setupMessage =
  "FLUX needs a one-time setup. Run npm run ai:setup:flux in the app folder, then try again.";
function failure(error: string, status: number) {
  return Response.json(
    { error },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export function createFlatlayHandler({ verifyUser, generate }: Dependencies) {
  let busy = false;
  return async function POST(request: Request) {
    const token = request.headers
      .get("authorization")
      ?.match(/^Bearer (.+)$/)?.[1];
    if (!token) return failure("Sign in before creating a flat-lay.", 401);
    try {
      if (!(await verifyUser(token)))
        return failure("Your session expired. Please sign in again.", 401);
    } catch {
      return failure("Could not verify your session. Please try again.", 503);
    }
    const piece = new URL(request.url).searchParams.get("piece");
    if (
      !piece ||
      !["upper", "jacket", "pants", "skirt", "shoes"].includes(piece)
    )
      return failure("Choose a clothing type first.", 400);
    if (request.headers.get("content-type") !== "image/webp")
      return failure("Choose a supported photo and try again.", 415);
    const maxBytes = 3 * 1024 * 1024;
    if (Number(request.headers.get("content-length")) > maxBytes)
      return failure("Choose a smaller photo.", 413);
    if (busy)
      return failure(
        "Another flat-lay is being created. Please try again in a moment.",
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
          return failure("Choose a smaller photo.", 413);
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
      const result = await generate(photo, piece);
      if (result.error === "setup_required") return failure(setupMessage, 503);
      if (result.error === "busy")
        return failure(
          "Another photo is being processed. Please try again in a moment.",
          429,
        );
      if (result.error === "unsupported_platform")
        return failure(
          "Local FLUX currently requires an Apple Silicon Mac.",
          503,
        );
      if (result.error === "invalid_image")
        return failure(
          "Choose a clearer photo at least 32 pixels wide and tall.",
          400,
        );
      if (
        result.error ||
        typeof result.image !== "string" ||
        result.image.length > 6 * 1024 * 1024 ||
        !/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(result.image)
      )
        return failure(
          "FLUX could not finish. Close other memory-heavy apps and try again, or use regular extraction.",
          502,
        );
      return Response.json(
        { image: result.image },
        { headers: { "Cache-Control": "no-store" } },
      );
    } catch (error) {
      if (error instanceof Error && error.message === "setup_required")
        return failure(setupMessage, 503);
      return failure(
        error instanceof Error && error.message === "timeout"
          ? "FLUX exceeded 15 minutes. Close other apps and retry, or use regular extraction."
          : "FLUX could not finish. Close other memory-heavy apps and try again, or use regular extraction.",
        502,
      );
    } finally {
      busy = false;
    }
  };
}
