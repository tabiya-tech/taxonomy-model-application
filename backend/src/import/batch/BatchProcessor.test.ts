// mute the console.log output
import "_test_utilities/consoleMock";

import {BatchProcessor} from './BatchProcessor';

describe('test the BatchProcessor', () => {
  function getBatchProcessor() {
    // GIVEN A batch processor with a batch size of and a process function
    const mockProcessFn = jest.fn().mockResolvedValue(undefined);
    const givenBatchSize: number = 3;
    const batchProcessor = new BatchProcessor<Object>(givenBatchSize, mockProcessFn);
    return {batchProcessor, mockProcessFn, givenBatchSize};
  }

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should process batch when reaching batch size', async () => {
    // GIVEN A batch processor with a batch size and a process function
    const {batchProcessor, mockProcessFn, givenBatchSize} = getBatchProcessor();

    // WHEN N (equal to twice the batch size) elements are added to the batch processor
    const batch1: Object[] = [];
    for (let i = 0; i < givenBatchSize; i++) {
      const item = {foo: i};
      batch1.push(item);
      await batchProcessor.add(item);
    }
    const batch2: Object[] = [];
    for (let i = 0; i < givenBatchSize; i++) {
      const item = {foo: i};
      batch2.push(item);
      await batchProcessor.add(item);
    }

    // THEN The process function should be called once with the batch1 and once with the batch2
    expect(mockProcessFn).toHaveBeenCalledTimes(2);
    expect(mockProcessFn).toHaveBeenCalledWith(batch1);
    expect(mockProcessFn).toHaveBeenCalledWith(batch2);
  });

  test('should not process batch when not reaching batch size', async () => {
    // GIVEN A batch processor with a batch size of and a process function
    const {batchProcessor, mockProcessFn, givenBatchSize} = getBatchProcessor();

    // WHEN N (less that the batch size) elements are added to the batch processor
    for (let i = 0; i < givenBatchSize - 1; i++) {
      const item = {foo: i};
      await batchProcessor.add(item);
    }

    // THEN The process function should not be called
    expect(mockProcessFn).not.toHaveBeenCalled();
  });

  test('should flush remaining elements on explicit flush call', async () => {
    // GIVEN A batch processor with a batch size of and a process function
    const {batchProcessor, mockProcessFn, givenBatchSize} = getBatchProcessor();

    // WHEN N (less that the batch size) elements are added to the batch processor
    const batch: Object[] = [];
    for (let i = 0; i < givenBatchSize - 1; i++) {
      const item = {foo: i};
      batch.push(item);
      await batchProcessor.add(item);
    }
    // AND The flush method is called
    await batchProcessor.flush();

    // THEN The process function should be called once with the batch
    expect(mockProcessFn).toHaveBeenCalledTimes(1);
    expect(mockProcessFn).toHaveBeenCalledWith(batch);
  });

  test('should flush elements even if the processor fails', async () => {
    // GIVEN A batch processor with a batch size of and a process function that will fail
    const mockProcessFn = jest.fn().mockRejectedValue(new Error('Process function failed'));
    const givenBatchSize: number = 3;
    const batchProcessor = new BatchProcessor<Object>(givenBatchSize, mockProcessFn);

    // WHEN N (less that the batch size) elements are added to the batch processor
    const item = {foo: 1};
    await batchProcessor.add(item);

    // AND The flush method is called
    const flushPromise = batchProcessor.flush();

    // THEN it should resolve
    await expect(flushPromise).resolves.toBeUndefined();

    // AND the process should be called once with the batch
    expect(mockProcessFn).toHaveBeenCalledTimes(1);
    expect(mockProcessFn).toHaveBeenCalledWith([item]);
  });

  test('should add elements even if the processor fails', async () => {
    // GIVEN A batch processor with a batch size of and a process function that will fail
    const mockProcessFn = jest.fn().mockRejectedValue(new Error('Process function failed'));
    const givenBatchSize: number = 1;
    const batchProcessor = new BatchProcessor<Object>(givenBatchSize, mockProcessFn);

    // WHEN N (equal to the batch size) elements are added to the batch processor
    const item = {foo: 1};
    const batchPromise = batchProcessor.add(item);

    // THEN it should resolve
    await expect(batchPromise).resolves.toBeUndefined();
    // AND the process should be called once with the batch
    expect(mockProcessFn).toHaveBeenCalledTimes(1);
    expect(mockProcessFn).toHaveBeenCalledWith([item]);
  });


  test('should not process empty batch', async () => {
    // GIVEN: A batch processor with a batch size of 3 and a mock process function
    const {batchProcessor, mockProcessFn} = getBatchProcessor();

    // WHEN: The flush method is called without adding any elements
    await batchProcessor.flush();

    // THEN: The process function should not be called
    expect(mockProcessFn).not.toHaveBeenCalled();
  });
});
