import {BatchRowProcessor, TransformRowToSpecificationFunction} from "./BatchRowProcessor";
import {HeadersValidatorFunction} from "./RowProcessor.types";
import {BatchProcessor, ProcessBatchFunction} from "import/batch/BatchProcessor";


function getTestBatchProcessor() {
  const mockProcessFn: ProcessBatchFunction<any> = jest.fn().mockImplementation((batch: any[]) => {
      return Promise.resolve({
        rowsProcessed: batch.length,
        rowsSuccess: batch.length,
        rowsFailed: 0
      })
    }
  );
  return new BatchProcessor<any>(1000, mockProcessFn);
}

describe("test the BatchRowProcesses", () => {

  test("should construct new instance", () => {
    const batchRowProcessor = new BatchRowProcessor<any, any>(
      jest.fn(),
      jest.fn(),
      {} as BatchProcessor<any>
    );
    expect(batchRowProcessor).toBeDefined();
  })

  test("should validate the headers", async () => {
    // GIVEN a header validator
    const givenValidatorFn: HeadersValidatorFunction = jest.fn().mockResolvedValue(true);
    // AND a batch row processor with the validator
    const batchRowProcessor = new BatchRowProcessor<any, any>(
      givenValidatorFn,
      jest.fn(),
      getTestBatchProcessor()
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
    const givenBatchProcessor = getTestBatchProcessor();
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

  test.each(
    [null, undefined]
  )("should skip row that are transformed to is %s ", async (transformedRow) => {
    // GIVEN a row
    const givenRow = {foo: "foo"};
    // AND a transform function that will return the transformed row
    const givenTransformFn: TransformRowToSpecificationFunction<any, any> = jest.fn().mockReturnValue(transformedRow);

    // AND a batch processor
    const givenBatchProcessor = getTestBatchProcessor();
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
    // AND expect the batch processor to not have been called with the transformed row
    expect(givenBatchProcessor.add).not.toHaveBeenCalled();
  });


  test("should complete", async () => {
    // GIVEN a batch processor
    const givenBatchProcessor = getTestBatchProcessor();
    jest.spyOn(givenBatchProcessor, "flush");
    // AND it returns some stats
    const givenStats = {
      rowsProcessed: 10,
      rowsSuccess: 9,
      rowsFailed: 1
    }
    jest.spyOn(givenBatchProcessor, "getStats").mockReturnValue(givenStats);
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
    const actualStats = await batchRowProcessor.completed();

    // THEN expect the batch processor to be flushed
    expect(givenBatchProcessor.flush).toBeCalled();
    // AND expect the stats to be returned from the batch processor
    expect(actualStats).toEqual(givenBatchProcessor.getStats());
  });
});