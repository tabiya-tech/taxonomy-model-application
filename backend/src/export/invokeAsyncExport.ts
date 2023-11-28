import { errorResponse, response, StatusCodes } from "server/httpUtils";
import ExportAPISpecs from "api-specifications/export";
import { LambdaClient, InvokeCommand, InvokeCommandInput } from "@aws-sdk/client-lambda";
import { getAsyncExportLambdaFunctionArn, getAsyncLambdaFunctionRegion } from "server/config/config";
import { AsyncExportEvent } from "./async/async.types";

export async function lambda_invokeAsyncExport(payload: AsyncExportEvent) {
  try {
    const client = new LambdaClient({ region: getAsyncLambdaFunctionRegion() });
    const input: InvokeCommandInput = {
      // InvocationRequest
      FunctionName: getAsyncExportLambdaFunctionArn(), // required
      InvocationType: "Event",
      Payload: new TextEncoder().encode(JSON.stringify(payload)), // make sure it is utf-8
    };
    await client.send(new InvokeCommand(input));

    return response(StatusCodes.ACCEPTED, {});
  } catch (error: unknown) {
    console.error(error);
    // Do not show the error message to the user as it can contain sensitive information such as DB connection string
    return errorResponse(
      StatusCodes.INTERNAL_SERVER_ERROR,
      ExportAPISpecs.Enums.POST.Response.ExportResponseErrorCodes.FAILED_TO_TRIGGER_EXPORT,
      "Failed to trigger export",
      ""
    );
  }
}
