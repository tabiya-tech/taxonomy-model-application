import { Transform, TransformCallback } from "stream";

export class ObjectCounterTransform extends Transform {
  private count: number = 0;

  constructor() {
    super({ objectMode: true });
  }

  _transform(chunk: unknown, _encoding: BufferEncoding, callback: TransformCallback): void {
    try {
      this.count++;
      this.push(chunk);
      callback(); // Always call callback after processing a chunk
    } catch (e: unknown) {
      // Proper error handling for streams
      callback(e as Error);
    }
  }

  getObjectCount(): number {
    return this.count;
  }

  _flush(callback: TransformCallback): void {
    callback();
  }
}
