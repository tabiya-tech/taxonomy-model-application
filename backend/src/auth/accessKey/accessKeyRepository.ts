import mongoose from "mongoose";
import { AccessKeyType, IAccessKey, IAccessKeyDoc } from "./accessKey.types";

export interface IAccessKeyRepository {
  readonly Model: mongoose.Model<IAccessKeyDoc>;

  /**
   * Find an access key by its key type and key id.
   */
  findByKeyId(keyType: AccessKeyType, keyId: string): Promise<IAccessKey | null>;

  /**
   * Create a new access key.
   * @param accessKey
   */
  create(accessKey: IAccessKey): Promise<IAccessKey>;
}

export class AccessKeyRepository implements IAccessKeyRepository {
  public readonly Model: mongoose.Model<IAccessKeyDoc>;

  constructor(model: mongoose.Model<IAccessKeyDoc>) {
    this.Model = model;
  }

  async findByKeyId(keyType: AccessKeyType, keyId: string): Promise<IAccessKey | null> {
    try {
      const accessKey = await this.Model.findOne({ keyId: { $eq: keyId }, keyType: { $eq: keyType } });

      if (!accessKey) {
        return null;
      }

      // Transform the DB Result.
      return {
        keyType: accessKey.keyType,
        keyId: accessKey.keyId,
        role: accessKey.role,
      };
    } catch (e: unknown) {
      const err = new Error("Error finding access key by key id", { cause: e });
      console.error(err);
      throw err;
    }
  }

  async create(accessKey: IAccessKey): Promise<IAccessKey> {
    try {
      const accessKeyDoc = await this.Model.create({
        keyType: accessKey.keyType,
        keyId: accessKey.keyId,
        role: accessKey.role,
      });

      return {
        keyType: accessKeyDoc.keyType,
        keyId: accessKeyDoc.keyId,
        role: accessKeyDoc.role,
      };
    } catch (e: unknown) {
      const err = new Error("Error creating access key", { cause: e });
      console.error(err);
      throw err;
    }
  }
}
