export type ProcessBatchFunction<T> = (batch: T[]) => Promise<void>;
export class BatchProcessor<T> {
  private readonly batchSize: number;
  private array: T[];
  private readonly processFn: ProcessBatchFunction<T>;

  constructor(batchSize: number, processFn: ProcessBatchFunction<T>) {
    this.batchSize = batchSize;
    this.array = [];
    this.processFn = processFn;
  }

  public async add(element: T): Promise<void> {
    this.array.push(element);
    if (this.array.length === this.batchSize) {
      await this.flush();
    }
  }

  public async flush(): Promise<void> {
    if (this.array.length > 0) {
      try {
        await this.processFn(this.array);
      } catch (e: unknown) {
        console.warn("BatchProcessor.flush() failed", e);
      } finally {
        this.array = [];
      }
    }
  }
}