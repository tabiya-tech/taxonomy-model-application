import {BatchProcessor} from "import/batch/BatchProcessor";
import {HeadersValidatorFunction, RowProcessor} from "./RowProcessor.types";

export type TransformRowToSpecificationFunction<RowType, SpecificationType> = (row: RowType) => SpecificationType | undefined | null;

export class BatchRowProcessor<RowType, SpecificationType> implements RowProcessor<RowType> {
  private readonly batchProcessor: BatchProcessor<SpecificationType>;
  private readonly transformRowToSpecificationFn: TransformRowToSpecificationFunction<RowType, SpecificationType>;
  private readonly validateHeadersFn: HeadersValidatorFunction;
  private rowCounter = 0;

  constructor(validateHeadersFn: HeadersValidatorFunction,
              transformRowToSpecificationFn: TransformRowToSpecificationFunction<RowType, SpecificationType>,
              batchProcessor: BatchProcessor<SpecificationType>,//processBatchFn: ProcessBatchFunction<SpecificationType>,
  ) {
    this.validateHeadersFn = validateHeadersFn;
    this.batchProcessor = batchProcessor; //new BatchProcessor<SpecificationType>(batchSize, processBatchFn);
    this.transformRowToSpecificationFn = transformRowToSpecificationFn;
  }

  async completed(): Promise<number> {
    await this.batchProcessor.flush();
    return this.rowCounter;
  }

  async processRow(row: RowType): Promise<void> {
    this.rowCounter++;
    const spec = this.transformRowToSpecificationFn(row);
    if (spec !== undefined && spec !== null) {
      return await this.batchProcessor.add(spec);
    }
  }

  validateHeaders(actualHeaders: string[]): Promise<boolean> {
    return this.validateHeadersFn(actualHeaders);
  }
}