import { createFlatlayHandler } from "@/lib/flatlay-handler";
import { runLocalFlatlay } from "@/lib/local-extraction";
import { verifyAIUser } from "@/lib/verify-ai-user";

export const runtime = "nodejs";
export const maxDuration = 960;
export const POST = createFlatlayHandler({
  verifyUser: verifyAIUser,
  generate: runLocalFlatlay,
});
