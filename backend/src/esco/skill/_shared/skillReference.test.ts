import { getSkillDocReference, SkillDocument, unwrapSkillTranslatableFields } from "./skillReference";
import { getFallbackLanguageConfig } from "common/language/fallbackLanguage";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { randomUUID } from "node:crypto";
import { ISkillDoc, ReuseLevel, SkillType } from "./skill.types";

describe("Test getSkillDocReference()", () => {
  const givenFallbackDbKeyName = getFallbackLanguageConfig().dbKeyName;

  function getBaseSkillDocument(preferredLabel: unknown): SkillDocument {
    return {
      modelId: getMockStringId(1),
      id: getMockStringId(2),
      UUID: randomUUID(),
      isLocalized: false,
      preferredLabel,
    } as unknown as SkillDocument;
  }

  test("should read the fallback language's value when preferredLabel is a localized sub document", () => {
    // GIVEN a skill document whose preferredLabel is a localized sub document
    const givenSkill = getBaseSkillDocument({ [givenFallbackDbKeyName]: "communicate in a foreign language" });

    // WHEN the skill's reference is built
    const actualReference = getSkillDocReference(givenSkill);

    // THEN expect the reference's preferredLabel to be the fallback language's value
    expect(actualReference.preferredLabel).toEqual("communicate in a foreign language");
  });

  test("should pass a flat string preferredLabel through as-is, for a document that predates the localized fields migration", () => {
    // GIVEN a skill document whose preferredLabel is still a flat string (not yet migrated)
    const givenSkill = getBaseSkillDocument("communicate in a foreign language");

    // WHEN the skill's reference is built
    const actualReference = getSkillDocReference(givenSkill);

    // THEN expect the reference's preferredLabel to be the flat string, not an empty string
    expect(actualReference.preferredLabel).toEqual("communicate in a foreign language");
  });

  test("should return an empty string when preferredLabel does not carry the fallback language", () => {
    // GIVEN a skill document whose preferredLabel is a localized sub document without the fallback language
    const givenSkill = getBaseSkillDocument({ fr: "communiquer dans une langue étrangère" });

    // WHEN the skill's reference is built
    const actualReference = getSkillDocReference(givenSkill);

    // THEN expect the reference's preferredLabel to be an empty string
    expect(actualReference.preferredLabel).toEqual("");
  });

  test("should return an empty string when preferredLabel is missing", () => {
    // GIVEN a skill document without a preferredLabel
    const givenSkill = getBaseSkillDocument(undefined);

    // WHEN the skill's reference is built
    const actualReference = getSkillDocReference(givenSkill);

    // THEN expect the reference's preferredLabel to be an empty string
    expect(actualReference.preferredLabel).toEqual("");
  });
});

describe("Test unwrapSkillTranslatableFields()", () => {
  const givenFallbackDbKeyName = getFallbackLanguageConfig().dbKeyName;

  function getBasePlainSkill(overrides: Partial<ISkillDoc>): ISkillDoc {
    return {
      modelId: getMockStringId(1),
      UUID: randomUUID(),
      UUIDHistory: [randomUUID()],
      originUri: "https://foo.bar",
      skillType: SkillType.SkillCompetence,
      reuseLevel: ReuseLevel.CrossSector,
      isLocalized: false,
      preferredLabel: "",
      description: "",
      definition: "",
      scopeNote: "",
      altLabels: [],
      ...overrides,
    } as ISkillDoc;
  }

  test("should flatten localized sub documents to the fallback language's value", () => {
    // GIVEN a plain skill object whose translatable fields are localized sub documents
    const givenSkill = getBasePlainSkill({
      // @ts-expect-error the raw hydrated shape is a localized sub document, not the flat string ISkillDoc declares
      preferredLabel: { [givenFallbackDbKeyName]: "cook" },
      // @ts-expect-error see above
      description: { [givenFallbackDbKeyName]: "a description" },
      // @ts-expect-error see above
      altLabels: [{ [givenFallbackDbKeyName]: "chef" }, { [givenFallbackDbKeyName]: "culinary specialist" }],
    });

    // WHEN the skill's translatable fields are unwrapped
    const actualSkill = unwrapSkillTranslatableFields(givenSkill);

    // THEN expect the fields to be flattened to the fallback language's value
    expect(actualSkill.preferredLabel).toEqual("cook");
    expect(actualSkill.description).toEqual("a description");
    expect(actualSkill.altLabels).toEqual(["chef", "culinary specialist"]);
  });

  test("should pass flat string fields through as-is, for a document that predates the localized fields migration", () => {
    // GIVEN a plain skill object whose translatable fields are still flat strings (not yet migrated)
    const givenSkill = getBasePlainSkill({
      preferredLabel: "cook",
      description: "a description",
      altLabels: ["chef", "culinary specialist"],
    });

    // WHEN the skill's translatable fields are unwrapped
    const actualSkill = unwrapSkillTranslatableFields(givenSkill);

    // THEN expect the fields to be unchanged, not overwritten with empty strings
    expect(actualSkill.preferredLabel).toEqual("cook");
    expect(actualSkill.description).toEqual("a description");
    expect(actualSkill.altLabels).toEqual(["chef", "culinary specialist"]);
  });

  test("should return an empty string for a translatable field that does not carry the fallback language", () => {
    // GIVEN a plain skill object whose preferredLabel is a localized sub document without the fallback language
    const givenSkill = getBasePlainSkill({
      // @ts-expect-error the raw hydrated shape is a localized sub document, not the flat string ISkillDoc declares
      preferredLabel: { fr: "cuisinier" },
    });

    // WHEN the skill's translatable fields are unwrapped
    const actualSkill = unwrapSkillTranslatableFields(givenSkill);

    // THEN expect preferredLabel to be an empty string
    expect(actualSkill.preferredLabel).toEqual("");
  });
});
