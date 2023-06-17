
export type CompletedFunction = () => Promise<number>;
export type RowProcessorFunction<RowType> = (row: RowType, index: number) => Promise<void>;
export type HeadersValidatorFunction = (actualHeaders: string[]) => Promise<boolean>;

export interface RowProcessor<RowType> {
  validateHeaders: HeadersValidatorFunction,
  processRow: RowProcessorFunction<RowType>,
  completed: CompletedFunction
}