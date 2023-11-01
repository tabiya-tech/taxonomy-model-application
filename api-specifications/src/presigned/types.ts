namespace PresignedTypes {
  // This is here to make sure the namespace is not empty and the:
  //    "Cannot use 'export import' on a type or type-only namespace when the '--isolatedModules' flag is provided"
  // error is not thrown.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = 0;
  // ---
  export namespace GET {
    export namespace Response {
      export interface Payload {
        url: string;
        fields: { name: string; value: string }[];
        folder: string;
      }
    }
  }
}

export default PresignedTypes;
export const _ = 0;
