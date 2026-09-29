import { getSkillGroupDocReference, SkillGroupDocument } from "./skillGroupReference";
import { getFallbackLanguageConfig } from "common/language/fallbackLanguage";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { randomUUID } from "node:crypto";
import { ObjectTypes } from "esco/common/objectTypes";

describe("Test getSkillGroupDocReference()", () => {
  const givenFallbackDbKeyName = getFallbackLanguageConfig().dbKeyName;

  function getBaseSkillGroupDocument(preferredLabel: unknown): SkillGroupDocument {
    return {
      modelId: getMockStringId(1),
      id: getMockStringId(2),
      UUID: randomUUID(),
      code: "S1",
      objectType: ObjectTypes.SkillGroup,
      preferredLabel,
    } as unknown as SkillGroupDocument;
  }

  test("should read the fallback language's value when no language is given and preferredLabel is a localized sub document", () => {
    // GIVEN a skill group document whose preferredLabel is a localized sub document
    const givenSkillGroup = getBaseSkillGroupDocument({ [givenFallbackDbKeyName]: "Communication skills" });

    // WHEN the reference is built with no language argument
    const actualReference = getSkillGroupDocReference(givenSkillGroup);

    // THEN expect the reference's preferredLabel to be the fallback language's value
    expect(actualReference.preferredLabel).toEqual("Communication skills");
  });

  test("should read the requested language's value when a language is given and the label has it", () => {
    // GIVEN a skill group document whose preferredLabel has both the fallback and a secondary language
    const givenSkillGroup = getBaseSkillGroupDocument({
      [givenFallbackDbKeyName]: "Communication skills",
      fr: "Compétences en communication",
    });

    // WHEN the reference is built with the secondary language
    const actualReference = getSkillGroupDocReference(givenSkillGroup, "fr");

    // THEN expect the reference's preferredLabel to be the French value
    expect(actualReference.preferredLabel).toEqual("Compétences en communication");
  });

  test("should fall back to the fallback language's value when the requested language is not present in the sub document", () => {
    // GIVEN a skill group document whose preferredLabel only has the fallback language
    const givenSkillGroup = getBaseSkillGroupDocument({ [givenFallbackDbKeyName]: "Communication skills" });

    // WHEN the reference is built requesting a language not in the document
    const actualReference = getSkillGroupDocReference(givenSkillGroup, "es");

    // THEN resolveTranslated falls back to the fallback language (not empty string)
    expect(actualReference.preferredLabel).toEqual("Communication skills");
  });

  test("should return an empty string when preferredLabel is a flat string (pre-migration document)", () => {
    // GIVEN a skill group document whose preferredLabel is a raw string (predates the localized field migration)
    const givenSkillGroup = getBaseSkillGroupDocument("Communication skills");

    // WHEN the reference is built
    const actualReference = getSkillGroupDocReference(givenSkillGroup);

    // THEN resolveTranslated cannot find any language key in a raw string and returns an empty string
    expect(actualReference.preferredLabel).toEqual("");
  });

  test("should return an empty string when preferredLabel is missing", () => {
    // GIVEN a skill group document without a preferredLabel
    const givenSkillGroup = getBaseSkillGroupDocument(undefined);

    // WHEN the reference is built
    const actualReference = getSkillGroupDocReference(givenSkillGroup);

    // THEN expect the reference's preferredLabel to be an empty string
    expect(actualReference.preferredLabel).toEqual("");
  });
});
