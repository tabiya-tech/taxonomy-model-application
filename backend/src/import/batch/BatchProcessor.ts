export class BatchProcessor<T> {
  private readonly batchSize: number;
  private array: T[];
  private readonly processFn: (batch: T[]) => Promise<void>;

  constructor(batchSize: number, processFn: (batch: T[]) => Promise<void>) {
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