interface IPresignedResponse {
  url: string,
  fields: {name: string, value: string}[],
  folder: string,
}

namespace PresignedTypes {
  export namespace GET {
    export namespace Response {
      export type Payload = IPresignedResponse;
    }
  }
}

export default  PresignedTypes;