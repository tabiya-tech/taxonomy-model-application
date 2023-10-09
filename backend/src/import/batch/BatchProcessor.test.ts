// mute the console.log output
import "_test_utilities/consoleMock";

import { BatchProcessor, ProcessBatchFunction } from "./BatchProcessor";
import { RowsProcessedStats } from "import/rowsProcessedStats.types";

describe("test the BatchProcessor", () => {
  function getBatchProcessor() {
    // GIVEN a process function that returns some stats
    const givenMockProcessFn: ProcessBatchFunction<any> = jest.fn().mockImplementation((batch: any[]) => {
      return Promise.resolve({
        rowsProcessed: batch.length,
        rowsSuccess: batch.length,
        rowsFailed: 0,
      });
    });
    // AND some batch size
    const givenBatchSize: number = 3;
    // AND a batch processor with the given batch size and a process function
    const givenBatchProcessor = new BatchProcessor<Object>(givenBatchSize, givenMockProcessFn);
    return { givenBatchProcessor, givenMockProcessFn, givenBatchSize };
  }

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should report stats correctly", async () => {
    // GIVEN a row process Function that returns some stats
    const givenMockProcessFn: ProcessBatchFunction<Object> = jest.fn().mockImplementation(
      (
        batch: {
          foo: number;
        }[]
      ) => {
        return Promise.resolve({
          rowsProcessed: batch.length,
          rowsSuccess: batch.length - 1,
          rowsFailed: 1,
        });
      }
    );
    // AND a batch processor with a batch size of 3 and the process function
    const givenBatchSize: number = 3;
    const givenBatchProcessor = new BatchProcessor<Object>(givenBatchSize, givenMockProcessFn);

    // WHEN 7 elements are added to the batch processor
    for (let i = 0; i < 2 * givenBatchSize + 1; i++) {
      await givenBatchProcessor.add({ foo: i });
    }
    // AND the flush method is called
    await givenBatchProcessor.flush();

    // THEN the stats should be correct
    const expectedStats: RowsProcessedStats = givenBatchProcessor.getStats();
    expect(expectedStats.rowsProcessed).toBe(2 * givenBatchSize + 1);
    expect(expectedStats.rowsSuccess).toBe(2 * givenBatchSize - 2);
    expect(expectedStats.rowsFailed).toBe(3);
  });

  test("should process batch when reaching batch size", async () => {
    // GIVEN a batch processor with some batch size and a process function
    const { givenBatchProcessor, givenMockProcessFn, givenBatchSize } = getBatchProcessor();

    // WHEN N (equal to twice the batch size) elements are added to the batch processor
    const batch1: Object[] = [];
    for (let i = 0; i < givenBatchSize; i++) {
      const item = { foo: i };
      batch1.push(item);
      await givenBatchProcessor.add(item);
    }
    const batch2: Object[] = [];
    for (let i = 0; i < givenBatchSize; i++) {
      const item = { foo: i };
      batch2.push(item);
      await givenBatchProcessor.add(item);
    }

    // THEN The process function should be called once with the batch1 and once with the batch2
    expect(givenMockProcessFn).toHaveBeenCalledTimes(2);
    expect(givenMockProcessFn).toHaveBeenCalledWith(batch1);
    expect(givenMockProcessFn).toHaveBeenCalledWith(batch2);
    // AND the correct stats should be returned
    const expectedStats: RowsProcessedStats = givenBatchProcessor.getStats();
    expect(expectedStats.rowsProcessed).toBe(batch1.length + batch1.length);
    expect(expectedStats.rowsSuccess).toBe(expectedStats.rowsProcessed);
    expect(expectedStats.rowsFailed).toBe(0);
  });

  test("should not process batch when not reaching batch size", async () => {
    // GIVEN a batch processor with some batch size of and a process function
    const { givenBatchProcessor, givenMockProcessFn, givenBatchSize } = getBatchProcessor();

    // WHEN N (less that the batch size) elements are added to the batch processor
    for (let i = 0; i < givenBatchSize - 1; i++) {
      const item = { foo: i };
      await givenBatchProcessor.add(item);
    }

    // THEN the process function should not be called
    expect(givenMockProcessFn).not.toHaveBeenCalled();
  });

  test("should flush remaining elements on explicit flush call", async () => {
    // GIVEN a batch processor with some batch size of and a process function
    const { givenBatchProcessor, givenMockProcessFn, givenBatchSize } = getBatchProcessor();

    // WHEN N (less that the batch size) elements are added to the batch processor
    const batch: Object[] = [];
    for (let i = 0; i < givenBatchSize - 1; i++) {
      const item = { foo: i };
      batch.push(item);
      await givenBatchProcessor.add(item);
    }
    // AND The flush method is called
    await givenBatchProcessor.flush();

    // THEN the process function should be called once with the batch
    expect(givenMockProcessFn).toHaveBeenCalledTimes(1);
    expect(givenMockProcessFn).toHaveBeenCalledWith(batch);
    // AND the correct stats should be returned
    const expectedStats: RowsProcessedStats = givenBatchProcessor.getStats();
    expect(expectedStats.rowsProcessed).toBe(givenBatchSize - 1);
    expect(expectedStats.rowsSuccess).toBe(expectedStats.rowsProcessed);
    expect(expectedStats.rowsFailed).toBe(0);
  });

  test("should flush elements even if the processor fails", async () => {
    // GIVEN a batch processor with some batch size  and a process function that will fail
    const givenMockProcessFn = jest.fn().mockRejectedValue(new Error("Process function failed"));
    const givenBatchSize: number = 3;
    const givenBatchProcessor = new BatchProcessor<Object>(givenBatchSize, givenMockProcessFn);

    // WHEN N (less that the batch size) elements are added to the batch processor
    const actualItem = { foo: 1 };
    await givenBatchProcessor.add(actualItem);
    // AND The flush method is called
    const actualFlushPromise = givenBatchProcessor.flush();

    // THEN it should resolve
    await expect(actualFlushPromise).resolves.toBeUndefined(); // undefined because it resolves to void
    // AND the process function should be called once with the batch
    expect(givenMockProcessFn).toHaveBeenCalledTimes(1);
    expect(givenMockProcessFn).toHaveBeenCalledWith([actualItem]);
  });

  test("should add elements even if the processor fails", async () => {
    // GIVEN A batch processor with a batch size 1 and a process function that will fail
    const givenMockProcessFn = jest.fn().mockRejectedValue(new Error("Process function failed"));
    const givenBatchSize: number = 1;
    const givenBatchProcessor = new BatchProcessor<Object>(givenBatchSize, givenMockProcessFn);

    // WHEN N (equal to the batch size = 1) elements are added to the batch processor
    const actualItem = { foo: 1 };
    const actualBatchPromise = givenBatchProcessor.add(actualItem);

    // THEN it should resolve
    await expect(actualBatchPromise).resolves.toBeUndefined();
    // AND the process should be called once with the batch
    expect(givenMockProcessFn).toHaveBeenCalledTimes(1);
    expect(givenMockProcessFn).toHaveBeenCalledWith([actualItem]);
  });

  test("should not process empty batch", async () => {
    // GIVEN a batch processor with some batch size and a process function
    const { givenBatchProcessor, givenMockProcessFn } = getBatchProcessor();

    // WHEN the flush method is called without adding any elements
    await givenBatchProcessor.flush();

    // THEN the process function should not be called
    expect(givenMockProcessFn).not.toHaveBeenCalled();
  });
});
