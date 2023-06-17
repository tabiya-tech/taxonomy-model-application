import {BatchRowProcessor, TransformRowToSpecificationFunction} from "./BatchRowProcessor";
import {HeadersValidatorFunction} from "./RowProcessor.types";
import {BatchProcessor} from "import/batch/BatchProcessor";

describe("test the BatchRowProcesses", () => {

  test("should construct new instance", () => {
    const batchRowProcessor = new BatchRowProcessor<any, any>(
      jest.fn(),
      jest.fn(),
      {} as BatchProcessor<any>
    );
    expect(batchRowProcessor).toBeDefined();
  })

  test("should validate the row", async () => {
    // GIVEN a header validator
    const givenValidatorFn: HeadersValidatorFunction = jest.fn().mockResolvedValue(true);
    // AND a batch row processor with the validator
    const batchRowProcessor = new BatchRowProcessor<any, any>(
      givenValidatorFn,
      jest.fn(),
      new BatchProcessor<any>(1000, jest.fn())
    );
    // AND some headers
    const givenHeaders = ["foo", "bar"];

    // WHEN some headers are validated
    await batchRowProcessor.validateHeaders(givenHeaders);

    // THEN expect the validator to have been called with the headers
    expect(givenValidatorFn).toBeCalledWith(givenHeaders);
  })

  test("should process the row", async () => {
    // GIVEN a row
    const givenRow = {foo: "foo"};
    // AND a transform function
    const givenTransformedRow = {bar: "bar"};
    const givenTransformFn: TransformRowToSpecificationFunction<any, any> = jest.fn().mockReturnValue(givenTransformedRow);
    // AND a batch processor
    const givenBatchProcessor = new BatchProcessor<any>(1000, jest.fn());
    jest.spyOn(givenBatchProcessor, "add");
    // AND a batch row processor with the validator
    const batchRowProcessor = new BatchRowProcessor<any, any>(
      jest.fn(),
      givenTransformFn,
      givenBatchProcessor
    );

    // WHEN a row is processed
    await batchRowProcessor.processRow(givenRow);

    // THEN expect the transform function to have been called with the row
    expect(givenTransformFn).toBeCalledWith(givenRow);
    // AND expect the batch processor to have been called with the transformed row
    expect(givenBatchProcessor.add).toBeCalledWith(givenTransformedRow);

  });

  test("should complete", async () => {
    // GIVEN a batch processor
    const givenBatchProcessor = new BatchProcessor<any>(1000, jest.fn());
    jest.spyOn(givenBatchProcessor, "flush");
    // AND a batch row processor
    const batchRowProcessor = new BatchRowProcessor<any, any>(
      jest.fn(),
      jest.fn(),
      givenBatchProcessor
    );
    // AND some rows
    const givenRows = [{foo: "foo"}, {bar: "bar"}];
    // AND the rows are processed
    for (const row of givenRows) {
      await batchRowProcessor.processRow(row);
    }

    // WHEN the batch row processor is completed
    const actualRowsCount = await batchRowProcessor.completed();

    // THEN expect the batch processor to be flushed
    expect(givenBatchProcessor.flush).toBeCalled();
    // AND expect the number of rows to be returned
    expect(actualRowsCount).toBe(givenRows.length);
  });
});