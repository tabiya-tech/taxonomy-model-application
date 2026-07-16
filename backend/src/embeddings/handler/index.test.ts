// mute console
import "_test_utilities/consoleMock";
import "_test_utilities/mockSentry";

// ##############
// Mock the server init function
jest.mock("server/init", () => ({
  initOnce: jest.fn(),
}));

// Mock the EmbeddingService so we can observe the processing of the tasks
const mockProcessTasks = jest.fn();
jest.mock("embeddings/service/service", () => ({
  EmbeddingService: jest.fn().mockImplementation(() => ({ processTasks: mockProcessTasks })),
}));

// ##############
import { handler } from "./index";
import { SQSEvent } from "aws-lambda";
import { EmbeddableEntityType, EmbeddableField, IGenerateEmbeddingTask } from "embeddings/service/types";
import { getMockStringId } from "_test_utilities/mockMongoId";

function getValidTask(index: number): IGenerateEmbeddingTask {
  return {
    modelId: getMockStringId(1),
    entityId: getMockStringId(index),
    entityType: EmbeddableEntityType.Skill,
    fields: [EmbeddableField.preferredLabel],
  };
}

function getSQSEvent(bodies: string[]): SQSEvent {
  return {
    Records: bodies.map((body, index) => ({ body, messageId: `message-${index}` })),
  } as never;
}

describe("Test the embeddings lambda handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should process all the valid tasks of the event as a single batch", async () => {
    // GIVEN an event with two valid embedding tasks
    const givenTask1 = getValidTask(2);
    const givenTask2 = getValidTask(3);
    const givenEvent = getSQSEvent([JSON.stringify(givenTask1), JSON.stringify(givenTask2)]);

    // WHEN the handler is invoked with the given event
    await handler(givenEvent, {} as never, {} as never);

    // THEN expect all the tasks to be processed together in a single batch
    expect(mockProcessTasks).toHaveBeenCalledTimes(1);
    expect(mockProcessTasks).toHaveBeenCalledWith([givenTask1, givenTask2]);
  });

  test("should skip an unparseable record without throwing", async () => {
    // GIVEN an event with an unparseable record and a valid record
    const givenValidTask = getValidTask(2);
    const givenEvent = getSQSEvent(["{ not json", JSON.stringify(givenValidTask)]);

    // WHEN the handler is invoked with the given event
    const actualPromise = handler(givenEvent, {} as never, {} as never);

    // THEN expect it to resolve without throwing
    await expect(actualPromise).resolves.toBeUndefined();
    // AND expect only the valid task to be processed
    expect(mockProcessTasks).toHaveBeenCalledTimes(1);
    expect(mockProcessTasks).toHaveBeenCalledWith([givenValidTask]);
  });

  test("should skip a record that does not conform to the queue job schema", async () => {
    // GIVEN an event with a record that does not conform to the schema and a valid record
    const givenInvalidTask = { ...getValidTask(2), fields: [] };
    const givenValidTask = getValidTask(3);
    const givenEvent = getSQSEvent([JSON.stringify(givenInvalidTask), JSON.stringify(givenValidTask)]);

    // WHEN the handler is invoked with the given event
    const actualPromise = handler(givenEvent, {} as never, {} as never);

    // THEN expect it to resolve without throwing
    await expect(actualPromise).resolves.toBeUndefined();
    // AND expect only the valid task to be processed
    expect(mockProcessTasks).toHaveBeenCalledTimes(1);
    expect(mockProcessTasks).toHaveBeenCalledWith([givenValidTask]);
  });

  test("should handle an event with no records", async () => {
    // GIVEN an event with no records
    const givenEvent = {} as SQSEvent;

    // WHEN the handler is invoked with the given event
    const actualPromise = handler(givenEvent, {} as never, {} as never);

    // THEN expect it to resolve without throwing
    await expect(actualPromise).resolves.toBeUndefined();
    // AND expect no task to be processed
    expect(mockProcessTasks).not.toHaveBeenCalled();
  });

  test("should not process an empty batch when no record is valid", async () => {
    // GIVEN an event whose only record is unparseable
    const givenEvent = getSQSEvent(["{ not json"]);

    // WHEN the handler is invoked with the given event
    const actualPromise = handler(givenEvent, {} as never, {} as never);

    // THEN expect it to resolve without throwing
    await expect(actualPromise).resolves.toBeUndefined();
    // AND expect no batch to be processed
    expect(mockProcessTasks).not.toHaveBeenCalled();
  });
});
