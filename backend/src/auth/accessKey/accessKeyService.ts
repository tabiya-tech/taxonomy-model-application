import { AccessKeyType, IAccessKey } from "./accessKey.types";
import { IAccessKeyRepository } from "./accessKeyRepository";

export interface IAccessKeyService {
  /**
   * Find an access key by its key type and key id.
   *
   * Note: This function is not expected to throw.
   */
  findByKeyId(keyType: AccessKeyType, keyId: string): Promise<IAccessKey | null>;

  /**
   * Create a new access key.
   *
   * @param accessKey
   */
  create(accessKey: IAccessKey): Promise<IAccessKey>;
}

export class AccessKeyService implements IAccessKeyService {
  constructor(private readonly repository: IAccessKeyRepository) {}

  async findByKeyId(keyType: AccessKeyType, keyId: string): Promise<IAccessKey | null> {
    try {
      return await this.repository.findByKeyId(keyType, keyId);
    } catch (e) {
      const error = new Error("Error finding access key by key id", { cause: e });
      console.error(error);
      throw error;
    }
  }

  async create(accessKey: IAccessKey): Promise<IAccessKey> {
    try {
      return await this.repository.create(accessKey);
    } catch (e) {
      const error = new Error("Error creating access key", { cause: e });
      console.error(error);
      throw error;
    }
  }
}
