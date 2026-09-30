import {
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";
import { randomUUID } from "crypto";
import { getTestString } from "_test_utilities/specialCharacters";
import { assertCaseForProperty, CaseType, constructSchemaError } from "_test_utilities/assertCaseForProperty";
import { getMockId } from "_test_utilities/mockMongoId";
import OccupationGroupAPISpecs from "../../index";
import LanguageAPISpecs from "language";
import { testTranslatedStringArrayField, testTranslatedStringField } from "_test_utilities/translatedFieldTests";
import OccupationGroupEnums from "../../_shared/enums";
import OccupationGroupConstants from "../../_shared/constants";
import OccupationGroupRegexes from "../../_shared/regex";
import { getTestISCOGroupCode, getTestLocalGroupCode } from "../../../_test_utilities/testUtils";

describe("OccupationGroupAPISpecs.OccupationGroup.PATCH.Schemas.Request.Payload schema", () => {
  testValidSchema(
    "OccupationGroupAPISpecs.OccupationGroup.PATCH.Schemas.Request.Payload",
    OccupationGroupAPISpecs.OccupationGroup.PATCH.Schemas.Request.Payload
  );
});

describe("Test objects against the OccupationGroupAPISpecs.OccupationGroup.PATCH.Schemas.Request.Payload schema", () => {
  const validPayload = {
    originUri: "https://path/to/group",
    groupType: OccupationGroupEnums.ObjectTypes.LocalGroup,
    code: getTestLocalGroupCode(),
    description: {
      [LanguageAPISpecs.Constants.FALLBACK_LANGUAGE.dbKeyName]: getTestString(
        OccupationGroupConstants.DESCRIPTION_MAX_LENGTH
      ),
    },
    preferredLabel: {
      [LanguageAPISpecs.Constants.FALLBACK_LANGUAGE.dbKeyName]: getTestString(
        OccupationGroupConstants.PREFERRED_LABEL_MAX_LENGTH
      ),
    },
    altLabels: [
      {
        [LanguageAPISpecs.Constants.FALLBACK_LANGUAGE.dbKeyName]: getTestString(
          OccupationGroupConstants.ALT_LABEL_MAX_LENGTH
        ),
      },
    ],
    modelId: getMockId(1),
    UUIDHistory: [randomUUID(), randomUUID()],
  };

  testSchemaWithValidObject(
    "empty payload (all fields optional)",
    OccupationGroupAPISpecs.OccupationGroup.PATCH.Schemas.Request.Payload,
    {}
  );

  testSchemaWithValidObject(
    "single field payload",
    OccupationGroupAPISpecs.OccupationGroup.PATCH.Schemas.Request.Payload,
    {
      preferredLabel: { fr: "Directeurs" },
    }
  );

  testSchemaWithValidObject(
    "payload deleting a non fallback language via null",
    OccupationGroupAPISpecs.OccupationGroup.PATCH.Schemas.Request.Payload,
    {
      description: { fr: null },
    }
  );

  testSchemaWithValidObject(
    "valid payload",
    OccupationGroupAPISpecs.OccupationGroup.PATCH.Schemas.Request.Payload,
    validPayload
  );

  testSchemaWithValidObject(
    "valid ISCO group payload",
    OccupationGroupAPISpecs.OccupationGroup.PATCH.Schemas.Request.Payload,
    {
      ...validPayload,
      groupType: OccupationGroupEnums.ObjectTypes.ISCOGroup,
      code: getTestISCOGroupCode(),
    }
  );

  testSchemaWithAdditionalProperties(
    "payload with additional properties",
    OccupationGroupAPISpecs.OccupationGroup.PATCH.Schemas.Request.Payload,
    { ...validPayload, extraProperty: "foo" }
  );

  describe("OccupationGroupAPISpecs.OccupationGroup.PATCH.Schemas.Request.Payload fields", () => {
    describe("Test validation of 'code'", () => {
      test.each([
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
            OccupationGroupAPISpecs.OccupationGroup.PATCH.Schemas.Request.Payload,
            caseType,
            failureMessage
          );
        }
      );
    });

    describe("Test validation of 'description'", () => {
      testTranslatedStringField(
        "description",
        OccupationGroupConstants.DESCRIPTION_MAX_LENGTH,
        OccupationGroupAPISpecs.OccupationGroup.PATCH.Schemas.Request.Payload,
        "patch"
      );
    });

    describe("Test validation of 'preferredLabel'", () => {
      testTranslatedStringField(
        "preferredLabel",
        OccupationGroupConstants.PREFERRED_LABEL_MAX_LENGTH,
        OccupationGroupAPISpecs.OccupationGroup.PATCH.Schemas.Request.Payload,
        "patch"
      );
    });

    describe("Test validation of 'altLabels'", () => {
      testTranslatedStringArrayField(
        "altLabels",
        OccupationGroupConstants.ALT_LABEL_MAX_LENGTH,
        OccupationGroupAPISpecs.OccupationGroup.PATCH.Schemas.Request.Payload,
        "patch"
      );
    });

    testSchemaWithValidObject(
      "code without groupType uses the base code schema",
      OccupationGroupAPISpecs.OccupationGroup.PATCH.Schemas.Request.Payload,
      { code: "any-code-without-type" }
    );
  });
});
