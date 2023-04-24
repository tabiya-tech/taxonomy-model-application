
import {Handler, APIGatewayEvent} from "aws-lambda";
import  ModelService  from "./model.service";

export const handler: Handler = async (event: APIGatewayEvent, context, callback) => {
  let request = {
    name: '',
    locale: ''
}
  return {
    isBase64Encoded: false,
    headers: {
      "Access-Control-Allow-Origin": "*", // Required for CORS support to work
    },
    multiValueHeaders: {
      "Access-Control-Allow-Methods": ["POST"]
    },
    statusCode: 200,
    body: JSON.stringify((new ModelService).create(request))
  };
}