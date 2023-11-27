import { Transform } from "stream";
import mongoose from "mongoose";

export class DocumentToObjectTransformer<T> extends Transform {
  constructor() {
    super({ objectMode: true });
  }

  _transform(
    document: mongoose.Document<unknown, undefined, T> & T,
    _encoding: BufferEncoding,
    callback: (error?: Error | null, data?: never) => void
  ): void {
    try {
      this.push(document.toObject());
      callback();
    } catch (error: unknown) {
      callback(error as Error);
    }
  }
}
