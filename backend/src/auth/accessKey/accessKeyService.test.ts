//mute chatty console
import "_test_utilities/consoleMock";

import AuthAPISpecs from "api-specifications/auth";

import { IAccessKeyRepository } from "./accessKeyRepository";
import { AccessKeyService } from "./accessKeyService";
import { AccessKeyType } from "./accessKey.types";

describe("AccessKeyService", () => {
  let repository: IAccessKeyRepository;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findByKeyId: jest.fn(),
    } as unknown as IAccessKeyRepository;
  });

  describe("findByKeyId", () => {
    test("should return the result from the repository", async () => {
      // GIVEN repository.findByKeyId will return a successful response
      const expectedAccessKey = { keyType: "type", keyId: "id" };
      (repository.findByKeyId as jest.Mock).mockResolvedValue(expectedAccessKey);

      const givenKeyType = AccessKeyType.API_KEY;
      const givenKeyId = "id";

      // WHEN the service.findByKeyId is called with the same properties
      const service = new AccessKeyService(repository);
      const result = await service.findByKeyId(givenKeyType, givenKeyId);

      // THEN expect the result to be the same as the one returned by the repository
      expect(result).toEqual(expectedAccessKey);

      // AND expect the repository.findByKeyId to have been called with the same properties
      expect(repository.findByKeyId).toHaveBeenCalledWith(givenKeyType, givenKeyId);
    });

    test("should handle the failure of repository.findByKeyId", async () => {
      // GIVEN repository.findByKeyId will throw an error
      const givenError = new Error("repository error");
      (repository.findByKeyId as jest.Mock).mockRejectedValue(givenError);

      const givenKeyType = AccessKeyType.API_KEY;
      const givenKeyId = "id";

      // WHEN the service.findByKeyId is called
      const service = new AccessKeyService(repository);

      // THEN expect it to throw an error with the expected message
      await expect(service.findByKeyId(givenKeyType, givenKeyId)).rejects.toThrow("Error finding access key by key id");

      // AND expect console.error to have been called
      expect(console.error).toHaveBeenCalledWith(expect.any(Error));

      // AND expect the error to have the original error as its cause
      expect((console.error as jest.Mock).mock.calls[0][0].cause).toBe(givenError);

      // AND repository.create should be called with the given properties
      expect(repository.findByKeyId).toHaveBeenCalledWith(givenKeyType, givenKeyId);
    });
  });

  describe("create", () => {
    test("should return the result from the repository", async () => {
      // GIVEN repository.create will return a successful response
      const expectedAccessKey = { keyType: "type", keyId: "id" };
      (repository.create as jest.Mock).mockResolvedValue(expectedAccessKey);

      const givenAccessKey = {
        keyType: AccessKeyType.API_KEY,
        keyId: "id",
        role: AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER,
      };

      // WHEN the service.create is called with the same properties
      const service = new AccessKeyService(repository);
      const result = await service.create(givenAccessKey);

      // THEN expect the result to be the same as the one returned by the repository
      expect(result).toEqual(expectedAccessKey);

      // AND expect the repository.create to have been called with the same properties
      expect(repository.create).toHaveBeenCalledWith(givenAccessKey);
    });

    test("should handle the failure of repository.create", async () => {
      // GIVEN repository.create will throw an error
      const givenError = new Error("repository error");
      (repository.create as jest.Mock).mockRejectedValue(givenError);

      const givenAccessKey = {
        keyType: AccessKeyType.API_KEY,
        keyId: "id",
        role: AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER,
      };

      // WHEN the service.create is called
      const service = new AccessKeyService(repository);

      // THEN expect it to throw an error with the expected message
      await expect(service.create(givenAccessKey)).rejects.toThrow("Error creating access key");

      // AND expect console.error to have been called
      expect(console.error).toHaveBeenCalledWith(expect.any(Error));

      // AND repository.create should be called with the given properties
      expect(repository.create).toHaveBeenCalledWith(givenAccessKey);
    });
  });
});
