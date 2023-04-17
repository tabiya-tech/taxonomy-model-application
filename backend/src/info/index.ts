import version from './version.json';
import {Handler, APIGatewayEvent} from "aws-lambda";

export const handler: Handler = async (event: APIGatewayEvent, context, callback) => {
  return {
    isBase64Encoded: false,
    headers: {
      "Access-Control-Allow-Origin": "*", // Required for CORS support to work
    },
    multiValueHeaders: {
      "Access-Control-Allow-Methods": ["GET"]
    },
    statusCode: 200,
    body: JSON.stringify(version)
  };
}
