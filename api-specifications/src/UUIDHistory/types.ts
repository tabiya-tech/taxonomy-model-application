interface IUUIDHistory {
  modelId: string;
  name: string;
  version: string;
  localeShortCode: string;
}

namespace UUIDHistoryTypes {
  // This is here to make sure the namespace is not empty and the:
  //    "Cannot use 'export import' on a type or type-only namespace when the '--isolatedModules' flag is provided"
  // error is not thrown.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = 0;
  // ---

  export namespace GET {
    export namespace Request {
      export type Payload = {
        modelId: string;
      };
    }
    export namespace Response {
      export type UUIDHistoryItem = IUUIDHistory;
      export type Payload = UUIDHistoryItem[];
    }
  }
}

export default UUIDHistoryTypes;
