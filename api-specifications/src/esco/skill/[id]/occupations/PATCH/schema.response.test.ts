import {
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
  testObjectIdField,
  testNonEmptyStringField,
  testStringField,
  testUUIDField,
  testUUIDArray,
  testNonEmptyURIStringField,
  testURIField,
  testBooleanField,
} from "_test_utilities/stdSchemaTests";
import { CaseType, assertCaseForProperty, constructSchemaError } from "_test_utilities/assertCaseForProperty";
import { getMockId } from "_test_utilities/mockMongoId";
import { randomUUID } from "crypto";
import { getTestString } from "../../../../../_test_utilities/specialCharacters";
import {
  getTestISCOGroupCode,
  getTestESCOOccupationCode,
  getTestLocalOccupationCode,
} from "../../../../_test_utilities/testUtils";

import SkillAPISpecs from "../../../index";
import SkillEnums from "../../../_shared/enums";
import SkillConstants from "../../../_shared/constants";
import OccupationEnums from "../../../../occupation/_shared/enums";
import OccupationConstants from "../../../../occupation/_shared/constants";
import OccupationAPISpecs from "../../../../occupation";

describe("SkillAPISpecs.Skill.Occupations.PATCH.Schemas.Response.Payload schema", () => {
  testValidSchema(
    "SkillAPISpecs.Skill.Occupations.PATCH.Schemas.Response.Payload",
    SkillAPISpecs.Skill.Occupations.PATCH.Schemas.Response.Payload
  );
});

describe("Test objects against the SkillAPISpecs.Skill.Occupations.PATCH.Schemas.Response.Payload schema", () => {
  const givenParent = {
    id: getMockId(1),
    UUID: randomUUID(),
    code: getTestISCOGroupCode(),
    occupationGroupCode: getTestISCOGroupCode(),
    preferredLabel: getTestString(20),
    objectType: OccupationEnums.Relations.Parent.ObjectTypes.ISCOGroup,
  };

  const givenChild = {
    id: getMockId(2),
    UUID: randomUUID(),
    code: getTestLocalOccupationCode(),
    preferredLabel: getTestString(20),
    objectType: OccupationEnums.Relations.Children.ObjectTypes.LocalOccupation,
  };

  const givenRequiredSkill = {
    id: getMockId(3),
    UUID: randomUUID(),
    preferredLabel: getTestString(20),
    isLocalized: true,
    objectType: OccupationEnums.Relations.RequiredSkills.ObjectTypes.Skill,
    relationType: OccupationEnums.OccupationToSkillRelationType.ESSENTIAL,
    signallingValue: null,
    signallingValueLabel: null,
  };

  const validOccupationResponse = {
    id: getMockId(4),
    UUID: randomUUID(),
    UUIDHistory: [randomUUID()],
    originUUID: randomUUID(),
    code: getTestESCOOccupationCode(),
    path: "https://path/to/tabiya",
    tabiyaPath: "https://path/to/tabiya",
    originUri: "https://foo/bar",
    occupationGroupCode: getTestISCOGroupCode(),
    description: getTestString(50),
    preferredLabel: getTestString(20),
    altLabels: [getTestString(15)],
    definition: getTestString(50),
    regulatedProfessionNote: getTestString(30),
    scopeNote: getTestString(30),
    occupationType: OccupationEnums.OccupationType.ESCOOccupation,
    modelId: getMockId(5),
    isLocalized: true,
    parent: givenParent,
    children: [givenChild],
    requiresSkills: [givenRequiredSkill],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    relationType: SkillEnums.OccupationToSkillRelationType.ESSENTIAL,
    signallingValue: 50,
    signallingValueLabel: getTestString(20),
  };

  testSchemaWithValidObject(
    "valid occupation response with all fields",
    SkillAPISpecs.Skill.Occupations.PATCH.Schemas.Response.Payload,
    validOccupationResponse
  );

  testSchemaWithValidObject(
    "valid occupation response with null relationship metadata",
    SkillAPISpecs.Skill.Occupations.PATCH.Schemas.Response.Payload,
    { ...validOccupationResponse, relationType: null, signallingValue: null, signallingValueLabel: null }
  );

  testSchemaWithAdditionalProperties(
    "payload with additional properties",
    SkillAPISpecs.Skill.Occupations.PATCH.Schemas.Response.Payload,
    {
      ...validOccupationResponse,
      extraProperty: "extra test property (not defined in schema) for testing additionalProperties",
    }
  );

  describe("SkillAPISpecs.Skill.Occupations.PATCH.Schemas.Response.Payload fields", () => {
    const itemSchema = SkillAPISpecs.Skill.Occupations.PATCH.Schemas.Response.Payload;

    describe("Test validation of inherited occupation fields", () => {
      describe("Test validation of 'id'", () => {
        testObjectIdField("id", itemSchema);
      });

      describe("Test validation of 'UUID'", () => {
        testUUIDField("UUID", itemSchema);
      });

      describe("Test validation of 'originUUID'", () => {
        testUUIDField("originUUID", itemSchema);
      });

      describe("Test validation of 'UUIDHistory'", () => {
        testUUIDArray("UUIDHistory", itemSchema, [], true, true);
      });

      describe("Test validation of 'path'", () => {
        testURIField("path", OccupationConstants.PATH_URI_MAX_LENGTH, itemSchema);
      });

      describe("Test validation of 'tabiyaPath'", () => {
        testURIField("tabiyaPath", OccupationConstants.TABIYA_PATH_URI_MAX_LENGTH, itemSchema);
      });

      describe("Test validation of 'originUri'", () => {
        testNonEmptyURIStringField("originUri", OccupationConstants.ORIGIN_URI_MAX_LENGTH, itemSchema);
      });

      describe("Test validation of 'preferredLabel'", () => {
        testNonEmptyStringField("preferredLabel", OccupationConstants.PREFERRED_LABEL_MAX_LENGTH, itemSchema);
      });

      describe("Test validation of 'description'", () => {
        testStringField("description", OccupationConstants.DESCRIPTION_MAX_LENGTH, itemSchema);
      });

      describe("Test validation of 'definition'", () => {
        testStringField("definition", OccupationConstants.DEFINITION_MAX_LENGTH, itemSchema);
      });

      describe("Test validation of 'regulatedProfessionNote'", () => {
        testStringField(
          "regulatedProfessionNote",
          OccupationConstants.REGULATED_PROFESSION_NOTE_MAX_LENGTH,
          itemSchema
        );
      });

      describe("Test validation of 'scopeNote'", () => {
        testStringField("scopeNote", OccupationConstants.SCOPE_NOTE_MAX_LENGTH, itemSchema);
      });

      describe("Test validation of 'altLabels'", () => {
        test.each([
          [
            CaseType.Failure,
            "undefined",
            undefined,
            constructSchemaError("", "required", "must have required property 'altLabels'"),
          ],
          [CaseType.Failure, "null", null, constructSchemaError("/altLabels", "type", "must be array")],
          [CaseType.Failure, "empty string", "", constructSchemaError("/altLabels", "type", "must be array")],
          [
            CaseType.Failure,
            "array of objects",
            [{}, {}],
            [
              constructSchemaError("/altLabels/0", "type", "must be string"),
              constructSchemaError("/altLabels/1", "type", "must be string"),
            ],
          ],
          [CaseType.Success, "empty array", [], undefined],
          [CaseType.Success, "valid array", [getTestString(15), getTestString(20)], undefined],
        ])("(%s) Validate 'altLabels' when it is %s", (caseType, _description, givenValue, failureMessage) => {
          const givenObject = { ...validOccupationResponse, altLabels: givenValue };
          assertCaseForProperty("altLabels", givenObject, itemSchema, caseType, failureMessage);
        });
      });

      describe("Test validation of 'code'", () => {
        test.each([
          [
            CaseType.Failure,
            "undefined",
            undefined,
            OccupationEnums.OccupationType.ESCOOccupation,
            constructSchemaError("", "required", "must have required property 'code'"),
          ],
          [
            CaseType.Failure,
            "null",
            null,
            OccupationEnums.OccupationType.ESCOOccupation,
            constructSchemaError("/code", "type", "must be string"),
          ],
          [
            CaseType.Failure,
            "empty string",
            "",
            OccupationEnums.OccupationType.ESCOOccupation,
            constructSchemaError(
              "/code",
              "pattern",
              `must match pattern "${OccupationAPISpecs.Patterns.Str.ESCO_OCCUPATION_CODE}"`
            ),
          ],
          [
            CaseType.Failure,
            "an invalid code",
            "1234",
            OccupationEnums.OccupationType.ESCOOccupation,
            constructSchemaError(
              "/code",
              "pattern",
              `must match pattern "${OccupationAPISpecs.Patterns.Str.ESCO_OCCUPATION_CODE}"`
            ),
          ],
          [
            CaseType.Success,
            "a valid code",
            getTestESCOOccupationCode(),
            OccupationEnums.OccupationType.ESCOOccupation,
            undefined,
          ],
          [
            CaseType.Failure,
            "an invalid code",
            "1234",
            OccupationEnums.OccupationType.LocalOccupation,
            constructSchemaError(
              "/code",
              "pattern",
              `must match pattern "${OccupationAPISpecs.Patterns.Str.ESCO_LOCAL_OR_LOCAL_OCCUPATION_CODE}"`
            ),
          ],
          [
            CaseType.Success,
            "a valid local occupation code",
            getTestLocalOccupationCode(),
            OccupationEnums.OccupationType.LocalOccupation,
            undefined,
          ],
        ] as const)(
          "%s Validate 'code' when it is %s with %s occupationType",
          (caseType, _description, givenValue, occupationType, failureMessage) => {
            const givenObject = {
              ...validOccupationResponse,
              code: givenValue,
              occupationType,
              // Fix for LocalOccupation: it requires signallingValue and signallingValueLabel in requiresSkills
              ...(occupationType === OccupationEnums.OccupationType.LocalOccupation
                ? {
                    requiresSkills: [
                      {
                        ...givenRequiredSkill,
                        relationType: null,
                        signallingValue: 1,
                        signallingValueLabel: "High",
                      },
                    ],
                  }
                : {}),
            };

            assertCaseForProperty("code", givenObject, itemSchema, caseType, failureMessage);
          }
        );
      });

      describe("Test validation of 'occupationGroupCode'", () => {
        test.each([
          [
            CaseType.Failure,
            "undefined",
            undefined,
            OccupationEnums.OccupationType.ESCOOccupation,
            constructSchemaError("", "required", "must have required property 'occupationGroupCode'"),
          ],
          [
            CaseType.Failure,
            "null",
            null,
            OccupationEnums.OccupationType.ESCOOccupation,
            constructSchemaError("/occupationGroupCode", "type", "must be string"),
          ],
          [
            CaseType.Failure,
            "an invalid code",
            "abcd",
            OccupationEnums.OccupationType.ESCOOccupation,
            constructSchemaError(
              "/occupationGroupCode",
              "pattern",
              `must match pattern "${OccupationAPISpecs.Patterns.Str.ISCO_GROUP_CODE}"`
            ),
          ],
          [
            CaseType.Success,
            "a valid code",
            getTestISCOGroupCode(),
            OccupationEnums.OccupationType.ESCOOccupation,
            undefined,
          ],
          [
            CaseType.Failure,
            "an invalid code",
            "1.2",
            OccupationEnums.OccupationType.LocalOccupation,
            constructSchemaError(
              "/occupationGroupCode",
              "pattern",
              `must match pattern "${OccupationAPISpecs.Patterns.Str.LOCAL_GROUP_CODE}|${OccupationAPISpecs.Patterns.Str.ISCO_GROUP_CODE}"`
            ),
          ],
          [
            CaseType.Success,
            "a valid code",
            getTestISCOGroupCode(),
            OccupationEnums.OccupationType.LocalOccupation,
            undefined,
          ],
        ] as const)(
          "%s Validate 'occupationGroupCode' when it is %s with %s occupationType",
          (caseType, _description, givenValue, occupationType, failureMessage) => {
            const givenObject = {
              ...validOccupationResponse,
              occupationType,
              occupationGroupCode: givenValue,
              // Fix for LocalOccupation
              ...(occupationType === OccupationEnums.OccupationType.LocalOccupation
                ? {
                    code: getTestLocalOccupationCode(),
                    requiresSkills: [
                      {
                        ...givenRequiredSkill,
                        relationType: null,
                        signallingValue: 1,
                        signallingValueLabel: "High",
                      },
                    ],
                  }
                : {}),
            };

            assertCaseForProperty("occupationGroupCode", givenObject, itemSchema, caseType, failureMessage);
          }
        );
      });

      describe("Test validation of 'occupationType'", () => {
        test.each([
          [
            CaseType.Failure,
            "undefined",
            undefined,
            constructSchemaError("", "required", "must have required property 'occupationType'"),
          ],
          [CaseType.Failure, "null", null, constructSchemaError("/occupationType", "type", "must be string")],
          [
            CaseType.Failure,
            "invalid value",
            "invalid",
            constructSchemaError("/occupationType", "enum", "must be equal to one of the allowed values"),
          ],
          [CaseType.Success, "escooccupation", OccupationEnums.OccupationType.ESCOOccupation, undefined],
          [CaseType.Success, "localoccupation", OccupationEnums.OccupationType.LocalOccupation, undefined],
        ])("%s Validate 'occupationType' when it is %s", (caseType, _description, givenValue, failureMessage) => {
          const givenObject = {
            ...validOccupationResponse,
            occupationType: givenValue,
            ...(givenValue === OccupationEnums.OccupationType.LocalOccupation
              ? { code: getTestLocalOccupationCode() }
              : {}),
          };
          assertCaseForProperty("occupationType", givenObject, itemSchema, caseType, failureMessage);
        });
      });

      describe("Test validation of 'modelId'", () => {
        testObjectIdField("modelId", itemSchema);
      });

      describe("Test validation of 'isLocalized'", () => {
        testBooleanField("isLocalized", itemSchema);
      });
    });

    describe("Test validation of relationship metadata fields", () => {
      describe("Test validation of 'relationType'", () => {
        test.each([
          [CaseType.Success, "null", null, undefined],
          [CaseType.Success, "empty string (NONE)", SkillEnums.OccupationToSkillRelationType.NONE, undefined],
          [CaseType.Success, "essential", SkillEnums.OccupationToSkillRelationType.ESSENTIAL, undefined],
          [CaseType.Success, "optional", SkillEnums.OccupationToSkillRelationType.OPTIONAL, undefined],
          [
            CaseType.Failure,
            "invalid string",
            "invalid",
            constructSchemaError("/relationType", "enum", "must be equal to one of the allowed values"),
          ],
        ])("%s Validate 'relationType' when it is %s", (caseType, _description, givenValue, failureMessage) => {
          const givenObject = { ...validOccupationResponse, relationType: givenValue };
          assertCaseForProperty("relationType", givenObject, itemSchema, caseType, failureMessage);
        });
      });

      describe("Test validation of 'signallingValue'", () => {
        test.each([
          [CaseType.Success, "null", null, undefined],
          [CaseType.Success, "valid number", 50, undefined],
          [CaseType.Success, "minimum", SkillConstants.SIGNALLING_VALUE_MIN, undefined],
          [CaseType.Success, "maximum", SkillConstants.SIGNALLING_VALUE_MAX, undefined],
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
          const givenObject = { ...validOccupationResponse, signallingValue: givenValue };
          assertCaseForProperty("signallingValue", givenObject, itemSchema, caseType, failureMessage);
        });
      });

      describe("Test validation of 'signallingValueLabel'", () => {
        test.each([
          [CaseType.Success, "null", null, undefined],
          [CaseType.Success, "valid string", getTestString(20), undefined],
          [
            CaseType.Failure,
            "only whitespace",
            "   ",
            constructSchemaError("/signallingValueLabel", "pattern", `must match pattern "\\S"`),
          ],
          [
            CaseType.Failure,
            "too long",
            getTestString(SkillConstants.SIGNALLING_VALUE_LABEL_MAX_LENGTH + 1),
            constructSchemaError(
              "/signallingValueLabel",
              "maxLength",
              `must NOT have more than ${SkillConstants.SIGNALLING_VALUE_LABEL_MAX_LENGTH} characters`
            ),
          ],
        ])("%s Validate 'signallingValueLabel' when it is %s", (caseType, _description, givenValue, failureMessage) => {
          const givenObject = { ...validOccupationResponse, signallingValueLabel: givenValue };
          assertCaseForProperty("signallingValueLabel", givenObject, itemSchema, caseType, failureMessage);
        });
      });
    });
  });
});
