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
import OccupationGroupAPISpecs from "../../index";
import OccupationGroupEnums from "../../_shared/enums";
import OccupationGroupConstants from "../../_shared/constants";
import {
  getTestESCOLocalOccupationCode,
  getTestISCOGroupCode,
  getTestLocalGroupCode,
} from "../../../_test_utilities/testUtils";

describe("OccupationGroupAPISpecs.OccupationGroup.PATCH.Schemas.Response.Payload schema", () => {
  testValidSchema(
    "OccupationGroupAPISpecs.OccupationGroup.PATCH.Schemas.Response.Payload",
    OccupationGroupAPISpecs.OccupationGroup.PATCH.Schemas.Response.Payload
  );
});

describe("Test objects against the OccupationGroupAPISpecs.OccupationGroup.PATCH.Schemas.Response.Payload schema", () => {
  const givenParent = {
    id: getMockId(1),
    UUID: randomUUID(),
    code: getTestISCOGroupCode(),
    preferredLabel: getTestString(OccupationGroupConstants.PREFERRED_LABEL_MAX_LENGTH),
    objectType: OccupationGroupEnums.Relations.Parent.ObjectTypes.ISCOGroup,
  };

  const givenChild = {
    id: getMockId(2),
    UUID: randomUUID(),
    code: getTestESCOLocalOccupationCode(),
    preferredLabel: getTestString(OccupationGroupConstants.PREFERRED_LABEL_MAX_LENGTH),
    objectType: OccupationGroupEnums.Relations.Children.ObjectTypes.LocalOccupation,
  };

  const givenValidOccupationGroupPATCHResponse = {
    id: getMockId(1),
    UUID: randomUUID(),
    originUUID: randomUUID(),
    UUIDHistory: [],
    path: "https://path/to/tabiya",
    tabiyaPath: "https://path/to/tabiya",
    groupType: OccupationGroupEnums.ObjectTypes.LocalGroup,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    originUri: "https://foo/bar",
    code: getTestLocalGroupCode(),
    description: getTestString(50),
    preferredLabel: getTestString(20),
    altLabels: [getTestString(15), getTestString(25)],
    modelId: getMockId(1),
    parent: givenParent,
    children: [givenChild],
  };

  testSchemaWithValidObject(
    "OccupationGroupAPISpecs.OccupationGroup.PATCH.Schemas.Response.Payload",
    OccupationGroupAPISpecs.OccupationGroup.PATCH.Schemas.Response.Payload,
    givenValidOccupationGroupPATCHResponse
  );

  testSchemaWithAdditionalProperties(
    "OccupationGroupAPISpecs.OccupationGroup.PATCH.Schemas.Response.Payload",
    OccupationGroupAPISpecs.OccupationGroup.PATCH.Schemas.Response.Payload,
    { ...givenValidOccupationGroupPATCHResponse, extraProperty: "foo" }
  );

  describe("Validate OccupationGroupAPISpecs.OccupationGroup.PATCH.Schemas.Response.Payload fields", () => {
    describe("Test validate of 'id'", () => {
      testObjectIdField("id", OccupationGroupAPISpecs.OccupationGroup.PATCH.Schemas.Response.Payload);
    });

    describe("Test validate of 'UUID'", () => {
      testUUIDField<OccupationGroupAPISpecs.OccupationGroup.PATCH.Types.Response.Payload>(
        "UUID",
        OccupationGroupAPISpecs.OccupationGroup.PATCH.Schemas.Response.Payload
      );
    });

    describe("Test validate of 'originUUID'", () => {
      testUUIDField<OccupationGroupAPISpecs.OccupationGroup.PATCH.Types.Response.Payload>(
        "originUUID",
        OccupationGroupAPISpecs.OccupationGroup.PATCH.Schemas.Response.Payload
      );
    });

    describe("Test validate of 'UUIDHistory'", () => {
      testUUIDArray<OccupationGroupAPISpecs.OccupationGroup.PATCH.Types.Response.Payload>(
        "UUIDHistory",
        OccupationGroupAPISpecs.OccupationGroup.PATCH.Schemas.Response.Payload,
        [],
        true
      );
    });

    describe("Test validation of 'path'", () => {
      testURIField<OccupationGroupAPISpecs.OccupationGroup.PATCH.Types.Response.Payload>(
        "path",
        OccupationGroupConstants.MAX_PATH_URI_LENGTH,
        OccupationGroupAPISpecs.OccupationGroup.PATCH.Schemas.Response.Payload
      );
    });

    describe("Test validation of 'tabiyaPath'", () => {
      testURIField<OccupationGroupAPISpecs.OccupationGroup.PATCH.Types.Response.Payload>(
        "tabiyaPath",
        OccupationGroupConstants.MAX_TABIYA_PATH_LENGTH,
        OccupationGroupAPISpecs.OccupationGroup.PATCH.Schemas.Response.Payload
      );
    });

    describe("Test validation of 'originUri'", () => {
      testNonEmptyURIStringField<OccupationGroupAPISpecs.OccupationGroup.PATCH.Types.Response.Payload>(
        "originUri",
        OccupationGroupConstants.ORIGIN_URI_MAX_LENGTH,
        OccupationGroupAPISpecs.OccupationGroup.PATCH.Schemas.Response.Payload
      );
    });

    describe("Test validation of 'description'", () => {
      testStringField<OccupationGroupAPISpecs.OccupationGroup.PATCH.Types.Response.Payload>(
        "description",
        OccupationGroupConstants.DESCRIPTION_MAX_LENGTH,
        OccupationGroupAPISpecs.OccupationGroup.PATCH.Schemas.Response.Payload
      );
    });

    describe("Test validation of 'preferredLabel'", () => {
      testNonEmptyStringField<OccupationGroupAPISpecs.OccupationGroup.PATCH.Types.Response.Payload>(
        "preferredLabel",
        OccupationGroupConstants.PREFERRED_LABEL_MAX_LENGTH,
        OccupationGroupAPISpecs.OccupationGroup.PATCH.Schemas.Response.Payload
      );
    });

    describe("Test validation of 'modelId'", () => {
      testObjectIdField("modelId", OccupationGroupAPISpecs.OccupationGroup.PATCH.Schemas.Response.Payload);
    });

    describe("Test validation of 'createdAt'", () => {
      testTimestampField<OccupationGroupAPISpecs.OccupationGroup.PATCH.Types.Response.Payload>(
        "createdAt",
        OccupationGroupAPISpecs.OccupationGroup.PATCH.Schemas.Response.Payload
      );
    });

    describe("Test validation of 'updatedAt'", () => {
      testTimestampField<OccupationGroupAPISpecs.OccupationGroup.PATCH.Types.Response.Payload>(
        "updatedAt",
        OccupationGroupAPISpecs.OccupationGroup.PATCH.Schemas.Response.Payload
      );
    });
  });
});
