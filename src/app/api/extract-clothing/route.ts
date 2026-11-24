import { verifyAIUser } from "@/lib/verify-ai-user";
import { createExtractionHandler } from "@/lib/extraction-handler";
import { runLocalExtraction } from "@/lib/local-extraction";

export const runtime = "nodejs";
export const maxDuration = 240;
export const POST = createExtractionHandler({
  verifyUser: verifyAIUser,
  extract: runLocalExtraction,
});
