// silence chatty console
import "_test_utilities/consoleMock";

import { EmbeddingQueueJobSchema, validateEmbeddingQueueJob } from "./queueJob.schema";
import { EmbeddableEntityType, EmbeddableField, IGenerateEmbeddingTask } from "embeddings/service/types";
import { getMockStringId } from "_test_utilities/mockMongoId";

function getValidEmbeddingQueueJob(): IGenerateEmbeddingTask {
  return {
    modelId: getMockStringId(1),
    entityId: getMockStringId(2),
    entityType: EmbeddableEntityType.Skill,
    fields: [EmbeddableField.preferredLabel, EmbeddableField.description],
  };
}

describe("Test the EmbeddingQueueJobSchema", () => {
  test("the schema should have a valid $id", () => {
    // GIVEN the EmbeddingQueueJobSchema
    // THEN expect the schema to have a $id
    expect(EmbeddingQueueJobSchema.$id).toBe("/components/schemas/EmbeddingQueueJobSchema");
  });

  test("should validate a valid embedding queue job", () => {
    // GIVEN a valid embedding queue job
    const givenJob = getValidEmbeddingQueueJob();

    // WHEN the job is validated
    const actualIsValid = validateEmbeddingQueueJob(givenJob);

    // THEN expect the job to be valid
    expect(actualIsValid).toBe(true);
    // AND expect no validation errors
    expect(validateEmbeddingQueueJob.errors).toBeNull();
  });

  test("should not validate a job with additional properties", () => {
    // GIVEN a job with additional properties
    const givenJob = { ...getValidEmbeddingQueueJob(), foo: "bar" };

    // WHEN the job is validated
    const actualIsValid = validateEmbeddingQueueJob(givenJob);

    // THEN expect the job to be invalid
    expect(actualIsValid).toBe(false);
  });

  describe.each([["modelId"], ["entityId"], ["entityType"], ["fields"]])(
    "should not validate a job that is missing the required property '%s'",
    (propertyName) => {
      test(`missing '${propertyName}'`, () => {
        // GIVEN a job that is missing the given required property
        const givenJob: Partial<IGenerateEmbeddingTask> = getValidEmbeddingQueueJob();
        delete givenJob[propertyName as keyof IGenerateEmbeddingTask];

        // WHEN the job is validated
        const actualIsValid = validateEmbeddingQueueJob(givenJob);

        // THEN expect the job to be invalid
        expect(actualIsValid).toBe(false);
      });
    }
  );

  describe.each([["modelId"], ["entityId"]])("Test validation of the id field '%s'", (propertyName) => {
    test.each([
      ["not a valid object id", "foo", false],
      ["an empty string", "", false],
      ["a valid object id", getMockStringId(3), true],
    ])(`(%s) should validate '${propertyName}' accordingly`, (_description, givenValue, expectedIsValid) => {
      // GIVEN a job with the given value for the id field
      const givenJob = { ...getValidEmbeddingQueueJob(), [propertyName]: givenValue };

      // WHEN the job is validated
      const actualIsValid = validateEmbeddingQueueJob(givenJob);

      // THEN expect the job to validate accordingly
      expect(actualIsValid).toBe(expectedIsValid);
    });
  });

  describe("Test validation of 'entityType'", () => {
    test("should not validate a job with an unknown entityType", () => {
      // GIVEN a job with an unknown entityType
      const givenJob = { ...getValidEmbeddingQueueJob(), entityType: "UnknownEntityType" };

      // WHEN the job is validated
      const actualIsValid = validateEmbeddingQueueJob(givenJob);

      // THEN expect the job to be invalid
      expect(actualIsValid).toBe(false);
    });

    test.each(Object.values(EmbeddableEntityType))("should validate a job with entityType '%s'", (givenEntityType) => {
      // GIVEN a job with the given valid entityType
      const givenJob = { ...getValidEmbeddingQueueJob(), entityType: givenEntityType };

      // WHEN the job is validated
      const actualIsValid = validateEmbeddingQueueJob(givenJob);

      // THEN expect the job to be valid
      expect(actualIsValid).toBe(true);
    });
  });

  describe("Test validation of 'fields'", () => {
    test.each([
      ["an empty array", [], false],
      ["an array with an unknown field", ["unknownField"], false],
      ["an array with duplicate fields", [EmbeddableField.description, EmbeddableField.description], false],
      ["not an array", EmbeddableField.description, false],
      ["a valid array of fields", [EmbeddableField.preferredLabel, EmbeddableField.altLabels], true],
    ])("(%s) should validate 'fields' accordingly", (_description, givenValue, expectedIsValid) => {
      // GIVEN a job with the given value for the fields property
      const givenJob = { ...getValidEmbeddingQueueJob(), fields: givenValue };

      // WHEN the job is validated
      const actualIsValid = validateEmbeddingQueueJob(givenJob);

      // THEN expect the job to validate accordingly
      expect(actualIsValid).toBe(expectedIsValid);
    });
  });
});
