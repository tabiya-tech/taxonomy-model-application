// mute console during test
import "_test_utilities/consoleMock";

import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import * as config from "server/config/config";
import { AsyncPublishEmbeddingsTaskInvoker } from "./asyncPublishEmbeddingsTaskInvoker";
import { IPublishEmbeddingsTaskEvent } from "./asyncPublishEmbeddingsTask.types";

const mockSend = jest.fn().mockResolvedValue({});
jest.mock("@aws-sdk/client-lambda", () => {
  return {
    LambdaClient: jest.fn().mockImplementation(() => {
      return {
        send: mockSend,
      };
    }),
    InvokeCommand: jest.fn(),
  };
});

describe("Test AsyncPublishEmbeddingsTaskInvoker", () => {
  const givenEvent: IPublishEmbeddingsTaskEvent = {
    processId: "process-id",
    modelId: "model-id",
    embeddingServiceId: "gemini$$models/gemini-embedding-2",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSend.mockResolvedValue({});
  });

  test("should invoke the lambda asynchronously with the given event", async () => {
    // GIVEN the configuration returns a lambda function arn
    const givenArn = "arn:aws:lambda:foo:bar:baz:publish-embeddings-task";
    jest.spyOn(config, "getAsyncPublishEmbeddingsTaskLambdaFunctionArn").mockReturnValue(givenArn);
    // AND the configuration returns a lambda function region
    const givenRegion = "foo";
    jest.spyOn(config, "getAsyncLambdaFunctionRegion").mockReturnValue(givenRegion);
    // AND an invoker
    const invoker = new AsyncPublishEmbeddingsTaskInvoker();

    // WHEN invoking the lambda with the given event
    const actualPromise = invoker.invoke(givenEvent);

    // THEN expect it to resolve
    await expect(actualPromise).resolves.toBeUndefined();
    // AND expect the LambdaClient to have been created with the region from the configuration
    expect(LambdaClient).toHaveBeenCalledWith({ region: givenRegion });
    // AND expect the InvokeCommand to have been created for an asynchronous ("Event") invocation with the given event as payload
    expect(InvokeCommand).toHaveBeenCalledWith({
      FunctionName: givenArn,
      InvocationType: "Event",
      Payload: new TextEncoder().encode(JSON.stringify(givenEvent)),
    });
    // AND expect the command to have been sent
    expect(mockSend).toHaveBeenCalledWith(expect.any(InvokeCommand));
  });

  test("should reject when the lambda invocation fails", async () => {
    // GIVEN sending the InvokeCommand will fail
    const givenError = new Error("Failed to schedule the publish embeddings task");
    mockSend.mockRejectedValueOnce(givenError);
    // AND an invoker
    const invoker = new AsyncPublishEmbeddingsTaskInvoker();

    // WHEN invoking the lambda with the given event
    const actualPromise = invoker.invoke(givenEvent);

    // THEN expect it to reject with the error
    await expect(actualPromise).rejects.toThrow(givenError);
  });
});
