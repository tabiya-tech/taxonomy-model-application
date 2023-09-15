namespace PresignedTypes {
  export namespace GET {
    export namespace Response {
      export interface Payload {
        url: string,
        fields: {name: string, value: string}[],
        folder: string,
      }
    }
  }
}

export default  PresignedTypes;