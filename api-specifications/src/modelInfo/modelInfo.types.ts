export interface ILocale {
  UUID: string;
  shortCode: string;
  name: string;
}

// Have a common supertype for all the responses to inherit from
interface IModelInfoResponse extends IModelInfoRequest {
  id: string;
  UUID: string;
  originUUID: string;
  previousUUID: string;
  path: string;
  tabiyaPath: string;
  released: boolean;
  releaseNotes: string;
  version: string;
  createdAt: string;
  updatedAt: string;
}


interface IModelInfoRequest {
  name: string;
  description: string;
  locale: ILocale;
}

export namespace ModelInfo {
  export namespace GET {

    export namespace Response {
      export type Payload = Array<IModelInfoResponse>

      export enum ErrorCodes {
        DB_FAILED_TO_RETRIEVE_MODELS = "DB_FAILED_TO_RETRIEVE_MODELS"
      }
    }
  }

  export namespace POST {
    export namespace Response {
      export type Payload = IModelInfoResponse

      export enum ErrorCodes {
        DB_FAILED_TO_CREATE_MODEL = "DB_FAILED_TO_CREATE_MODEL", MODEL_COULD_NOT_VALIDATE = "MODEL_COULD_NOT_VALIDATE",
      }
    }

    export namespace Request {
      export type Payload = IModelInfoRequest;
    }
  }
}
