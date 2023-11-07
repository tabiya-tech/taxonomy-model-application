import ImportAPI from "../import";
import ExportAPI from "../export";
import ModelInfo from "../modelInfo";
import ErrorConstants from "./constants";

namespace ErrorTypes {
  // This is here to make sure the namespace is not empty and the:
  //    "Cannot use 'export import' on a type or type-only namespace when the '--isolatedModules' flag is provided"
  // error is not thrown.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = 0;
  // ---

  export interface Payload {
    errorCode:
      | ErrorConstants.ErrorCodes
      | ImportAPI.Enums.POST.Response.ImportResponseErrorCodes
      | ExportAPI.Enums.POST.Response.ExportResponseErrorCodes
      | ModelInfo.Enums.POST.Response.ErrorCodes
      | ModelInfo.Enums.GET.Response.ErrorCodes; // The UI could use to display some useful information
    message: string; // The error message offers better developer experience. UI should not display this message.
    details: string; // This may be some cryptic message only a developer can understand
  }
}

export default ErrorTypes;
