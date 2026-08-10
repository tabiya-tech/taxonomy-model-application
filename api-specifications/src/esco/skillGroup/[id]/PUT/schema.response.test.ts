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
import { getMockId } from "_test_utilities/mockMongoId";
import { getTestString } from "_test_utilities/specialCharacters";
import SkillGroupAPISpecs from "../../index";
import SkillGroupEnums from "../../_shared/enums";
import SkillGroupConstants from "../../_shared/constants";
import { getTestSkillGroupCode } from "../../../_test_utilities/testUtils";

describe("SkillGroupAPISpecs.SkillGroup.PUT.Schemas.Response.Payload schema", () => {
  testValidSchema(
    "SkillGroupAPISpecs.SkillGroup.PUT.Schemas.Response.Payload",
    SkillGroupAPISpecs.SkillGroup.PUT.Schemas.Response.Payload
  );
});

describe("Test objects against the SkillGroupAPISpecs.SkillGroup.PUT.Schemas.Response.Payload schema", () => {
  const givenParent = {
    id: getMockId(1),
    UUID: randomUUID(),
    code: getTestSkillGroupCode(),
    preferredLabel: getTestString(SkillGroupConstants.PREFERRED_LABEL_MAX_LENGTH),
    objectType: SkillGroupEnums.Relations.Parents.ObjectTypes.SkillGroup,
  };

  const givenChild = {
    id: getMockId(2),
    UUID: randomUUID(),
    preferredLabel: getTestString(SkillGroupConstants.PREFERRED_LABEL_MAX_LENGTH),
    objectType: SkillGroupEnums.Relations.Children.ObjectTypes.Skill,
    isLocalized: true,
  };

  const givenValidSkillGroupPUTResponse = {
    id: getMockId(1),
    UUID: randomUUID(),
    originUUID: randomUUID(),
    UUIDHistory: [],
    path: "https://path/to/tabiya",
    tabiyaPath: "https://path/to/tabiya",
    parents: [givenParent],
    children: [givenChild],
    originUri: "https://foo/bar",
    code: getTestSkillGroupCode(),
    description: getTestString(50),
    scopeNote: getTestString(20),
    preferredLabel: getTestString(20),
    altLabels: [getTestString(15), getTestString(25)],
    modelId: getMockId(1),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  testSchemaWithValidObject(
    "SkillGroupAPISpecs.SkillGroup.PUT.Schemas.Response.Payload",
    SkillGroupAPISpecs.SkillGroup.PUT.Schemas.Response.Payload,
    givenValidSkillGroupPUTResponse
  );

  testSchemaWithAdditionalProperties(
    "SkillGroupAPISpecs.SkillGroup.PUT.Schemas.Response.Payload",
    SkillGroupAPISpecs.SkillGroup.PUT.Schemas.Response.Payload,
    { ...givenValidSkillGroupPUTResponse, extraProperty: "foo" }
  );

  describe("Validate SkillGroupAPISpecs.SkillGroup.PUT.Schemas.Response.Payload fields", () => {
    describe("Test validate of 'id'", () => {
      testObjectIdField("id", SkillGroupAPISpecs.SkillGroup.PUT.Schemas.Response.Payload);
    });

    describe("Test validate of 'UUID'", () => {
      testUUIDField<SkillGroupAPISpecs.SkillGroup.PUT.Types.Response.Payload>(
        "UUID",
        SkillGroupAPISpecs.SkillGroup.PUT.Schemas.Response.Payload
      );
    });

    describe("Test validate of 'originUUID'", () => {
      testUUIDField<SkillGroupAPISpecs.SkillGroup.PUT.Types.Response.Payload>(
        "originUUID",
        SkillGroupAPISpecs.SkillGroup.PUT.Schemas.Response.Payload
      );
    });

    describe("Test validate of 'UUIDHistory'", () => {
      testUUIDArray<SkillGroupAPISpecs.SkillGroup.PUT.Types.Response.Payload>(
        "UUIDHistory",
        SkillGroupAPISpecs.SkillGroup.PUT.Schemas.Response.Payload,
        [],
        true
      );
    });

    describe("Test validation of 'path'", () => {
      testURIField<SkillGroupAPISpecs.SkillGroup.PUT.Types.Response.Payload>(
        "path",
        SkillGroupConstants.MAX_PATH_URI_LENGTH,
        SkillGroupAPISpecs.SkillGroup.PUT.Schemas.Response.Payload
      );
    });

    describe("Test validation of 'tabiyaPath'", () => {
      testURIField<SkillGroupAPISpecs.SkillGroup.PUT.Types.Response.Payload>(
        "tabiyaPath",
        SkillGroupConstants.MAX_TABIYA_PATH_LENGTH,
        SkillGroupAPISpecs.SkillGroup.PUT.Schemas.Response.Payload
      );
    });

    describe("Test validation of 'originUri'", () => {
      testNonEmptyURIStringField<SkillGroupAPISpecs.SkillGroup.PUT.Types.Response.Payload>(
        "originUri",
        SkillGroupConstants.ORIGIN_URI_MAX_LENGTH,
        SkillGroupAPISpecs.SkillGroup.PUT.Schemas.Response.Payload
      );
    });

    describe("Test validation of 'description'", () => {
      testStringField<SkillGroupAPISpecs.SkillGroup.PUT.Types.Response.Payload>(
        "description",
        SkillGroupConstants.DESCRIPTION_MAX_LENGTH,
        SkillGroupAPISpecs.SkillGroup.PUT.Schemas.Response.Payload
      );
    });

    describe("Test validation of 'scopeNote'", () => {
      testStringField<SkillGroupAPISpecs.SkillGroup.PUT.Types.Response.Payload>(
        "scopeNote",
        SkillGroupConstants.MAX_SCOPE_NOTE_LENGTH,
        SkillGroupAPISpecs.SkillGroup.PUT.Schemas.Response.Payload
      );
    });

    describe("Test validation of 'preferredLabel'", () => {
      testNonEmptyStringField<SkillGroupAPISpecs.SkillGroup.PUT.Types.Response.Payload>(
        "preferredLabel",
        SkillGroupConstants.PREFERRED_LABEL_MAX_LENGTH,
        SkillGroupAPISpecs.SkillGroup.PUT.Schemas.Response.Payload
      );
    });

    describe("Test validation of 'modelId'", () => {
      testObjectIdField("modelId", SkillGroupAPISpecs.SkillGroup.PUT.Schemas.Response.Payload);
    });

    describe("Test validation of 'createdAt'", () => {
      testTimestampField<SkillGroupAPISpecs.SkillGroup.PUT.Types.Response.Payload>(
        "createdAt",
        SkillGroupAPISpecs.SkillGroup.PUT.Schemas.Response.Payload
      );
    });

    describe("Test validation of 'updatedAt'", () => {
      testTimestampField<SkillGroupAPISpecs.SkillGroup.PUT.Types.Response.Payload>(
        "updatedAt",
        SkillGroupAPISpecs.SkillGroup.PUT.Schemas.Response.Payload
      );
    });
  });
});
