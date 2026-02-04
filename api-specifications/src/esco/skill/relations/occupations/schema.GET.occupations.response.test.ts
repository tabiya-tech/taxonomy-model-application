import {
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";
import { getStdLimitTestCases, getStdCursorTestCases } from "_test_utilities/stdSchemaTestCases";
import { assertCaseForProperty, CaseType, constructSchemaError } from "_test_utilities/assertCaseForProperty";
import { getTestString } from "_test_utilities/specialCharacters";
import { getMockId } from "_test_utilities/mockMongoId";
import { randomUUID } from "crypto";
import SkillConstants from "../../constants";
import SkillAPISpecs from "../../index";
import SkillEnums from "../../enums";
import OccupationEnums from "../../../occupation/enums";
import { getTestESCOOccupationCode } from "../../../_test_utilities/testUtils";
import OccupationConstants from "../../../occupation/constants";

describe("Test Skill Occupations Response Schema Validity", () => {
  testValidSchema(
    "SkillAPISpecs.Schemas.GET.Occupations.Response.Payload",
    SkillAPISpecs.Schemas.GET.Occupations.Response.Payload
  );
});

describe("Test objects against the SkillAPISpecs.Schemas.GET.Occupations.Response.Payload schema", () => {
  const givenValidOccupation = {
    id: getMockId(1),
    UUID: randomUUID(),
    originUUID: randomUUID(),
    UUIDHistory: [randomUUID()],
    path: "https://path/to/tabiya",
    tabiyaPath: "https://path/to/tabiya",
    originUri: "https://foo/bar",
    code: getTestESCOOccupationCode(),
    occupationGroupCode: "1234.1",
    preferredLabel: getTestString(OccupationConstants.PREFERRED_LABEL_MAX_LENGTH),
    altLabels: [getTestString(OccupationConstants.ALT_LABEL_MAX_LENGTH)],
    definition: getTestString(OccupationConstants.DEFINITION_MAX_LENGTH),
    description: getTestString(OccupationConstants.DESCRIPTION_MAX_LENGTH),
    regulatedProfessionNote: getTestString(OccupationConstants.REGULATED_PROFESSION_NOTE_MAX_LENGTH),
    scopeNote: getTestString(OccupationConstants.SCOPE_NOTE_MAX_LENGTH),
    isLocalized: true,
    occupationType: OccupationEnums.OccupationType.ESCOOccupation,
    modelId: getMockId(1),
    parent: null,
    children: [],
    requiresSkills: [],
    relationType: SkillEnums.OccupationToSkillRelationType.ESSENTIAL,
    signallingValue: 50,
    signallingValueLabel: SkillEnums.SignallingValueLabel.MEDIUM,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const givenValidPaginatedResponse = {
    data: [givenValidOccupation],
    limit: SkillConstants.MAX_LIMIT,
    nextCursor: getTestString(SkillConstants.MAX_CURSOR_LENGTH),
  };

  testSchemaWithValidObject(
    "SkillAPISpecs.Schemas.GET.Occupations.Response.Payload",
    SkillAPISpecs.Schemas.GET.Occupations.Response.Payload,
    givenValidPaginatedResponse
  );

  testSchemaWithAdditionalProperties(
    "SkillAPISpecs.Schemas.GET.Occupations.Response.Payload",
    SkillAPISpecs.Schemas.GET.Occupations.Response.Payload,
    {
      ...givenValidPaginatedResponse,
      extraProperty: "extra test property",
    }
  );

  describe("Validate SkillAPISpecs.Schemas.GET.Occupations.Response.Payload fields", () => {
    const givenSchema = SkillAPISpecs.Schemas.GET.Occupations.Response.Payload;

    describe("Test validation of 'limit'", () => {
      const testCases = getStdLimitTestCases("limit", SkillConstants.MAX_LIMIT, true);
      test.each(testCases)("%s %s", (caseType, desc, value, failure) => {
        const givenObject = { ...givenValidPaginatedResponse, limit: value };
        if (value === undefined) delete (givenObject as Record<string, unknown>).limit;
        assertCaseForProperty("limit", givenObject, givenSchema, caseType, failure);
      });
    });

    describe("Test validation of 'nextCursor'", () => {
      const testCases = getStdCursorTestCases("nextCursor", SkillConstants.MAX_CURSOR_LENGTH, false, true);
      test.each(testCases)(`(%s) Validate 'nextCursor' when it is %s`, (caseType, _desc, value, failureMessage) => {
        const givenObject = { ...givenValidPaginatedResponse, nextCursor: value };
        if (value === undefined) delete (givenObject as Record<string, unknown>).nextCursor;
        assertCaseForProperty("nextCursor", givenObject, givenSchema, caseType, failureMessage);
      });
    });

    describe("Test validation of occupation item fields", () => {
      const itemSchema = {
        ...SkillAPISpecs.Schemas.GET.Occupations.Response.Payload.properties.data.items,
        $id: "SkillOccupationsResponseItemTestSchema",
      };

      describe("Test validation of 'relationType'", () => {
        test.each([
          [CaseType.Success, "null", null, undefined],
          [CaseType.Success, "essential", SkillEnums.OccupationToSkillRelationType.ESSENTIAL, undefined],
          [CaseType.Success, "optional", SkillEnums.OccupationToSkillRelationType.OPTIONAL, undefined],
          [
            CaseType.Failure,
            "invalid value",
            "invalid",
            constructSchemaError("/relationType", "enum", "must be equal to one of the allowed values"),
          ],
        ])("%s Validate 'relationType' when it is %s", (caseType, _description, givenValue, failureMessage) => {
          const givenObject = {
            ...givenValidOccupation,
            relationType: givenValue,
          };
          assertCaseForProperty("relationType", givenObject, itemSchema, caseType, failureMessage);
        });
      });

      describe("Test validation of 'signallingValue'", () => {
        test.each([
          [CaseType.Success, "null", null, undefined],
          [CaseType.Success, "minimum value", SkillConstants.SIGNALLING_VALUE_MIN, undefined],
          [CaseType.Success, "maximum value", SkillConstants.SIGNALLING_VALUE_MAX, undefined],
          [CaseType.Success, "mid value", 50, undefined],
          [
            CaseType.Failure,
            "below minimum",
            SkillConstants.SIGNALLING_VALUE_MIN - 1,
            constructSchemaError("/signallingValue", "minimum", `must be >= ${SkillConstants.SIGNALLING_VALUE_MIN}`),
          ],
          [
            CaseType.Failure,
            "above maximum",
            SkillConstants.SIGNALLING_VALUE_MAX + 1,
            constructSchemaError("/signallingValue", "maximum", `must be <= ${SkillConstants.SIGNALLING_VALUE_MAX}`),
          ],
        ])("%s Validate 'signallingValue' when it is %s", (caseType, _description, givenValue, failureMessage) => {
          const givenObject = {
            ...givenValidOccupation,
            signallingValue: givenValue,
          };
          assertCaseForProperty("signallingValue", givenObject, itemSchema, caseType, failureMessage);
        });
      });

      describe("Test validation of 'signallingValueLabel'", () => {
        test.each([
          [CaseType.Success, "null", null, undefined],
          [CaseType.Success, "valid label", "high", undefined],
          [
            CaseType.Success,
            "max length label",
            getTestString(SkillConstants.SIGNALLING_VALUE_LABEL_MAX_LENGTH),
            undefined,
          ],
        ])("%s Validate 'signallingValueLabel' when it is %s", (caseType, _description, givenValue, failureMessage) => {
          const givenObject = {
            ...givenValidOccupation,
            signallingValueLabel: givenValue,
          };
          assertCaseForProperty("signallingValueLabel", givenObject, itemSchema, caseType, failureMessage);
        });
      });
    });
  });
});
