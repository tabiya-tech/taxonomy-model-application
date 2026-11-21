import { randomUUID } from "crypto";
import {
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";
import { getMockId } from "_test_utilities/mockMongoId";
import OccupationGroupEnums from "../../../_shared/enums";
import { getTestString } from "_test_utilities/specialCharacters";
import { assertCaseForProperty, CaseType, constructSchemaError } from "_test_utilities/assertCaseForProperty";
import {
  getTestESCOLocalOccupationCode,
  getTestISCOGroupCode,
  getTestLocalGroupCode,
} from "../../../../_test_utilities/testUtils";
import OccupationGroupConstants from "../../../_shared/constants";
import PUTOccupationGroupParentOperation from "./index";

describe("Test PUTOccupationGroupParentOperation.Schemas.Response.Payload schema validity", () => {
  // WHEN the PUTOccupationGroupParentOperation.Schemas.Response.Payload schema
  // THEN expect the givenSchema to be valid
  testValidSchema(
    "PUTOccupationGroupParentOperation.Schemas.Response.Payload",
    PUTOccupationGroupParentOperation.Schemas.Response.Payload
  );
});

describe("Test objects against the PUTOccupationGroupParentOperation.Schemas.Response.Payload schema", () => {
  // GIVEN a valid parent response payload object
  const givenParent = {
    id: getMockId(1),
    UUID: randomUUID(),
    code: getTestISCOGroupCode(),
    preferredLabel: getTestString(OccupationGroupConstants.PREFERRED_LABEL_MAX_LENGTH),
    objectType: OccupationGroupEnums.Relations.Parent.ObjectTypes.ISCOGroup,
  };

  // GIVEN a valid child response payload object
  const givenChild = {
    id: getMockId(1),
    UUID: randomUUID(),
    code: getTestESCOLocalOccupationCode(),
    preferredLabel: getTestString(OccupationGroupConstants.PREFERRED_LABEL_MAX_LENGTH),
    objectType: OccupationGroupEnums.Relations.Children.ObjectTypes.LocalOccupation,
  };

  // GIVEN a valid response payload object
  const givenValidOccupationGroupResponse = {
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

  // WHEN the object is valid
  // THEN expect the object to validate successfully
  testSchemaWithValidObject(
    "PUTOccupationGroupParentOperation.Schemas.Response.Payload",
    PUTOccupationGroupParentOperation.Schemas.Response.Payload,
    givenValidOccupationGroupResponse
  );

  test("null response", () => {
    assertCaseForProperty(
      "",
      null,
      PUTOccupationGroupParentOperation.Schemas.Response.Payload,
      CaseType.Success,
      undefined
    );
  });

  // AND WHEN the object has additional properties
  // THEN expect the object to not validate
  testSchemaWithAdditionalProperties(
    "PUTOccupationGroupParentOperation.Schemas.Response.Payload",
    PUTOccupationGroupParentOperation.Schemas.Response.Payload,
    { ...givenValidOccupationGroupResponse, extraProperty: "foo" }
  );

  describe("Invalid objects should not match anyOf", () => {
    test("empty object should fail all branches", () => {
      assertCaseForProperty(
        "",
        {},
        PUTOccupationGroupParentOperation.Schemas.Response.Payload,
        CaseType.Failure,
        constructSchemaError("", "anyOf", "must match a schema in anyOf")
      );
    });

    test("string should fail all branches", () => {
      assertCaseForProperty(
        "",
        "invalid",
        PUTOccupationGroupParentOperation.Schemas.Response.Payload,
        CaseType.Failure,
        constructSchemaError("", "anyOf", "must match a schema in anyOf")
      );
    });

    test("number should fail all branches", () => {
      assertCaseForProperty(
        "",
        123,
        PUTOccupationGroupParentOperation.Schemas.Response.Payload,
        CaseType.Failure,
        constructSchemaError("", "anyOf", "must match a schema in anyOf")
      );
    });
  });
});
