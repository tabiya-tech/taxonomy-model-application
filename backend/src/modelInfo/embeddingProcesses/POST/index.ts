import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

export class POSTModelEmbeddingProcessesHandler {
  async handle(_event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    console.log(_event);
    throw new Error("Not implemented yet");
  }
}
