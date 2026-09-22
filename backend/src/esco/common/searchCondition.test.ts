import LanguageAPISpecs from "api-specifications/language";
import { setConfiguration } from "server/config/config";
import { buildSearchCondition } from "./searchCondition";

const FALLBACK_DB_KEY_NAME = LanguageAPISpecs.Constants.FALLBACK_LANGUAGE.dbKeyName;

describe("Test buildSearchCondition()", () => {
  beforeEach(() => {
    // the environment is not configured, the fall back language is the one of the registry
    // @ts-ignore
    setConfiguration(undefined);
  });

  test("should match the value case insensitively on every requested field", () => {
    // GIVEN a search on fields that are not translated
    const givenSearch = { value: "cook", fields: ["code", "originUri"] };

    // WHEN the condition is built, for an entity with no translatable field
    const actualCondition = buildSearchCondition(givenSearch);

    // THEN expect every field to be matched as it is stored
    expect(actualCondition).toEqual({
      $or: [{ code: { $regex: "cook", $options: "i" } }, { originUri: { $regex: "cook", $options: "i" } }],
    });
  });

  test("should match a translatable field on the path of the fall back language", () => {
    // GIVEN a search on a translatable field and on a monolingual field
    const givenSearch = { value: "cook", fields: ["preferredLabel", "code"] };
    // AND preferredLabel is translated, code is not
    const givenTranslatableFields = ["preferredLabel", "altLabels"];

    // WHEN the condition is built
    const actualCondition = buildSearchCondition(givenSearch, givenTranslatableFields);

    // THEN expect the translatable field to be matched on its fall back language path, the other one as it is stored
    expect(actualCondition).toEqual({
      $or: [
        { [`preferredLabel.${FALLBACK_DB_KEY_NAME}`]: { $regex: "cook", $options: "i" } },
        { code: { $regex: "cook", $options: "i" } },
      ],
    });
  });

  test("should match the value literally, so that a regular expression cannot be injected", () => {
    // GIVEN a search value that carries regular expression special characters
    const givenSearch = { value: "a.*(b)", fields: ["code"] };

    // WHEN the condition is built
    const actualCondition = buildSearchCondition(givenSearch);

    // THEN expect the special characters to be escaped
    expect(actualCondition).toEqual({
      $or: [{ code: { $regex: "a\\.\\*\\(b\\)", $options: "i" } }],
    });
  });

  test("should return no clause when no field is requested", () => {
    // GIVEN a search that requests no field
    const givenSearch = { value: "cook", fields: [] };

    // WHEN the condition is built
    const actualCondition = buildSearchCondition(givenSearch);

    // THEN expect an empty $or to be returned
    expect(actualCondition).toEqual({ $or: [] });
  });
});
