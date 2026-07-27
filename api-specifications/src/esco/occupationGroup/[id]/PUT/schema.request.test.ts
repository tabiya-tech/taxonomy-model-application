import {
  testNonEmptyStringField,
  testNonEmptyURIStringField,
  testObjectIdField,
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testStringField,
  testUUIDArray,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";
import { randomUUID } from "crypto";
import { getTestString } from "_test_utilities/specialCharacters";
import { assertCaseForProperty, CaseType, constructSchemaError } from "_test_utilities/assertCaseForProperty";
import { getMockId } from "_test_utilities/mockMongoId";
import OccupationGroupAPISpecs from "../../index";
import OccupationGroupEnums from "../../_shared/enums";
import OccupationGroupConstants from "../../_shared/constants";
import OccupationGroupRegexes from "../../_shared/regex";
import { getTestISCOGroupCode, getTestLocalGroupCode } from "../../../_test_utilities/testUtils";

describe("OccupationGroupAPISpecs.OccupationGroup.PUT.Schemas.Request.Payload schema", () => {
  testValidSchema(
    "OccupationGroupAPISpecs.OccupationGroup.PUT.Schemas.Request.Payload",
    OccupationGroupAPISpecs.OccupationGroup.PUT.Schemas.Request.Payload
  );
});

describe("Test objects against the OccupationGroupAPISpecs.OccupationGroup.PUT.Schemas.Request.Payload schema", () => {
  const validPayload = {
    originUri: "https://path/to/group",
    groupType: OccupationGroupEnums.ObjectTypes.LocalGroup,
    code: getTestLocalGroupCode(),
    description: getTestString(OccupationGroupConstants.DESCRIPTION_MAX_LENGTH),
    preferredLabel: getTestString(OccupationGroupConstants.PREFERRED_LABEL_MAX_LENGTH),
    altLabels: [getTestString(OccupationGroupConstants.ALT_LABEL_MAX_LENGTH)],
    modelId: getMockId(1),
    UUIDHistory: [randomUUID(), randomUUID()],
  };

  testSchemaWithValidObject(
    "valid payload",
    OccupationGroupAPISpecs.OccupationGroup.PUT.Schemas.Request.Payload,
    validPayload
  );

  testSchemaWithValidObject(
    "valid ISCO group payload",
    OccupationGroupAPISpecs.OccupationGroup.PUT.Schemas.Request.Payload,
    {
      ...validPayload,
      groupType: OccupationGroupEnums.ObjectTypes.ISCOGroup,
      code: getTestISCOGroupCode(),
    }
  );

  testSchemaWithAdditionalProperties(
    "payload with additional properties",
    OccupationGroupAPISpecs.OccupationGroup.PUT.Schemas.Request.Payload,
    { ...validPayload, extraProperty: "foo" }
  );

  describe("OccupationGroupAPISpecs.OccupationGroup.PUT.Schemas.Request.Payload fields", () => {
    describe("Test validation of 'code'", () => {
      test.each([
        [
          CaseType.Failure,
          "undefined",
          undefined,
          OccupationGroupEnums.ObjectTypes.LocalGroup,
          constructSchemaError("", "required", "must have required property 'code'"),
        ],
        [
          CaseType.Failure,
          "null",
          null,
          OccupationGroupEnums.ObjectTypes.LocalGroup,
          constructSchemaError("/code", "type", "must be string"),
        ],
        [
          CaseType.Failure,
          "an ISCO code for a local group",
          getTestISCOGroupCode(),
          OccupationGroupEnums.ObjectTypes.LocalGroup,
          constructSchemaError(
            "/code",
            "pattern",
            `must match pattern "${OccupationGroupRegexes.Str.LOCAL_GROUP_CODE}"`
          ),
        ],
        [
          CaseType.Failure,
          "a local code for an ISCO group",
          getTestLocalGroupCode(),
          OccupationGroupEnums.ObjectTypes.ISCOGroup,
          constructSchemaError(
            "/code",
            "pattern",
            `must match pattern "${OccupationGroupRegexes.Str.ISCO_GROUP_CODE}"`
          ),
        ],
        [
          CaseType.Success,
          "a valid local code",
          getTestLocalGroupCode(),
          OccupationGroupEnums.ObjectTypes.LocalGroup,
          undefined,
        ],
        [
          CaseType.Success,
          "a valid ISCO code",
          getTestISCOGroupCode(),
          OccupationGroupEnums.ObjectTypes.ISCOGroup,
          undefined,
        ],
      ] as const)(
        "%s Validate 'code' when it is %s with %s groupType",
        (caseType, _description, code, groupType, failureMessage) => {
          assertCaseForProperty(
            "code",
            { ...validPayload, code, groupType },
            OccupationGroupAPISpecs.OccupationGroup.PUT.Schemas.Request.Payload,
            caseType,
            failureMessage
          );
        }
      );
    });

    describe("Test validation of 'originUri'", () => {
      testNonEmptyURIStringField<OccupationGroupAPISpecs.OccupationGroup.PUT.Types.Request.Payload>(
        "originUri",
        OccupationGroupConstants.ORIGIN_URI_MAX_LENGTH,
        OccupationGroupAPISpecs.OccupationGroup.PUT.Schemas.Request.Payload
      );
    });

    describe("Test validation of 'description'", () => {
      testStringField<OccupationGroupAPISpecs.OccupationGroup.PUT.Types.Request.Payload>(
        "description",
        OccupationGroupConstants.DESCRIPTION_MAX_LENGTH,
        OccupationGroupAPISpecs.OccupationGroup.PUT.Schemas.Request.Payload
      );
    });

    describe("Test validation of 'preferredLabel'", () => {
      testNonEmptyStringField<OccupationGroupAPISpecs.OccupationGroup.PUT.Types.Request.Payload>(
        "preferredLabel",
        OccupationGroupConstants.PREFERRED_LABEL_MAX_LENGTH,
        OccupationGroupAPISpecs.OccupationGroup.PUT.Schemas.Request.Payload
      );
    });

    describe("Test validation of 'modelId'", () => {
      testObjectIdField("modelId", OccupationGroupAPISpecs.OccupationGroup.PUT.Schemas.Request.Payload);
    });

    describe("Test validation of 'UUIDHistory'", () => {
      testUUIDArray<OccupationGroupAPISpecs.OccupationGroup.PUT.Types.Request.Payload>(
        "UUIDHistory",
        OccupationGroupAPISpecs.OccupationGroup.PUT.Schemas.Request.Payload
      );
    });
  });
});
