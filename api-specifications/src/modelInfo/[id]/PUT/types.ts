import Locale from "../../../locale";
import ModelInfoTypes from "../../types";

namespace PUTModelTypes {
  export namespace Request {
    export interface Payload {
      name: string;
      description: string;
      locale: Locale.Types.Payload;
      availableLanguages: string[];
      license: string;
      UUIDHistory: string[];
    }
  }
  export namespace Response {
    export type Payload = ModelInfoTypes.Response.IModelInfo;
  }
}

export default PUTModelTypes;
