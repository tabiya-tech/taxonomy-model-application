// mute console
import "_test_utilities/consoleMock";
import "_test_utilities/mockSentry";

// ##############
// Mock the server init function
jest.mock("server/init", () => ({
  initOnce: jest.fn(),
}));

// Mock the service registry so we can control the embedding process service
const mockPublishEmbeddingTasks = jest.fn();
jest.mock("server/serviceRegistry/serviceRegistry", () => ({
  getServiceRegistry: jest.fn().mockReturnValue({
    embeddingProcess: { publishEmbeddingTasks: mockPublishEmbeddingTasks },
  }),
}));

// ##############
import { handler } from "./index";
import { initOnce } from "server/init";
import { IPublishEmbeddingsTaskEvent } from "./asyncPublishEmbeddingsTask.types";
import { getMockStringId } from "_test_utilities/mockMongoId";

function getValidEvent(): IPublishEmbeddingsTaskEvent {
  return {
    processId: getMockStringId(10),
    modelId: getMockStringId(1),
    embeddingServiceId: "gemini$$models/gemini-embedding-2",
  };
}

describe("Test the async-publish-embeddings-task lambda handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (initOnce as jest.Mock).mockResolvedValue(undefined);
    mockPublishEmbeddingTasks.mockResolvedValue(undefined);
  });

  test("should initialize the server and publish the embedding tasks of the given event", async () => {
    // GIVEN a valid event
    const givenEvent = getValidEvent();

    // WHEN the handler is invoked with the given event
    const actualPromise = handler(givenEvent, {} as never, {} as never);

    // THEN expect it to resolve without throwing
    await expect(actualPromise).resolves.toBeUndefined();
    // AND expect the server to have been initialized
    expect(initOnce).toHaveBeenCalledTimes(1);
    // AND expect the embedding tasks to have been published for the process, model and embedding service of the event
    expect(mockPublishEmbeddingTasks).toHaveBeenCalledWith(
      givenEvent.processId,
      givenEvent.modelId,
      givenEvent.embeddingServiceId
    );
    // AND expect no error to have been logged
    expect(console.error).not.toHaveBeenCalled();
  });

  test.each([
    ["processId is missing", { modelId: getMockStringId(1), embeddingServiceId: "svc" }],
    ["processId is empty", { processId: "", modelId: getMockStringId(1), embeddingServiceId: "svc" }],
    ["modelId is missing", { processId: getMockStringId(10), embeddingServiceId: "svc" }],
    ["embeddingServiceId is missing", { processId: getMockStringId(10), modelId: getMockStringId(1) }],
    ["the event is undefined", undefined],
  ])("should skip and log without throwing when %s", async (_description, givenEvent) => {
    // GIVEN a malformed event (see the parameter)

    // WHEN the handler is invoked with the given event
    const actualPromise = handler(givenEvent as never, {} as never, {} as never);

    // THEN expect it to resolve without throwing (a malformed event would never succeed on retry)
    await expect(actualPromise).resolves.toBeUndefined();
    // AND expect the error to have been logged
    expect(console.error).toHaveBeenCalled();
    // AND expect neither the server to be initialized nor the tasks to be published
    expect(initOnce).not.toHaveBeenCalled();
    expect(mockPublishEmbeddingTasks).not.toHaveBeenCalled();
  });

  test("should rethrow so the lambda is retried when the server initialization fails", async () => {
    // GIVEN a valid event
    const givenEvent = getValidEvent();
    // AND the server initialization will fail
    const givenError = new Error("DB connection lost");
    (initOnce as jest.Mock).mockRejectedValueOnce(givenError);

    // WHEN the handler is invoked with the given event
    const actualPromise = handler(givenEvent, {} as never, {} as never);

    // THEN expect it to reject with the error so that AWS retries the invocation
    await expect(actualPromise).rejects.toThrow(givenError);
    // AND expect the error to have been logged
    expect(console.error).toHaveBeenCalled();
    // AND expect the tasks not to be published
    expect(mockPublishEmbeddingTasks).not.toHaveBeenCalled();
  });

  test("should log without throwing when publishing the embedding tasks fails", async () => {
    // GIVEN a valid event
    const givenEvent = getValidEvent();
    // AND publishing the embedding tasks will fail
    const givenError = new Error("SQS unavailable");
    mockPublishEmbeddingTasks.mockRejectedValueOnce(givenError);

    // WHEN the handler is invoked with the given event
    const actualPromise = handler(givenEvent, {} as never, {} as never);

    // THEN expect it to resolve without throwing (the service already cleaned up, so a retry would not help)
    await expect(actualPromise).resolves.toBeUndefined();
    // AND expect the error to have been logged
    expect(console.error).toHaveBeenCalled();
  });
});
