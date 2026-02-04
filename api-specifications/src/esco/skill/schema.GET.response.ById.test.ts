import { randomUUID } from "crypto";
import {
  testNonEmptyStringField,
  testNonEmptyURIStringField,
  testObjectIdField,
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testStringField,
  testTimestampField,
  testURIField,
  testUUIDArray,
  testUUIDField,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";

import SkillAPISpecs from "./index";
import SkillEnums from "./enums";

import { getTestString } from "_test_utilities/specialCharacters";
import { getMockId } from "_test_utilities/mockMongoId";
import { assertCaseForProperty, CaseType, constructSchemaError } from "_test_utilities/assertCaseForProperty";
import { getTestSkillGroupCode } from "../_test_utilities/testUtils";

describe("Test SkillAPISpecs GET ById Response schema validity", () => {
  // WHEN the SkillAPISpecs.Schemas.GET.Response.ById.Payload schema
  // THEN expect the givenSchema to be valid
  testValidSchema("SkillAPISpecs.Schemas.GET.Response.ById.Payload", SkillAPISpecs.Schemas.GET.Response.ById.Payload);
});

describe("Test objects against the SkillAPISpecs.Schemas.GET.Response.ById.Payload schema", () => {
  // GIVEN a valid parent response payload
  const givenParent = {
    id: getMockId(1),
    UUID: randomUUID(),
    code: getTestSkillGroupCode(),
    preferredLabel: getTestString(SkillAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
    objectType: SkillEnums.Relations.Parents.ObjectTypes.SkillGroup,
  };
  // GIVEN a valid child response payload
  const givenChild = {
    id: getMockId(2),
    UUID: randomUUID(),
    preferredLabel: getTestString(SkillAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
    objectType: SkillEnums.Relations.Children.ObjectTypes.Skill,
    skillType: SkillEnums.SkillType.SkillCompetence,
    reuseLevel: SkillEnums.ReuseLevel.CrossSector,
    isLocalized: true,
  };
  // GIVEN a valid skill to skill relation
  const givenSkillRelation = {
    id: getMockId(3),
    UUID: randomUUID(),
    preferredLabel: getTestString(SkillAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
    isLocalized: true,
    objectType: SkillEnums.ObjectTypes.Skill,
    skillType: SkillEnums.SkillType.SkillCompetence,
    reuseLevel: SkillEnums.ReuseLevel.CrossSector,
    relationType: SkillEnums.SkillToSkillRelationType.ESSENTIAL,
  } as const;
  // GIVEN a valid occupation relation
  const givenOccupationRelation = {
    id: getMockId(4),
    UUID: randomUUID(),
    preferredLabel: getTestString(SkillAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
    isLocalized: true,
    objectType: SkillEnums.OccupationObjectTypes.LocalOccupation,
    relationType: SkillEnums.OccupationToSkillRelationType.ESSENTIAL,
    signallingValue: 1,
    signallingValueLabel: SkillEnums.SignallingValueLabel.MEDIUM,
  } as const;

  // GIVEN a valid response payload object
  const validSkillResponsePayload: SkillAPISpecs.Types.GET.Response.ById.Payload = {
    id: getMockId(1),
    UUID: randomUUID(),
    originUUID: randomUUID(),
    path: "https://path/to/skill",
    tabiyaPath: "https://path/to/skill",
    originUri: "https://foo/bar",
    preferredLabel: getTestString(SkillAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
    altLabels: [getTestString(SkillAPISpecs.Constants.ALT_LABEL_MAX_LENGTH)],
    definition: getTestString(SkillAPISpecs.Constants.DEFINITION_MAX_LENGTH),
    description: getTestString(SkillAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
    scopeNote: getTestString(SkillAPISpecs.Constants.SCOPE_NOTE_MAX_LENGTH),
    skillType: SkillEnums.SkillType.SkillCompetence,
    reuseLevel: SkillEnums.ReuseLevel.CrossSector,
    isLocalized: true,
    objectType: SkillEnums.ObjectTypes.Skill,
    skillGroupCode: "S1.2.3",
    modelId: getMockId(1),
    parent: givenParent,
    children: [givenChild],
    requiresSkills: [givenSkillRelation],
    requiredBySkills: [givenSkillRelation],
    requiredByOccupations: [givenOccupationRelation],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    UUIDHistory: [randomUUID()],
  };

  // WHEN the object is valid
  // THEN expect the object to validate successfully
  testSchemaWithValidObject(
    "SkillAPISpecs.Schemas.GET.Response.ById.Payload",
    SkillAPISpecs.Schemas.GET.Response.ById.Payload,
    validSkillResponsePayload
  );

  // AND WHEN the object has additional properties
  // THEN expect the schema to not validate
  testSchemaWithAdditionalProperties(
    "SkillAPISpecs.Schemas.GET.Response.ById.Payload",
    SkillAPISpecs.Schemas.GET.Response.ById.Payload,
    { ...validSkillResponsePayload, additionalProperty: "foo" }
  );

  describe("Validate SkillAPISpecs.Schemas.GET.Response.ById.Payload fields", () => {
    describe("Test validate of 'id' ", () => {
      testObjectIdField("id", SkillAPISpecs.Schemas.GET.Response.ById.Payload);
    });
    describe("Test validate of 'UUID'", () => {
      testUUIDField<SkillAPISpecs.Types.GET.Response.ById.Payload>(
        "UUID",
        SkillAPISpecs.Schemas.GET.Response.ById.Payload
      );
    });

    describe("Test validate of 'originUUID'", () => {
      testUUIDField<SkillAPISpecs.Types.GET.Response.ById.Payload>(
        "originUUID",
        SkillAPISpecs.Schemas.GET.Response.ById.Payload
      );
    });

    describe("Test validate of 'UUIDHistory'", () => {
      testUUIDArray<SkillAPISpecs.Types.GET.Response.ById.Payload>(
        "UUIDHistory",
        SkillAPISpecs.Schemas.GET.Response.ById.Payload,
        [],
        true
      );
    });

    describe("Test validation of 'path'", () => {
      testURIField<SkillAPISpecs.Types.GET.Response.ById.Payload>(
        "path",
        SkillAPISpecs.Constants.PATH_URI_MAX_LENGTH,
        SkillAPISpecs.Schemas.GET.Response.ById.Payload
      );
    });

    describe("Test validation of 'tabiyaPath'", () => {
      testURIField<SkillAPISpecs.Types.GET.Response.ById.Payload>(
        "tabiyaPath",
        SkillAPISpecs.Constants.TABIYA_PATH_URI_MAX_LENGTH,
        SkillAPISpecs.Schemas.GET.Response.ById.Payload
      );
    });

    describe("Test validation of 'originUri'", () => {
      testNonEmptyURIStringField<SkillAPISpecs.Types.GET.Response.ById.Payload>(
        "originUri",
        SkillAPISpecs.Constants.ORIGIN_URI_MAX_LENGTH,
        SkillAPISpecs.Schemas.GET.Response.ById.Payload
      );
    });

    describe("Test validate of 'preferredLabel'", () => {
      testNonEmptyStringField<SkillAPISpecs.Types.GET.Response.ById.Payload>(
        "preferredLabel",
        SkillAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH,
        SkillAPISpecs.Schemas.GET.Response.ById.Payload
      );
    });

    describe("Test validate of 'altLabels'", () => {
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
          "an array of objects",
          [{}, {}],
          [
            constructSchemaError("/altLabels/0", "type", "must be string"),
            constructSchemaError("/altLabels/1", "type", "must be string"),
          ],
        ],
        [
          CaseType.Failure,
          "an array of same strings",
          ["foo", "foo"],
          constructSchemaError(
            "/altLabels",
            "uniqueItems",
            "must NOT have duplicate items (items ## 1 and 0 are identical)"
          ),
        ],
        [
          CaseType.Success,
          "an array of valid altLabels strings",
          [
            getTestString(SkillAPISpecs.Constants.ALT_LABEL_MAX_LENGTH),
            getTestString(SkillAPISpecs.Constants.ALT_LABEL_MAX_LENGTH - 1),
          ],
          undefined,
        ],
      ])("%s Validate 'altLabels' when it is %s", (caseType, __description, givenValue, failureMessage) => {
        // GIVEN an object with given value
        const givenObject = {
          altLabels: givenValue,
        };

        // THEN export the array to validate accordingly
        assertCaseForProperty(
          "altLabels",
          givenObject,
          SkillAPISpecs.Schemas.GET.Response.ById.Payload,
          caseType,
          failureMessage
        );
      });
    });

    describe("Test validate of 'definition'", () => {
      testStringField<SkillAPISpecs.Types.GET.Response.ById.Payload>(
        "definition",
        SkillAPISpecs.Constants.DEFINITION_MAX_LENGTH,
        SkillAPISpecs.Schemas.GET.Response.ById.Payload
      );
    });

    describe("Test validate of 'description'", () => {
      testStringField<SkillAPISpecs.Types.GET.Response.ById.Payload>(
        "description",
        SkillAPISpecs.Constants.DESCRIPTION_MAX_LENGTH,
        SkillAPISpecs.Schemas.GET.Response.ById.Payload
      );
    });

    describe("Test validate of 'scopeNote'", () => {
      testStringField<SkillAPISpecs.Types.GET.Response.ById.Payload>(
        "scopeNote",
        SkillAPISpecs.Constants.SCOPE_NOTE_MAX_LENGTH,
        SkillAPISpecs.Schemas.GET.Response.ById.Payload
      );
    });

    describe("Test validate of 'skillType'", () => {
      test.each([
        [
          CaseType.Failure,
          "undefined",
          undefined,
          constructSchemaError("", "required", "must have required property 'skillType'"),
        ],
        [CaseType.Failure, "null", null, constructSchemaError("/skillType", "type", "must be string")],
        [
          CaseType.Failure,
          "empty string",
          "",
          constructSchemaError("/skillType", "enum", "must be equal to one of the allowed values"),
        ],
        [
          CaseType.Failure,
          "invalid skillType",
          "foo",
          constructSchemaError("/skillType", "enum", "must be equal to one of the allowed values"),
        ],
        [CaseType.Success, "valid skillType", SkillEnums.SkillType.SkillCompetence, undefined],
      ])("%s Validate 'skillType' when it is %s", (caseType, __description, givenValue, failureMessage) => {
        // GIVEN an object with given value
        const givenObject = {
          skillType: givenValue,
        };
        // THEN export the object to validate accordingly
        assertCaseForProperty(
          "skillType",
          givenObject,
          SkillAPISpecs.Schemas.GET.Response.ById.Payload,
          caseType,
          failureMessage
        );
      });
    });

    describe("Test validate of 'reuseLevel'", () => {
      test.each([
        [
          CaseType.Failure,
          "undefined",
          undefined,
          constructSchemaError("", "required", "must have required property 'reuseLevel'"),
        ],
        [CaseType.Failure, "null", null, constructSchemaError("/reuseLevel", "type", "must be string")],
        [
          CaseType.Failure,
          "empty string",
          "",
          constructSchemaError("/reuseLevel", "enum", "must be equal to one of the allowed values"),
        ],
        [
          CaseType.Failure,
          "invalid reuseLevel",
          "foo",
          constructSchemaError("/reuseLevel", "enum", "must be equal to one of the allowed values"),
        ],
        [CaseType.Success, "valid reuseLevel", SkillEnums.ReuseLevel.CrossSector, undefined],
      ])("%s Validate 'reuseLevel' when it is %s", (caseType, __description, givenValue, failureMessage) => {
        // GIVEN an object with given value
        const givenObject = {
          reuseLevel: givenValue,
        };
        // THEN export the object to validate accordingly
        assertCaseForProperty(
          "reuseLevel",
          givenObject,
          SkillAPISpecs.Schemas.GET.Response.ById.Payload,
          caseType,
          failureMessage
        );
      });
    });

    describe("Test validate of 'isLocalized'", () => {
      test.each([
        [
          CaseType.Failure,
          "undefined",
          undefined,
          constructSchemaError("", "required", "must have required property 'isLocalized'"),
        ],
        [CaseType.Failure, "null", null, constructSchemaError("/isLocalized", "type", "must be boolean")],
        [CaseType.Success, "true", true, undefined],
        [CaseType.Success, "false", false, undefined],
      ])("%s Validate 'isLocalized' when it is %s", (caseType, __description, givenValue, failureMessage) => {
        // GIVEN an object with given value
        const givenObject = {
          isLocalized: givenValue,
        };
        // THEN export the object to validate accordingly
        assertCaseForProperty(
          "isLocalized",
          givenObject,
          SkillAPISpecs.Schemas.GET.Response.ById.Payload,
          caseType,
          failureMessage
        );
      });
    });

    describe("Test validation of 'modelId'", () => {
      testObjectIdField("modelId", SkillAPISpecs.Schemas.GET.Response.ById.Payload);
    });

    describe("Test validate of 'createdAt'", () => {
      testTimestampField<SkillAPISpecs.Types.GET.Response.ById.Payload>(
        "createdAt",
        SkillAPISpecs.Schemas.GET.Response.ById.Payload
      );
    });

    describe("Test validate of 'updatedAt'", () => {
      testTimestampField<SkillAPISpecs.Types.GET.Response.ById.Payload>(
        "updatedAt",
        SkillAPISpecs.Schemas.GET.Response.ById.Payload
      );
    });

    describe("Test validation of 'parent'", () => {
      test.each([
        [
          CaseType.Failure,
          "undefined",
          undefined,
          constructSchemaError("", "required", "must have required property 'parent'"),
        ],
        [CaseType.Success, "null", null, undefined],
        [
          CaseType.Success,
          "valid parent object",
          {
            id: getMockId(1),
            UUID: randomUUID(),
            preferredLabel: getTestString(SkillAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
            objectType: SkillEnums.Relations.Parents.ObjectTypes.Skill,
          },
          undefined,
        ],
        [
          CaseType.Success,
          "valid parent group object",
          {
            id: getMockId(1),
            UUID: randomUUID(),
            code: getTestSkillGroupCode(),
            preferredLabel: getTestString(SkillAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
            objectType: SkillEnums.Relations.Parents.ObjectTypes.SkillGroup,
          },
          undefined,
        ],
        [
          CaseType.Failure,
          "invalid parent object (missing preferredLabel)",
          {
            id: getMockId(1),
            UUID: randomUUID(),
            objectType: SkillEnums.Relations.Parents.ObjectTypes.Skill,
          },
          constructSchemaError("/parent", "required", "must have required property 'preferredLabel'"),
        ],
      ])("(%s) Validate 'parent' when it is %s", (caseType, _description, givenValue, failureMessages) => {
        // GIVEN an object with the given value
        const givenObject = {
          parent: givenValue,
        };
        // THEN expect the object to validate accordingly
        assertCaseForProperty(
          "parent",
          givenObject,
          SkillAPISpecs.Schemas.GET.Response.ById.Payload,
          caseType,
          failureMessages
        );
      });
    });

    describe("Test validation of 'children'", () => {
      test.each([
        [
          CaseType.Failure,
          "undefined",
          undefined,
          constructSchemaError("", "required", "must have required property 'children'"),
        ],
        [CaseType.Failure, "null", null, constructSchemaError("/children", "type", "must be array")],
        [
          CaseType.Success,
          "valid children object array",
          [
            {
              id: getMockId(1),
              UUID: randomUUID(),
              preferredLabel: getTestString(SkillAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
              objectType: SkillEnums.Relations.Children.ObjectTypes.Skill,
              isLocalized: true,
            },
          ],
          undefined,
        ],
      ])("(%s) Validate 'children' when it is %s", (caseType, _description, givenValue, failureMessages) => {
        // GIVEN an object with the given value
        const givenObject = {
          children: givenValue,
        };
        // THEN expect the object to validate accordingly
        assertCaseForProperty(
          "children",
          givenObject,
          SkillAPISpecs.Schemas.GET.Response.ById.Payload,
          caseType,
          failureMessages
        );
      });
    });
  });
});
