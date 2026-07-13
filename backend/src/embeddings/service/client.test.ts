// silence chatty console
import "_test_utilities/consoleMock";

import { SendMessageBatchCommand, SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { EmbeddingClient, SQS_MAX_BATCH_SIZE } from "./client";
import { EmbeddableEntityType, EmbeddableField, IGenerateEmbeddingTask } from "./types";
import { getMockStringId } from "_test_utilities/mockMongoId";

const givenQueueUrl = "https://sqs.test.amazonaws.com/123456789012/test-embeddings-queue";

jest.mock("server/config/config", () => ({
  getEmbeddingsQueueUrl: jest.fn().mockReturnValue("https://sqs.test.amazonaws.com/123456789012/test-embeddings-queue"),
}));

function getValidTask(): IGenerateEmbeddingTask {
  return {
    modelId: getMockStringId(1),
    entityId: getMockStringId(2),
    entityType: EmbeddableEntityType.Skill,
    fields: [EmbeddableField.preferredLabel],
  };
}

function getMockSqsClient(send: jest.Mock = jest.fn().mockResolvedValue(undefined)): SQSClient {
  return { send } as unknown as SQSClient;
}

describe("Test the EmbeddingClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should construct with an injected SQSClient", () => {
    // GIVEN an SQSClient
    const givenSqsClient = getMockSqsClient();

    // WHEN constructing an EmbeddingClient with the injected SQSClient
    const actualClient = new EmbeddingClient(givenSqsClient);

    // THEN expect the client to be constructed
    expect(actualClient).toBeInstanceOf(EmbeddingClient);
  });

  test("should push a valid task to the queue", async () => {
    // GIVEN a mock SQS client
    const givenSqsClient = getMockSqsClient();
    // AND an EmbeddingClient that uses it
    const givenEmbeddingClient = new EmbeddingClient(givenSqsClient);
    // AND a valid task
    const givenTask = getValidTask();

    // WHEN pushing the task to the queue
    await givenEmbeddingClient.pushTaskToQueue(givenTask);

    // THEN expect the SQS client to send a message with the queue url and the task as the body
    expect(givenSqsClient.send).toHaveBeenCalledTimes(1);
    const actualCommand = (givenSqsClient.send as jest.Mock).mock.calls[0][0] as SendMessageCommand;
    expect(actualCommand).toBeInstanceOf(SendMessageCommand);
    expect(actualCommand.input).toEqual({
      QueueUrl: givenQueueUrl,
      MessageBody: JSON.stringify(givenTask),
    });
  });

  test("should not push an invalid task to the queue and should throw", async () => {
    // GIVEN a mock SQS client
    const givenSqsClient = getMockSqsClient();
    // AND an EmbeddingClient that uses it
    const givenEmbeddingClient = new EmbeddingClient(givenSqsClient);
    // AND an invalid task (missing the required fields property)
    const givenInvalidTask = { ...getValidTask(), fields: [] };

    // WHEN pushing the invalid task to the queue
    const actualPromise = givenEmbeddingClient.pushTaskToQueue(givenInvalidTask as IGenerateEmbeddingTask);

    // THEN expect it to reject with an error
    await expect(actualPromise).rejects.toThrow("does not conform to the queue job schema");
    // AND expect the SQS client to not send any message
    expect(givenSqsClient.send).not.toHaveBeenCalled();
  });

  test("should reject with an error when the SQS client fails to send the message", async () => {
    // GIVEN a mock SQS client that fails to send messages
    const givenCause = new Error("SQS unavailable");
    const givenSqsClient = getMockSqsClient(jest.fn().mockRejectedValue(givenCause));
    // AND an EmbeddingClient that uses it
    const givenEmbeddingClient = new EmbeddingClient(givenSqsClient);
    // AND a valid task
    const givenTask = getValidTask();

    // WHEN pushing the task to the queue
    const actualPromise = givenEmbeddingClient.pushTaskToQueue(givenTask);

    // THEN expect it to reject with a wrapped error
    await expect(actualPromise).rejects.toThrow(
      expect.toMatchErrorWithCause("EmbeddingClient.pushTaskToQueue: failed to push task to queue", givenCause.message)
    );
  });

  describe("pushTasksToQueue", () => {
    function getValidTasks(count: number): IGenerateEmbeddingTask[] {
      return Array.from({ length: count }, (_, index) => ({
        ...getValidTask(),
        entityId: getMockStringId(index + 10),
      }));
    }

    test("should push multiple tasks to the queue in batches of the maximum SQS batch size", async () => {
      // GIVEN a mock SQS client
      const givenSqsClient = getMockSqsClient(jest.fn().mockResolvedValue({ Failed: [] }));
      // AND an EmbeddingClient that uses it
      const givenEmbeddingClient = new EmbeddingClient(givenSqsClient);
      // AND more valid tasks than fit in a single SQS batch
      const givenTaskCount = SQS_MAX_BATCH_SIZE * 2 + 5;
      const givenTasks = getValidTasks(givenTaskCount);

      // WHEN pushing the tasks to the queue
      await givenEmbeddingClient.pushTasksToQueue(givenTasks);

      // THEN expect the SQS client to send one batch command per chunk of the maximum batch size
      const expectedBatchCount = Math.ceil(givenTaskCount / SQS_MAX_BATCH_SIZE);
      expect(givenSqsClient.send).toHaveBeenCalledTimes(expectedBatchCount);
      // AND expect every batch to target the queue url and carry the tasks as message bodies
      const actualCommands = (givenSqsClient.send as jest.Mock).mock.calls.map(
        (call) => call[0] as SendMessageBatchCommand
      );
      actualCommands.forEach((actualCommand) => {
        expect(actualCommand).toBeInstanceOf(SendMessageBatchCommand);
        expect(actualCommand.input.QueueUrl).toEqual(givenQueueUrl);
        expect(actualCommand.input.Entries!.length).toBeLessThanOrEqual(SQS_MAX_BATCH_SIZE);
      });
      const actualMessageBodies = actualCommands.flatMap((command) =>
        command.input.Entries!.map((entry) => entry.MessageBody)
      );
      const expectedMessageBodies = givenTasks.map((task) => JSON.stringify(task));
      expect(actualMessageBodies).toEqual(expectedMessageBodies);
    });

    test("should not push any task to the queue and should throw when one of the tasks is invalid", async () => {
      // GIVEN a mock SQS client
      const givenSqsClient = getMockSqsClient();
      // AND an EmbeddingClient that uses it
      const givenEmbeddingClient = new EmbeddingClient(givenSqsClient);
      // AND a list of tasks where one is invalid (missing the required fields property)
      const givenInvalidTask = { ...getValidTask(), fields: [] };
      const givenTasks = [...getValidTasks(3), givenInvalidTask as IGenerateEmbeddingTask];

      // WHEN pushing the tasks to the queue
      const actualPromise = givenEmbeddingClient.pushTasksToQueue(givenTasks);

      // THEN expect it to reject with an error
      await expect(actualPromise).rejects.toThrow("does not conform to the queue job schema");
      // AND expect the SQS client to not send any message
      expect(givenSqsClient.send).not.toHaveBeenCalled();
    });

    test("should reject with an error when the SQS client fails to send a batch", async () => {
      // GIVEN a mock SQS client that fails to send messages
      const givenCause = new Error("SQS unavailable");
      const givenSqsClient = getMockSqsClient(jest.fn().mockRejectedValue(givenCause));
      // AND an EmbeddingClient that uses it
      const givenEmbeddingClient = new EmbeddingClient(givenSqsClient);
      // AND valid tasks
      const givenTasks = getValidTasks(3);

      // WHEN pushing the tasks to the queue
      const actualPromise = givenEmbeddingClient.pushTasksToQueue(givenTasks);

      // THEN expect it to reject with a wrapped error
      await expect(actualPromise).rejects.toThrow(
        expect.toMatchErrorWithCause(
          "EmbeddingClient.pushTasksToQueue: failed to push tasks to queue",
          givenCause.message
        )
      );
    });

    test("should reject with an error when some messages in a batch fail to be sent", async () => {
      // GIVEN a mock SQS client that reports a partial batch failure
      const givenFailedEntry = { Id: "0", SenderFault: true, Code: "InternalError", Message: "some error" };
      const givenSqsClient = getMockSqsClient(jest.fn().mockResolvedValue({ Failed: [givenFailedEntry] }));
      // AND an EmbeddingClient that uses it
      const givenEmbeddingClient = new EmbeddingClient(givenSqsClient);
      // AND valid tasks
      const givenTasks = getValidTasks(3);

      // WHEN pushing the tasks to the queue
      const actualPromise = givenEmbeddingClient.pushTasksToQueue(givenTasks);

      // THEN expect it to reject with a wrapped error that reports the failed messages
      await expect(actualPromise).rejects.toThrow(
        expect.toMatchErrorWithCause(
          "EmbeddingClient.pushTasksToQueue: failed to push tasks to queue",
          /some messages failed to be sent/
        )
      );
    });
  });
});
