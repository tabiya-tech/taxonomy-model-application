import {
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";
import { getTestString } from "../../../../_test_utilities/specialCharacters";
import {
  getTestLocalGroupCode,
  getTestESCOOccupationCode,
  getTestISCOGroupCode,
  getTestLocalOccupationCode,
  getTestESCOLocalOccupationCode,
} from "../../../_test_utilities/testUtils";
import { CaseType, assertCaseForProperty, constructSchemaError } from "_test_utilities/assertCaseForProperty";
import OccupationAPISpecs from "../../index";
import { getMockId } from "_test_utilities/mockMongoId";
import OccupationEnums from "../../_shared/enums";
import { RegExp_Str_ID } from "../../../../regex";

describe("OccupationAPISpecs.Occupation.PATCH.Schemas.Request.Payload schema", () => {
  testValidSchema(
    "OccupationAPISpecs.Occupation.PATCH.Schemas.Request.Payload",
    OccupationAPISpecs.Occupation.PATCH.Schemas.Request.Payload
  );
});

describe("Test objects against the OccupationAPISpecs.Occupation.PATCH.Schemas.Request.Payload schema", () => {
  testSchemaWithValidObject(
    "empty payload (all fields optional)",
    OccupationAPISpecs.Occupation.PATCH.Schemas.Request.Payload,
    {}
  );

  testSchemaWithValidObject("single field payload", OccupationAPISpecs.Occupation.PATCH.Schemas.Request.Payload, {
    preferredLabel: "updated label",
  });

  testSchemaWithAdditionalProperties(
    "payload with additional properties",
    OccupationAPISpecs.Occupation.PATCH.Schemas.Request.Payload,
    {
      extraProperty: "extra test property (not defined in schema) for testing additionalProperties",
    }
  );

  describe("OccupationAPISpecs.Occupation.PATCH.Schemas.Request.Payload fields", () => {
    describe("Test validation of 'code' when occupationType is provided", () => {
      test.each([
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
          "a valid code of different type",
          getTestLocalOccupationCode(),
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
          "a valid code of different type",
          getTestESCOOccupationCode(),
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
        [
          CaseType.Success,
          "a valid ESCO local occupation code",
          getTestESCOLocalOccupationCode(),
          OccupationEnums.OccupationType.LocalOccupation,
          undefined,
        ],
      ] as const)(
        "%s Validate 'code' when it is %s with %s occupationType",
        (caseType, _description, givenValue, occupationType, failureMessage) => {
          assertCaseForProperty(
            "code",
            { code: givenValue, occupationType },
            OccupationAPISpecs.Occupation.PATCH.Schemas.Request.Payload,
            caseType,
            failureMessage
          );
        }
      );
    });

    describe("Test validation of 'occupationGroupCode' when occupationType is provided", () => {
      test.each([
        [
          CaseType.Failure,
          "null",
          null,
          OccupationEnums.OccupationType.ESCOOccupation,
          constructSchemaError("/occupationGroupCode", "type", "must be string"),
        ],
        [
          CaseType.Failure,
          "a valid code of different type",
          getTestLocalGroupCode(),
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
          CaseType.Success,
          "a valid code",
          getTestLocalGroupCode(),
          OccupationEnums.OccupationType.LocalOccupation,
          undefined,
        ],
        [
          CaseType.Success,
          "a valid ISCO group code",
          getTestISCOGroupCode(),
          OccupationEnums.OccupationType.LocalOccupation,
          undefined,
        ],
      ] as const)(
        "%s Validate 'occupationGroupCode' when it is %s with %s occupationType",
        (caseType, _description, givenValue, occupationType, failureMessage) => {
          assertCaseForProperty(
            "occupationGroupCode",
            { occupationGroupCode: givenValue, occupationType },
            OccupationAPISpecs.Occupation.PATCH.Schemas.Request.Payload,
            caseType,
            failureMessage
          );
        }
      );
    });

    describe("Test validation of description", () => {
      test.each([
        [CaseType.Success, "undefined", undefined, undefined],
        [CaseType.Failure, "null", null, constructSchemaError("/description", "type", "must be string")],
        [CaseType.Failure, "a number", 123, constructSchemaError("/description", "type", "must be string")],
        [CaseType.Success, "a valid string", getTestString(100), undefined],
      ])("(%s) Validate 'description' when it is %s", (caseType, _desc, value, failure) => {
        assertCaseForProperty(
          "description",
          { description: value },
          OccupationAPISpecs.Occupation.PATCH.Schemas.Request.Payload,
          caseType,
          failure
        );
      });
    });

    describe("Test validation of preferredLabel", () => {
      test.each([
        [CaseType.Success, "undefined", undefined, undefined],
        [CaseType.Failure, "null", null, constructSchemaError("/preferredLabel", "type", "must be string")],
        [
          CaseType.Failure,
          "empty string",
          "",
          constructSchemaError("/preferredLabel", "pattern", `must match pattern "\\S"`),
        ],
        [CaseType.Success, "a valid string", "label", undefined],
      ])("(%s) Validate 'preferredLabel' when it is %s", (caseType, _desc, value, failure) => {
        assertCaseForProperty(
          "preferredLabel",
          { preferredLabel: value },
          OccupationAPISpecs.Occupation.PATCH.Schemas.Request.Payload,
          caseType,
          failure
        );
      });
    });

    describe("Test validation of 'altLabels'", () => {
      test.each([
        [CaseType.Success, "undefined", undefined, undefined],
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
        [CaseType.Success, "an array of valid strings", [getTestString(100), getTestString(50)], undefined],
      ])("(%s) Validate 'altLabels' when %s", (caseType, _desc, value, failure) => {
        assertCaseForProperty(
          "altLabels",
          { altLabels: value },
          OccupationAPISpecs.Occupation.PATCH.Schemas.Request.Payload,
          caseType,
          failure
        );
      });
    });

    describe("Test validation of 'definition'", () => {
      test.each([
        [CaseType.Success, "undefined", undefined, undefined],
        [CaseType.Failure, "null", null, constructSchemaError("/definition", "type", "must be string")],
        [CaseType.Failure, "a number", 123, constructSchemaError("/definition", "type", "must be string")],
        [CaseType.Success, "a valid string", getTestString(100), undefined],
      ])("(%s) Validate 'definition' when it is %s", (caseType, _desc, value, failure) => {
        assertCaseForProperty(
          "definition",
          { definition: value },
          OccupationAPISpecs.Occupation.PATCH.Schemas.Request.Payload,
          caseType,
          failure
        );
      });
    });

    describe("Test validation of 'originUri'", () => {
      test.each([
        [CaseType.Success, "undefined", undefined, undefined],
        [CaseType.Failure, "null", null, constructSchemaError("/originUri", "type", "must be string")],
        [
          CaseType.Failure,
          "empty string",
          "",
          constructSchemaError("/originUri", "pattern", `must match pattern "\\S"`),
        ],
        [
          CaseType.Failure,
          "invalid format",
          "not-a-uri",
          constructSchemaError("/originUri", "format", 'must match format "uri"'),
        ],
        [CaseType.Success, "a valid URI", "https://example.com", undefined],
      ])("(%s) Validate 'originUri' when it is %s", (caseType, _desc, value, failure) => {
        assertCaseForProperty(
          "originUri",
          { originUri: value },
          OccupationAPISpecs.Occupation.PATCH.Schemas.Request.Payload,
          caseType,
          failure
        );
      });
    });

    describe("Test validation of 'modelId'", () => {
      test.each([
        [CaseType.Success, "undefined", undefined, undefined],
        [CaseType.Failure, "null", null, constructSchemaError("/modelId", "type", "must be string")],
        [
          CaseType.Failure,
          "invalid ObjectId",
          "not-a-valid-id",
          constructSchemaError("/modelId", "pattern", `must match pattern "${RegExp_Str_ID}"`),
        ],
        [CaseType.Success, "a valid ObjectId", getMockId(1), undefined],
      ])("(%s) Validate 'modelId' when it is %s", (caseType, _desc, value, failure) => {
        assertCaseForProperty(
          "modelId",
          { modelId: value },
          OccupationAPISpecs.Occupation.PATCH.Schemas.Request.Payload,
          caseType,
          failure
        );
      });
    });

    describe("Test validation of 'UUIDHistory'", () => {
      test.each([
        [CaseType.Success, "undefined", undefined, undefined],
        [CaseType.Failure, "null", null, constructSchemaError("/UUIDHistory", "type", "must be array")],
        [CaseType.Failure, "empty string", "", constructSchemaError("/UUIDHistory", "type", "must be array")],
        [CaseType.Success, "empty array", [], undefined],
      ])("(%s) Validate 'UUIDHistory' when it is %s", (caseType, _desc, value, failure) => {
        assertCaseForProperty(
          "UUIDHistory",
          { UUIDHistory: value },
          OccupationAPISpecs.Occupation.PATCH.Schemas.Request.Payload,
          caseType,
          failure
        );
      });
    });

    describe("Test validation of 'regulatedProfessionNote'", () => {
      test.each([
        [CaseType.Success, "undefined", undefined, undefined],
        [CaseType.Failure, "null", null, constructSchemaError("/regulatedProfessionNote", "type", "must be string")],
        [CaseType.Success, "a valid string", "note", undefined],
      ])("(%s) Validate 'regulatedProfessionNote' when it is %s", (caseType, _desc, value, failure) => {
        assertCaseForProperty(
          "regulatedProfessionNote",
          { regulatedProfessionNote: value },
          OccupationAPISpecs.Occupation.PATCH.Schemas.Request.Payload,
          caseType,
          failure
        );
      });
    });

    describe("Test validation of 'scopeNote'", () => {
      test.each([
        [CaseType.Success, "undefined", undefined, undefined],
        [CaseType.Failure, "null", null, constructSchemaError("/scopeNote", "type", "must be string")],
        [CaseType.Success, "a valid string", "note", undefined],
      ])("(%s) Validate 'scopeNote' when it is %s", (caseType, _desc, value, failure) => {
        assertCaseForProperty(
          "scopeNote",
          { scopeNote: value },
          OccupationAPISpecs.Occupation.PATCH.Schemas.Request.Payload,
          caseType,
          failure
        );
      });
    });

    describe("Test validation of 'isLocalized'", () => {
      test.each([
        [CaseType.Success, "undefined", undefined, undefined],
        [CaseType.Success, "true", true, undefined],
        [CaseType.Success, "false", false, undefined],
        [CaseType.Failure, "string", "true", constructSchemaError("/isLocalized", "type", "must be boolean")],
        [CaseType.Failure, "number", 1, constructSchemaError("/isLocalized", "type", "must be boolean")],
      ])("(%s) Validate 'isLocalized' when %s", (caseType, _desc, value, failure) => {
        assertCaseForProperty(
          "isLocalized",
          { isLocalized: value },
          OccupationAPISpecs.Occupation.PATCH.Schemas.Request.Payload,
          caseType,
          failure
        );
      });
    });

    describe("Test validation of occupationType", () => {
      test.each([
        [CaseType.Success, "undefined", undefined, undefined],
        [CaseType.Failure, "null", null, constructSchemaError("/occupationType", "type", "must be string")],
        [
          CaseType.Failure,
          "empty string",
          "",
          constructSchemaError("/occupationType", "enum", "must be equal to one of the allowed values"),
        ],
        [
          CaseType.Failure,
          "invalid",
          "invalidType",
          constructSchemaError("/occupationType", "enum", "must be equal to one of the allowed values"),
        ],
        [CaseType.Success, "ESCOOccupation", OccupationEnums.OccupationType.ESCOOccupation, undefined],
        [CaseType.Success, "LocalOccupation", OccupationEnums.OccupationType.LocalOccupation, undefined],
      ])("%s Validate 'occupationType' when it is %s", (caseType, _desc, value, failure) => {
        assertCaseForProperty(
          "occupationType",
          { occupationType: value },
          OccupationAPISpecs.Occupation.PATCH.Schemas.Request.Payload,
          caseType,
          failure
        );
      });
    });
  });
});
