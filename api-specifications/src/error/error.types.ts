import ImportRequest from "../import";
import ModelInfo from "../modelInfo";
import {ErrorCodes} from "./error.constants";

interface IErrorResponse {
  errorCode: ErrorCodes | ImportRequest.POST.Response.Constants.ImportResponseErrorCodes | ModelInfo.POST.Response.Constants.ErrorCodes | ModelInfo.GET.Response.Constants.ErrorCodes, // The UI could use to display some useful information
  message: string, // The error message offers better developer experience. UI should not display this message.
  details: string, // This may be some cryptic message only a developer can understand
}

namespace ErrorTypes {
  export namespace POST {
    export namespace Response {
      export type Payload = IErrorResponse;
    }
  }
}

export default ErrorTypes;