namespace AuthTypes {
  // This is here to make sure the namespace is not empty and the:
  //    "Cannot use 'export import' on a type or type-only namespace when the '--isolatedModules' flag is provided"
  // error is not thrown.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = 0;
  // ---

  export namespace Request {
    export type Context = {
      username: string;
      roles: string;
    };
  }
}

export default AuthTypes;
