import fs from "fs";
import path from "path";
import { createHash } from "crypto";
import EmbeddingsAPISpecs from "api-specifications/embeddings";
import { IEmbeddingModelService } from "embeddings/models/modelsServiceTypes";
import { EmbeddingModelServiceFactory, getEmbeddingModelService } from "embeddings/models/embeddingModelServiceFactory";
import { TaskType } from "embeddings/models/gemini/geminiService";

const MAX_ATTEMPTS = 5;

/**
 * An append-only file of `<md5 of the text>\t<base64 of the float64 vector>` lines, which keeps the vectors exactly
 * as the model returned them.
 */
class EmbeddingDiskCache {
  private readonly vectorsByKey = new Map<string, number[]>();

  constructor(private readonly filePath: string) {
    if (!fs.existsSync(filePath)) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      return;
    }
    for (const line of fs.readFileSync(filePath, "utf-8").split("\n")) {
      const [key, encodedVector] = line.split("\t");
      if (key && encodedVector) {
        const buffer = Buffer.from(encodedVector, "base64");
        const vector = new Float64Array(buffer.buffer, buffer.byteOffset, buffer.byteLength / 8);
        this.vectorsByKey.set(key, Array.from(vector));
      }
    }
  }

  private static getKey(text: string): string {
    return createHash("md5").update(text).digest("hex");
  }

  get(text: string): number[] | undefined {
    return this.vectorsByKey.get(EmbeddingDiskCache.getKey(text));
  }

  set(text: string, vector: number[]): void {
    const key = EmbeddingDiskCache.getKey(text);
    this.vectorsByKey.set(key, vector);
    const encodedVector = Buffer.from(new Float64Array(vector).buffer).toString("base64");
    fs.appendFileSync(this.filePath, `${key}\t${encodedVector}\n`);
  }
}

class CachingEmbeddingModelService implements IEmbeddingModelService {
  constructor(
    private readonly delegate: IEmbeddingModelService,
    private readonly cache: EmbeddingDiskCache
  ) {}

  async generateEmbedding(text: string): Promise<number[]> {
    const [vector] = await this.generateEmbeddingBatch([text]);
    return vector;
  }

  async generateEmbeddingBatch(texts: string[]): Promise<number[][]> {
    const missingTexts = [...new Set(texts.filter((text) => this.cache.get(text) === undefined))];
    if (missingTexts.length > 0) {
      const vectors = await this.generateWithRetry(missingTexts);
      missingTexts.forEach((text, index) => this.cache.set(text, vectors[index]));
    }
    return texts.map((text) => this.cache.get(text)!);
  }

  private async generateWithRetry(texts: string[]): Promise<number[][]> {
    for (let attempt = 1; ; attempt++) {
      try {
        return await this.delegate.generateEmbeddingBatch(texts);
      } catch (e: unknown) {
        // only a rate limit, a server error or a failed request can succeed on retry
        const isRetryable = !/responded with status (?!429|5\d\d)/.test((e as Error)?.message ?? "");
        if (attempt >= MAX_ATTEMPTS || !isRetryable) {
          throw e;
        }
        await new Promise((resolve) => setTimeout(resolve, 2 ** attempt * 1000));
      }
    }
  }
}

/**
 * The real embedding model services behind a disk cache, so that a text is only ever embedded once across runs. A
 * cache file is named after everything that determines a vector, so a change of model never serves stale vectors.
 */
export function getCachingEmbeddingModelServiceFactory(cacheFolder: string): EmbeddingModelServiceFactory {
  const servicesById = new Map<string, IEmbeddingModelService>();
  return (embeddingServiceId: string) => {
    let service = servicesById.get(embeddingServiceId);
    if (!service) {
      const embeddingService = EmbeddingsAPISpecs.Constants.EmbeddingServices.find((s) => s.id === embeddingServiceId);
      const cacheFileName = [
        embeddingServiceId,
        embeddingService?.modelName.replace(/[^\w.-]/g, "_"),
        embeddingService?.numberOfDimensions,
        TaskType,
      ].join("-");
      service = new CachingEmbeddingModelService(
        getEmbeddingModelService(embeddingServiceId),
        new EmbeddingDiskCache(path.join(cacheFolder, `${cacheFileName}.tsv`))
      );
      servicesById.set(embeddingServiceId, service);
    }
    return service;
  };
}
