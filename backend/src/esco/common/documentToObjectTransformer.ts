import stream, { Readable, Transform } from "node:stream";
import mongoose from "mongoose";
import { getGlobalTransformOptions } from "server/repositoryRegistry/globalTransform";

/**
 * Creates a cursor-based readable stream of plain objects, using only the global transform (no field flattening).
 * Used by findAllWithTranslations in each repository to keep translatable Maps intact for export.
 * @param getCursor - factory that creates the mongoose cursor; called inside a try/catch so construction errors are wrapped.
 * @param errorLabel - label describing translated string, used for errors
 */
export function createTranslationStream<T>(getCursor: () => Readable, errorLabel: string): Readable {
  try {
    const pipeline = stream.pipeline(
      getCursor(),
      new DocumentToObjectTransformer<T>(getGlobalTransformOptions()),
      () => undefined
    );
    pipeline.on("error", (e) => {
      console.error(new Error(`${errorLabel}: stream failed`, { cause: e }));
    });
    return pipeline;
  } catch (e: unknown) {
    throw new Error(`${errorLabel}: findAllWithTranslations failed`, { cause: e });
  }
}

export class DocumentToObjectTransformer<T> extends Transform {
  private readonly toObjectOptions?: mongoose.ToObjectOptions;

  // toObjectOptions passed to .toObject(); the schema's own options are used when absent
  constructor(toObjectOptions?: mongoose.ToObjectOptions) {
    super({ objectMode: true });
    this.toObjectOptions = toObjectOptions;
  }

  _transform(
    document: mongoose.Document<unknown, undefined, T> & T,
    _encoding: BufferEncoding,
    callback: (error?: Error | null, data?: never) => void
  ): void {
    try {
      this.push(document.toObject(this.toObjectOptions));
      callback();
    } catch (error: unknown) {
      callback(error as Error);
    }
  }
}
