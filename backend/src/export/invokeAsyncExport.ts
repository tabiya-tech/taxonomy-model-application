import { errorResponse, response, StatusCodes } from "server/httpUtils";
import ExportAPISpecs from "api-specifications/export";
import { LambdaClient, InvokeCommand, InvokeCommandInput } from "@aws-sdk/client-lambda";
import { getAsyncExportLambdaFunctionArn, getAsyncLambdaFunctionRegion } from "server/config/config";
import { AsyncExportEvent } from "./async";

export async function lambda_invokeAsyncExport(
  request: ExportAPISpecs.Types.POST.Request.Payload,
  exportProcessStateId: string
) {
  try {
    const client = new LambdaClient({ region: getAsyncLambdaFunctionRegion() });
    const asyncExportHandlerProps: AsyncExportEvent = {
      ...request,
      exportProcessStateId: exportProcessStateId,
    };
    const input: InvokeCommandInput = {
      // InvocationRequest
      FunctionName: getAsyncExportLambdaFunctionArn(), // required
      InvocationType: "Event",
      Payload: new TextEncoder().encode(JSON.stringify(asyncExportHandlerProps)), // make sure it is utf-8
    };
    await client.send(new InvokeCommand(input));

    return response(StatusCodes.ACCEPTED, {});

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    //
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