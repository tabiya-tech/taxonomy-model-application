import mongoose from "mongoose";
import { assertCaseForProperty, CaseType } from "_test_utilities/dataModel";
import { getTestString, WHITESPACE } from "_test_utilities/specialCharacters";
import { IMPORT_ID_MAX_LENGTH } from "esco/common/modelSchema";

export function testImportId<T>(getModel: () => mongoose.Model<T>) {
  test.each([
    [CaseType.Failure, "undefined", undefined, "Path `{0}` is required."],
    [CaseType.Failure, "null", null, "Path `{0}` is required."],
    [
      CaseType.Failure,
      "Too long importId",
      getTestString(IMPORT_ID_MAX_LENGTH + 1),
      `{0} must be at most ${IMPORT_ID_MAX_LENGTH} chars long`,
    ],
    [CaseType.Success, "only whitespace characters", WHITESPACE, undefined],
    [CaseType.Success, "empty", "", undefined],
    [CaseType.Success, "one letter", "a", undefined],
    [CaseType.Success, "The longest importId", getTestString(IMPORT_ID_MAX_LENGTH), undefined],
  ])(`(%s) Validate 'importId' when it is %s`, (caseType: CaseType, caseDescription, value, expectedFailureMessage) => {
    assertCaseForProperty<T>(getModel(), "importId", caseType, value, expectedFailureMessage);
  });
}
