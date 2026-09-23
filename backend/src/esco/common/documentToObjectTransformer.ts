import { Transform } from "stream";
import mongoose from "mongoose";

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
