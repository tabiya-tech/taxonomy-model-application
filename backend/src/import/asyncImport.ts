import {errorResponse, response, StatusCodes} from "server/httpUtils";
import {ImportRequest, ImportResponseErrorCodes} from "api-specifications/import";
import {LambdaClient, InvokeCommand, InvokeCommandInput} from "@aws-sdk/client-lambda";
import {getAsyncLambdaFunctionArn, getAsyncLambdaFunctionRegion} from "server/config/config";

export async function lambda_invokeAsyncImport(request: ImportRequest) {
  try {
    //const lambda = new Lambda();
    const client = new LambdaClient({region: getAsyncLambdaFunctionRegion()});
    const input: InvokeCommandInput = { // InvocationRequest
      FunctionName: getAsyncLambdaFunctionArn(), // required
      InvocationType: "Event",
      Payload: new TextEncoder().encode(JSON.stringify(request)) // make sure it is utf-8
    };
    await client.send(new InvokeCommand(input));
    return response(StatusCodes.ACCEPTED, {});

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {  //
    console.error(error);
    // Do not show the error message to the user as it can contain sensitive information such as DB connection string
    return errorResponse(StatusCodes.INTERNAL_SERVER_ERROR, ImportResponseErrorCodes.FAILED_TO_TRIGGER_IMPORT, "Failed to trigger import", "");
  }
}
