import { LambdaClient, InvokeCommand, InvokeCommandInput } from "@aws-sdk/client-lambda";
import { getAsyncLambdaFunctionRegion, getAsyncPublishEmbeddingsTaskLambdaFunctionArn } from "server/config/config";
import { IAsyncPublishEmbeddingsTaskInvoker, IPublishEmbeddingsTaskEvent } from "./asyncPublishEmbeddingsTask.types";

/**
 * Invokes the async-publish-embeddings-task lambda asynchronously (InvocationType "Event"), so that the
 * caller does not wait for the publishing to complete.
 */
export class AsyncPublishEmbeddingsTaskInvoker implements IAsyncPublishEmbeddingsTaskInvoker {
  async invoke(event: IPublishEmbeddingsTaskEvent): Promise<void> {
    const client = new LambdaClient({ region: getAsyncLambdaFunctionRegion() });
    const input: InvokeCommandInput = {
      FunctionName: getAsyncPublishEmbeddingsTaskLambdaFunctionArn(), // required
      InvocationType: "Event", // fire-and-forget: the caller is not blocked while the lambda runs
      Payload: new TextEncoder().encode(JSON.stringify(event)), // make sure it is utf-8
    };
    await client.send(new InvokeCommand(input));
  }
}
