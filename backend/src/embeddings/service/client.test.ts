// silence chatty console
import "_test_utilities/consoleMock";

import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { EmbeddingClient } from "./client";
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
});
