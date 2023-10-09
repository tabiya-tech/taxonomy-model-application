import { BatchProcessor } from "import/batch/BatchProcessor";
import { HeadersValidatorFunction, RowProcessor } from "./RowProcessor.types";
import { RowsProcessedStats } from "import/rowsProcessedStats.types";

export type TransformRowToSpecificationFunction<RowType, SpecificationType> = (
  row: RowType
) => SpecificationType | undefined | null;

export class BatchRowProcessor<RowType, SpecificationType> implements RowProcessor<RowType> {
  private readonly batchProcessor: BatchProcessor<SpecificationType>;
  private readonly transformRowToSpecificationFn: TransformRowToSpecificationFunction<RowType, SpecificationType>;
  private readonly validateHeadersFn: HeadersValidatorFunction;

  constructor(
    validateHeadersFn: HeadersValidatorFunction,
    transformRowToSpecificationFn: TransformRowToSpecificationFunction<RowType, SpecificationType>,
    batchProcessor: BatchProcessor<SpecificationType>
  ) {
    this.validateHeadersFn = validateHeadersFn;
    this.batchProcessor = batchProcessor;
    this.transformRowToSpecificationFn = transformRowToSpecificationFn;
  }

  async completed(): Promise<RowsProcessedStats> {
    await this.batchProcessor.flush();
    return this.batchProcessor.getStats();
  }

  async processRow(row: RowType /*index: number*/): Promise<void> {
    const spec = this.transformRowToSpecificationFn(row);
    if (spec !== undefined && spec !== null) {
      return await this.batchProcessor.add(spec);
    }
  }

  validateHeaders(actualHeaders: string[]): Promise<boolean> {
    return this.validateHeadersFn(actualHeaders);
  }
}
