import { findUnsupportedLanguage, findUnsupportedLanguageInPartialSpec } from "./validateOccupationLanguages";
import { INewOccupationSpecWithoutImportId, IPartialUpdateOccupationSpec } from "../_shared/occupation.types";
import { ObjectTypes } from "esco/common/objectTypes";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { getRandomString } from "_test_utilities/getMockRandomData";

// GIVEN a function to build a valid new occupation spec, translatable fields in the fall back language only
function getGivenSpec(): INewOccupationSpecWithoutImportId {
  return {
    modelId: getMockStringId(1),
    preferredLabel: { en: getRandomString(10) },
    code: getRandomString(5),
    altLabels: [{ en: getRandomString(5) }],
    description: { en: getRandomString(20) },
    definition: { en: getRandomString(20) },
    scopeNote: { en: getRandomString(20) },
    regulatedProfessionNote: { en: getRandomString(20) },
    occupationType: ObjectTypes.ESCOOccupation,
    isLocalized: false,
    originUri: getRandomString(10),
    occupationGroupCode: getRandomString(5),
    UUIDHistory: [],
  };
}

describe("Test findUnsupportedLanguage()", () => {
  test("should return null when every language used is available", () => {
    // GIVEN a spec translated in the fall back language only
    const givenSpec = getGivenSpec();
    givenSpec.preferredLabel = { en: "Cook", fr: "Cuisinier" };

    // WHEN checking the spec against a model that has both languages available
    const actual = findUnsupportedLanguage(givenSpec, ["en", "fr"]);

    // THEN expect no unsupported language to be found
    expect(actual).toBeNull();
  });

  test("should return the field and language when a scalar translatable field carries an unavailable language", () => {
    // GIVEN a spec whose preferredLabel is translated in a language the model does not have
    const givenSpec = getGivenSpec();
    givenSpec.preferredLabel = { en: "Cook", fr: "Cuisinier" };

    // WHEN checking the spec against a model that only has the fall back language available
    const actual = findUnsupportedLanguage(givenSpec, ["en"]);

    // THEN expect the field and the unsupported language to be returned
    expect(actual).toEqual({ field: "preferredLabel", language: "fr" });
  });

  test("should return the field and language when an altLabels item carries an unavailable language", () => {
    // GIVEN a spec whose altLabels carry a language the model does not have
    const givenSpec = getGivenSpec();
    givenSpec.altLabels = [{ en: "Chef" }, { en: "Line cook", fr: "Cuisinier de ligne" }];

    // WHEN checking the spec against a model that only has the fall back language available
    const actual = findUnsupportedLanguage(givenSpec, ["en"]);

    // THEN expect altLabels and the unsupported language to be returned
    expect(actual).toEqual({ field: "altLabels", language: "fr" });
  });

  test("should return the field and language for regulatedProfessionNote, the occupation-only field", () => {
    // GIVEN a spec whose regulatedProfessionNote carries a language the model does not have
    const givenSpec = getGivenSpec();
    givenSpec.regulatedProfessionNote = { en: "Not regulated", fr: "Non réglementée" };

    // WHEN checking the spec against a model that only has the fall back language available
    const actual = findUnsupportedLanguage(givenSpec, ["en"]);

    // THEN expect regulatedProfessionNote and the unsupported language to be returned
    expect(actual).toEqual({ field: "regulatedProfessionNote", language: "fr" });
  });
});

describe("Test findUnsupportedLanguageInPartialSpec()", () => {
  test("should return null when a field is entirely absent from the spec", () => {
    // GIVEN a partial spec that does not carry preferredLabel at all
    const givenSpec: IPartialUpdateOccupationSpec = { description: { en: "Prepares food" } };

    // WHEN checking the spec against a model that only has the fall back language available
    const actual = findUnsupportedLanguageInPartialSpec(givenSpec, ["en"]);

    // THEN expect no unsupported language to be found
    expect(actual).toBeNull();
  });

  test("should return the field and language when a present field sets a string value in an unavailable language", () => {
    // GIVEN a partial spec whose preferredLabel sets a language the model does not have
    const givenSpec: IPartialUpdateOccupationSpec = { preferredLabel: { fr: "Cuisinier" } };

    // WHEN checking the spec against a model that only has the fall back language available
    const actual = findUnsupportedLanguageInPartialSpec(givenSpec, ["en"]);

    // THEN expect the field and the unsupported language to be returned
    expect(actual).toEqual({ field: "preferredLabel", language: "fr" });
  });

  test("should return null when a present field only deletes a language via null, even if that language is unavailable", () => {
    // GIVEN a partial spec that deletes a language the model does not have
    const givenSpec: IPartialUpdateOccupationSpec = { preferredLabel: { fr: null } };

    // WHEN checking the spec against a model that only has the fall back language available
    const actual = findUnsupportedLanguageInPartialSpec(givenSpec, ["en"]);

    // THEN expect no unsupported language to be found, deleting a language is never rejected
    expect(actual).toBeNull();
  });

  test("should return the field and language when altLabels carries an item translated in an unavailable language", () => {
    // GIVEN a partial spec whose altLabels carry a language the model does not have
    const givenSpec: IPartialUpdateOccupationSpec = { altLabels: [{ en: "Chef", fr: "Chef" }] };

    // WHEN checking the spec against a model that only has the fall back language available
    const actual = findUnsupportedLanguageInPartialSpec(givenSpec, ["en"]);

    // THEN expect altLabels and the unsupported language to be returned
    expect(actual).toEqual({ field: "altLabels", language: "fr" });
  });
});
