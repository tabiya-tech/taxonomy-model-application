import AuthAPISpecs from "api-specifications/auth";

import { AccessKeyType } from "auth/accessKey/accessKey.types";
import { IAccessKeyService } from "auth/accessKey/accessKeyService";

const TabiyaRoleLevels = {
  [AuthAPISpecs.Enums.TabiyaRoles.ANONYMOUS]: 0,
  [AuthAPISpecs.Enums.TabiyaRoles.REGISTERED_USER]: 1,
  [AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER]: 2,
};

/**
 * Implementation for checking if the subject has a given role.
 */
export interface Authorizer {
  /**
   * This should check if the subject has the given role.
   *
   * Important: This function should not throw.
   */
  hasRole(role: AuthAPISpecs.Enums.TabiyaRoles): Promise<boolean>;
}

/**
 * Authorizer for the API Key-based authentication.
 */
export class APIKeyAuthorizer implements Authorizer {
  constructor(
    private readonly accessKeyService: IAccessKeyService,
    private readonly apiKeyId: string
  ) {}
  async hasRole(role: AuthAPISpecs.Enums.TabiyaRoles): Promise<boolean> {
    const apiKey = await this.accessKeyService.findByKeyId(AccessKeyType.API_KEY, this.apiKeyId);
    if (!apiKey) {
      return false;
    }

    if (role === AuthAPISpecs.Enums.TabiyaRoles.ANONYMOUS) return true;

    const requiredLevel = TabiyaRoleLevels[role];
    const apiKeyLevel = TabiyaRoleLevels[apiKey.role];

    return requiredLevel <= apiKeyLevel;
  }
}

/**
 * Authorize for the Human In The Loop authentication.
 * e.g.: On a web application or mobile application.
 */
export class HumanInTheLoopAuthorizer implements Authorizer {
  constructor(private readonly userGroups: AuthAPISpecs.Enums.TabiyaRoles[]) {}
  async hasRole(role: AuthAPISpecs.Enums.TabiyaRoles): Promise<boolean> {
    // Only validate roles other than anonymous and registered users.
    if (role === AuthAPISpecs.Enums.TabiyaRoles.ANONYMOUS || role === AuthAPISpecs.Enums.TabiyaRoles.REGISTERED_USER) {
      return true;
    }

    return this.userGroups.includes(role);
  }
}

/**
 * Machine to Machine Token Authorizer.
 * e.g.: On a backend service or server-to-server communication.
 */
export class MachineToMachineTokenAuthorizer implements Authorizer {
  constructor(
    private readonly accessKeyService: IAccessKeyService,
    private readonly clientId: string
  ) {}
  async hasRole(role: AuthAPISpecs.Enums.TabiyaRoles): Promise<boolean> {
    const m2mClient = await this.accessKeyService.findByKeyId(AccessKeyType.M2M_CLIENT_ID, this.clientId);
    if (!m2mClient) {
      return false;
    }

    if (role === AuthAPISpecs.Enums.TabiyaRoles.ANONYMOUS) return true;

    const requiredLevel = TabiyaRoleLevels[role];
    const apiKeyLevel = TabiyaRoleLevels[m2mClient.role];

    return requiredLevel <= apiKeyLevel;
  }
}
