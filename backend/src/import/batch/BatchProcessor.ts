import { RowsProcessedStats } from "import/rowsProcessedStats.types";

export type ProcessBatchFunction<T> = (batch: T[]) => Promise<RowsProcessedStats>;

export class BatchProcessor<T> {
  private readonly batchSize: number;
  private array: T[];
  private readonly processFn: ProcessBatchFunction<T>;
  private stats: RowsProcessedStats = {
    rowsProcessed: 0,
    rowsSuccess: 0,
    rowsFailed: 0,
  };

  constructor(batchSize: number, processFn: ProcessBatchFunction<T>) {
    this.batchSize = batchSize;
    this.array = [];
    this.processFn = processFn;
  }

  public getStats(): RowsProcessedStats {
    return this.stats;
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
        const batchStats = await this.processFn(this.array);
        this.stats.rowsProcessed += batchStats.rowsProcessed;
        this.stats.rowsSuccess += batchStats.rowsSuccess;
        this.stats.rowsFailed += batchStats.rowsFailed;
      } catch (e: unknown) {
        const err = new Error("BatchProcessor.flush() failed", { cause: e });
        console.error(err);
      } finally {
        this.array = [];
      }
    }
  }
}
