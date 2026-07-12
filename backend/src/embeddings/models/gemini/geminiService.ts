import { IEmbeddingModelService } from "embeddings/models/modelsServiceTypes";

/**
 * Base URL of the Gemini (Generative Language) REST API.
 */
// const GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

/**
 * GeminiService talks to the Gemini REST API directly via `fetch`
 * (no SDK dependency, so it bundles cleanly with esbuild).
 *
 * See:
 * - https://ai.google.dev/api/embeddings#method:-models.embedcontent
 * - https://ai.google.dev/api/embeddings#method:-models.batchembedcontents
 */
export class GeminiService implements IEmbeddingModelService {
  private readonly apiKey: string;
  private readonly model: string;

  constructor(apiKey: string, model: string) {
    if (!apiKey) {
      throw new Error("GeminiService: GEMINI_API_KEY is not configured");
    }
    this.apiKey = apiKey;

    if (!model)
      throw new Error(
        "GeminiService: GEMINI_MODEL_NAME is not configured. Please set it in the environment variables or in the config file."
      );
    this.model = model;
  }

  async generateEmbeddingBatch(texts: string[]): Promise<number[][]> {
    console.debug("GeminiService: generateEmbeddingBatch", { texts });
    console.warn("Not implemented yet");
    return [[]];
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const [vector] = await this.generateEmbeddingBatch([text]);
    return vector;
  }
}
