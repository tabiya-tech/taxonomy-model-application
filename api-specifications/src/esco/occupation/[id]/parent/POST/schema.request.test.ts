import {
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";
import { CaseType, assertCaseForProperty, constructSchemaError } from "_test_utilities/assertCaseForProperty";
import { getMockId } from "_test_utilities/mockMongoId";
import { getStdObjectIdTestCases } from "_test_utilities/stdSchemaTestCases";
import OccupationAPISpecs from "../../../index";
import OccupationEnums from "../../../_shared/enums";

describe("OccupationAPISpecs.Occupation.Parent.POST.Schemas.Request.Payload schema", () => {
  testValidSchema(
    "OccupationAPISpecs.Occupation.Parent.POST.Schemas.Request.Payload",
    OccupationAPISpecs.Occupation.Parent.POST.Schemas.Request.Payload
  );
});

describe("Test objects against the OccupationAPISpecs.Occupation.Parent.POST.Schemas.Request.Payload schema", () => {
  const validPayload = {
    id: getMockId(1),
    objectType: OccupationEnums.Relations.Parent.ObjectTypes.ISCOGroup,
  };

  testSchemaWithValidObject(
    "valid payload with ISCOGroup",
    OccupationAPISpecs.Occupation.Parent.POST.Schemas.Request.Payload,
    validPayload
  );

  testSchemaWithValidObject(
    "valid payload with LocalGroup",
    OccupationAPISpecs.Occupation.Parent.POST.Schemas.Request.Payload,
    {
      id: getMockId(2),
      objectType: OccupationEnums.Relations.Parent.ObjectTypes.LocalGroup,
    }
  );

  testSchemaWithValidObject(
    "valid payload with ESCOOccupation",
    OccupationAPISpecs.Occupation.Parent.POST.Schemas.Request.Payload,
    {
      id: getMockId(3),
      objectType: OccupationEnums.Relations.Parent.ObjectTypes.ESCOOccupation,
    }
  );

  testSchemaWithValidObject(
    "valid payload with LocalOccupation",
    OccupationAPISpecs.Occupation.Parent.POST.Schemas.Request.Payload,
    {
      id: getMockId(4),
      objectType: OccupationEnums.Relations.Parent.ObjectTypes.LocalOccupation,
    }
  );

  testSchemaWithAdditionalProperties(
    "payload with additional properties",
    OccupationAPISpecs.Occupation.Parent.POST.Schemas.Request.Payload,
    {
      ...validPayload,
      extraProperty: "extra test property (not defined in schema) for testing additionalProperties",
    }
  );

  describe("OccupationAPISpecs.Occupation.Parent.POST.Schemas.Request.Payload fields", () => {
    describe("Test validation of 'id'", () => {
      const testCases = getStdObjectIdTestCases("/id");
      test.each(testCases)("%s Validate 'id' when it is %s", (caseType, _description, givenValue, failureMessage) => {
        assertCaseForProperty(
          "id",
          { id: givenValue, objectType: OccupationEnums.Relations.Parent.ObjectTypes.ISCOGroup },
          OccupationAPISpecs.Occupation.Parent.POST.Schemas.Request.Payload,
          caseType,
          failureMessage
        );
      });
    });

    describe("Test validation of 'objectType'", () => {
      test.each([
        [
          CaseType.Failure,
          "undefined",
          undefined,
          constructSchemaError("", "required", "must have required property 'objectType'"),
        ],
        [CaseType.Failure, "null", null, constructSchemaError("/objectType", "type", "must be string")],
        [CaseType.Failure, "boolean", true, constructSchemaError("/objectType", "type", "must be string")],
        [CaseType.Failure, "number", 123, constructSchemaError("/objectType", "type", "must be string")],
        [
          CaseType.Failure,
          "empty string",
          "",
          constructSchemaError("/objectType", "enum", "must be equal to one of the allowed values"),
        ],
        [
          CaseType.Failure,
          "only whitespace",
          "   ",
          constructSchemaError("/objectType", "enum", "must be equal to one of the allowed values"),
        ],
        [
          CaseType.Failure,
          "invalid value",
          "invalid",
          constructSchemaError("/objectType", "enum", "must be equal to one of the allowed values"),
        ],
        [
          CaseType.Failure,
          "wrong case",
          "ISCOGroup",
          constructSchemaError("/objectType", "enum", "must be equal to one of the allowed values"),
        ],
        [CaseType.Success, "ISCOGroup", OccupationEnums.Relations.Parent.ObjectTypes.ISCOGroup, undefined],
        [CaseType.Success, "LocalGroup", OccupationEnums.Relations.Parent.ObjectTypes.LocalGroup, undefined],
        [CaseType.Success, "ESCOOccupation", OccupationEnums.Relations.Parent.ObjectTypes.ESCOOccupation, undefined],
        [CaseType.Success, "LocalOccupation", OccupationEnums.Relations.Parent.ObjectTypes.LocalOccupation, undefined],
      ])("(%s) Validate 'objectType' when it is %s", (caseType, _desc, value, failure) => {
        assertCaseForProperty(
          "objectType",
          { id: getMockId(1), objectType: value },
          OccupationAPISpecs.Occupation.Parent.POST.Schemas.Request.Payload,
          caseType,
          failure
        );
      });
    });
  });
});
