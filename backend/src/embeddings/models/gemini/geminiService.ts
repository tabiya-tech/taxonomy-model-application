import { IEmbeddingModelService } from "embeddings/models/modelsServiceTypes";

/**
 * Base URL of the Gemini (Generative Language) REST API.
 */
export const GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

/**
 * The maximum number of texts that can be embedded in a single batchEmbedContents request (Gemini hard limit).
 * reference: https://ai.google.dev/api/embeddings#method:-models.batchembedcontents
 */
export const GEMINI_MAX_BATCH_SIZE = 100;

/**
 * The shape of a successful batchEmbedContents response.
 */
interface IBatchEmbedContentsResponse {
  embeddings?: { values?: number[] }[];
}

export const TaskType = "RETRIEVAL_QUERY";

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
  private readonly outputDimensionality: number;

  constructor(apiKey: string, model: string, outputDimensionality: number) {
    if (!apiKey) {
      throw new Error("GeminiService: GEMINI_API_KEY is not configured");
    }
    this.apiKey = apiKey;

    if (!model)
      throw new Error(
        "GeminiService: GEMINI_MODEL_NAME is not configured. Please set it in the environment variables or in the config file."
      );
    this.model = model;

    if (!outputDimensionality || outputDimensionality <= 0)
      throw new Error(
        "GeminiService: GEMINI_OUTPUT_DIMENSIONALITY is not configured. Please set it in the environment variables or in the config file."
      );

    this.outputDimensionality = outputDimensionality;
  }

  async generateEmbeddingBatch(texts: string[]): Promise<number[][]> {
    const vectors: number[][] = [];
    // Gemini embeds the texts in batches via batchEmbedContents, which accepts at most
    // GEMINI_MAX_BATCH_SIZE texts per request, so larger inputs are chunked into multiple requests.
    for (let i = 0; i < texts.length; i += GEMINI_MAX_BATCH_SIZE) {
      const chunk = texts.slice(i, i + GEMINI_MAX_BATCH_SIZE);
      vectors.push(...(await this.batchEmbedContents(chunk)));
    }
    return vectors;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const [vector] = await this.generateEmbeddingBatch([text]);
    return vector;
  }

  private async batchEmbedContents(texts: string[]): Promise<number[][]> {
    let response: Response;
    try {
      response = await fetch(`${GEMINI_API_BASE_URL}/${this.model}:batchEmbedContents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // The API key is passed as a header instead of a query parameter,
          // so that it does not leak into logs that record the request URL.
          "x-goog-api-key": this.apiKey,
        },
        body: JSON.stringify({
          requests: texts.map((text) => ({
            outputDimensionality: this.outputDimensionality,
            taskType: TaskType,
            model: this.model,
            content: { parts: [{ text }] },
          })),
        }),
      });
    } catch (e: unknown) {
      throw new Error("GeminiService.batchEmbedContents: the request to the Gemini API failed", { cause: e });
    }

    if (!response.ok) {
      const responseBody = await response.text();
      throw new Error(
        `GeminiService.batchEmbedContents: the Gemini API responded with status ${response.status}: ${responseBody}`
      );
    }

    const payload = (await response.json()) as IBatchEmbedContentsResponse;
    const embeddings = payload.embeddings;
    if (!Array.isArray(embeddings) || embeddings.length !== texts.length) {
      throw new Error(
        `GeminiService.batchEmbedContents: the Gemini API returned ${embeddings?.length ?? 0} embeddings for ${
          texts.length
        } texts`
      );
    }

    return embeddings.map((embedding, index) => {
      const values = embedding?.values;
      if (!Array.isArray(values) || values.length === 0) {
        throw new Error(
          `GeminiService.batchEmbedContents: the Gemini API returned an empty embedding at index ${index}`
        );
      }
      return values;
    });
  }
}
