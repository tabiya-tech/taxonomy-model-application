import {Handler, APIGatewayEvent} from "aws-lambda";
import  ModelService  from "./TaxanomyModel.service";

export const handler: Handler = async (event: APIGatewayEvent, context, callback) => {
  if (event.path === "/upload") {
    let request = {
        name: '',
        locale: '',
        csvFiles: []
    }
    return (new ModelService).handle(request);
  } else {
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