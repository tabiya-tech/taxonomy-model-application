import ImportAPI from "../import";
import ModelInfo from "../modelInfo";
import ErrorConstants from "./constants";

namespace ErrorTypes {
      export interface Payload {
        errorCode: ErrorConstants.ErrorCodes | ImportAPI.Enums.POST.Response.ImportResponseErrorCodes | ModelInfo.Enums.POST.Response.ErrorCodes | ModelInfo.Enums.GET.Response.ErrorCodes, // The UI could use to display some useful information
        message: string, // The error message offers better developer experience. UI should not display this message.
        details: string, // This may be some cryptic message only a developer can understand
      }
}

export default ErrorTypes;