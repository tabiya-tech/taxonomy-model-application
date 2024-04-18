export namespace AuthEnums {
  export enum TabiyaRoles {
    ANONYMOUS = "anonymous",
    MODEL_MANAGER = "model-managers",
    REGISTERED_USER = "registered-user",
  }
}

export namespace Auth {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export import Enums = AuthEnums;
}
export default AuthEnums;
