import AuthAPISpecs from "api-specifications/auth";

export enum AccessKeyType {
  API_KEY = "api-key",
  M2M_CLIENT_ID = "m2m-client-id",
}

export interface IAccessKeyDoc {
  keyType: AccessKeyType;
  keyId: string;
  role: AuthAPISpecs.Enums.TabiyaRoles;
}

export interface IAccessKey extends IAccessKeyDoc {}
