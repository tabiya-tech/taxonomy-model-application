import {Handler, APIGatewayEvent} from "aws-lambda";
import {handler as InfoHandler} from "./info";

export const handler: Handler = async (event: APIGatewayEvent, context, callback) => {
  if (event.path === "/info") {
    return InfoHandler(event, context, callback);
  } else {
    // See https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-output-format
    // For the format of the return value
    return {
      isBase64Encoded: false,
      headers: {
        "Access-Control-Allow-Origin": "*", // Required for CORS support to work
      },
      multiValueHeaders: {"Access-Control-Allow-Methods": ["GET"]},
      statusCode: 404,
      body: JSON.stringify({
        message: 'Go look somewhere else'
      }),
    };
  }
}