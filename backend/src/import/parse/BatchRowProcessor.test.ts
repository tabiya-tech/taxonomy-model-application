import { BatchRowProcessor, TransformRowToSpecificationFunction } from "./BatchRowProcessor";
import { HeadersValidatorFunction } from "./RowProcessor.types";
import { BatchProcessor, ProcessBatchFunction } from "import/batch/BatchProcessor";

function getTestBatchProcessor() {
  const mockProcessFn: ProcessBatchFunction<never> = jest.fn().mockImplementation((batch: never[]) => {
    return Promise.resolve({
      rowsProcessed: batch.length,
      rowsSuccess: batch.length,
      rowsFailed: 0,
    });
  });
  return new BatchProcessor<never>(1000, mockProcessFn);
}

describe("test the BatchRowProcesses", () => {
  test("should construct a new instance", () => {
    const batchRowProcessor = new BatchRowProcessor<never, never>(jest.fn(), jest.fn(), {} as BatchProcessor<never>);
    expect(batchRowProcessor).toBeDefined();
  });

  test("should validate the headers", async () => {
    // GIVEN a header validator function
    const givenValidatorFn: HeadersValidatorFunction = jest.fn().mockResolvedValue(true);
    // AND a batch row processor with the validator
    const givenBatchRowProcessor = new BatchRowProcessor<never, never>(
      givenValidatorFn,
      jest.fn(),
      getTestBatchProcessor()
    );
    // AND some headers
    const givenHeaders = ["foo", "bar"];

    // WHEN validating some headers
    await givenBatchRowProcessor.validateHeaders(givenHeaders);

    // THEN expect the validator to be called with the headers
    expect(givenValidatorFn).toBeCalledWith(givenHeaders);
  });

  test("should process the row", async () => {
    // GIVEN a row
    const givenRow = { foo: "foo" };
    // AND a transform function
    const givenTransformedRow = { bar: "bar" };
    const givenTransformFn: TransformRowToSpecificationFunction<never, never> = jest
      .fn()
      .mockReturnValue(givenTransformedRow);
    // AND a batch processor
    const givenBatchProcessor = getTestBatchProcessor();
    jest.spyOn(givenBatchProcessor, "add");
    // AND a batch row processor
    const givenBatchRowProcessor = new BatchRowProcessor<never, never>(
      jest.fn(),
      givenTransformFn,
      givenBatchProcessor
    );

    // WHEN processing the given row
    await givenBatchRowProcessor.processRow(givenRow as never);

    // THEN expect the transform function to be called with the row
    expect(givenTransformFn).toBeCalledWith(givenRow);
    // AND expect the batch processor to be called with the transformed row
    expect(givenBatchProcessor.add).toBeCalledWith(givenTransformedRow);
  });

  test.each([null, undefined])("should skip rows that are transformed to %s ", async (transformedRow) => {
    // GIVEN a row
    const givenRow = { foo: "foo" };
    // AND a transform function that will return the transformed row
    const givenTransformFn: TransformRowToSpecificationFunction<never, never> = jest
      .fn()
      .mockReturnValue(transformedRow);
    // AND a batch processor
    const givenBatchProcessor = getTestBatchProcessor();
    jest.spyOn(givenBatchProcessor, "add");
    // AND a batch row processor
    const givenBatchRowProcessor = new BatchRowProcessor<never, never>(
      jest.fn(),
      givenTransformFn,
      givenBatchProcessor
    );

    // WHEN processing the given row
    await givenBatchRowProcessor.processRow(givenRow as never);

    // THEN expect the transform function to be called with the given row
    expect(givenTransformFn).toBeCalledWith(givenRow);
    // AND the batch processor to not be called with the transformed row
    expect(givenBatchProcessor.add).not.toHaveBeenCalled();
  });

  test("should complete", async () => {
    // GIVEN a batch processor
    const givenBatchProcessor = getTestBatchProcessor();
    jest.spyOn(givenBatchProcessor, "flush");

    // AND a batch row processor
    const givenBatchRowProcessor = new BatchRowProcessor<never, never>(jest.fn(), jest.fn(), givenBatchProcessor);
    // AND the rows are processed
    const givenRows = [{ foo: "foo" }, { bar: "bar" }];
    for (const row of givenRows) {
      await givenBatchRowProcessor.processRow(row as never);
    }

    // WHEN the batch row processor is completed
    await givenBatchRowProcessor.completed();

    // THEN expect the batch processor to be flushed
    expect(givenBatchProcessor.flush).toBeCalled();
  });

  test("should return the correct stats", async () => {
    // GIVEN X+Y rows
    const givenX = 2;
    const givenY = 3;
    const givenRows = [];
    for (let i = 0; i < givenX + givenY; i++) {
      givenRows.push({ foo: "foo" + i });
    }
    // AND a TransformFn that will return X non-null rows
    // AND Y rows that are null
    let count = 0;
    const givenTransformFn: TransformRowToSpecificationFunction<never, never> = jest.fn().mockImplementation(() => {
      if (count++ < givenX) {
        return { bar: "bar" + count };
      }
      return null;
    });

    // AND a batch processor that will process all the rows that it is given
    const givenBatchProcessor = getTestBatchProcessor();
    // AND a batch row processor
    const givenBatchRowProcessor = new BatchRowProcessor<never, never>(
      jest.fn(),
      givenTransformFn,
      givenBatchProcessor
    );

    // WHEN all the rows are processed
    for (const row of givenRows) {
      await givenBatchRowProcessor.processRow(row as never);
    }

    // AND  the batch row processor is completed
    const actualStats = await givenBatchRowProcessor.completed();

    // THEN expect the stats to be correct
    expect(actualStats).toEqual({
      rowsProcessed: givenX + givenY,
      rowsSuccess: givenX,
      rowsFailed: givenY,
    });
  });
});
