import { errorResponse, response, StatusCodes } from "server/httpUtils";
import ImportAPISpecs from "api-specifications/import";
import { LambdaClient, InvokeCommand, InvokeCommandInput } from "@aws-sdk/client-lambda";
import { getAsyncImportLambdaFunctionArn, getAsyncLambdaFunctionRegion } from "server/config/config";

export async function lambda_invokeAsyncImport(request: ImportAPISpecs.Types.POST.Request.Payload) {
  try {
    const client = new LambdaClient({ region: getAsyncLambdaFunctionRegion() });
    const input: InvokeCommandInput = {
      // InvocationRequest
      FunctionName: getAsyncImportLambdaFunctionArn(), // required
      InvocationType: "Event",
      Payload: new TextEncoder().encode(JSON.stringify(request)), // make sure it is utf-8
    };
    await client.send(new InvokeCommand(input));

    return response(StatusCodes.ACCEPTED, {});
  } catch (error: unknown) {
    console.error(new Error("Failed to trigger import lambda", { cause: error }));
    // Do not show the error message to the user as it can contain sensitive information such as DB connection string
    return errorResponse(
      StatusCodes.INTERNAL_SERVER_ERROR,
      ImportAPISpecs.Enums.POST.Response.ImportResponseErrorCodes.FAILED_TO_TRIGGER_IMPORT,
      "Failed to trigger import",
      ""
    );
  }
}
