import { Connection } from "mongoose";

import { initializeSchemaAndModel } from "auth/accessKey/accessKeyModel";
import { AccessKeyRepository } from "auth/accessKey/accessKeyRepository";
import { AccessKeyService, IAccessKeyService } from "auth/accessKey/accessKeyService";

export class DependencyRegistry {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly _services: Map<string, any> = new Map<string, any>();

  public get accessKey(): IAccessKeyService {
    return this._services.get("AccessKeyService");
  }

  public set accessKey(service: IAccessKeyService) {
    this._services.set("AccessKeyService", service);
  }

  public async initialize(dbConnection: Connection) {
    // Initialize the models.
    const AccessKeyModel = initializeSchemaAndModel(dbConnection);

    // Create database indexes.
    await AccessKeyModel.createIndexes();

    // Construct the repository
    const accessKeyRepository = new AccessKeyRepository(AccessKeyModel);

    // Construct the service
    this.accessKey = new AccessKeyService(accessKeyRepository);
  }
}

const _dependencyRegistryInstance: DependencyRegistry = new DependencyRegistry();

export function getDependencyRegistry(): DependencyRegistry {
  return _dependencyRegistryInstance;
}
