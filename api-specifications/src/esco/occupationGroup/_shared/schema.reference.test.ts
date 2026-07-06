import {
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";
import OccupationGroupAPISpecs from "esco/occupationGroup";
import { getTestString } from "_test_utilities/specialCharacters";
import { getMockId } from "_test_utilities/mockMongoId";
import { randomUUID } from "crypto";
import { getTestISCOGroupCode } from "../../_test_utilities/testUtils";

describe("Test OccupationGroupReference schema validity", () => {
  testValidSchema("OccupationGroupAPISpecs.Schemas.Reference", OccupationGroupAPISpecs.Schemas.Reference);
});

describe("Test objects against the OccupationGroupAPISpecs.Schemas.Reference schema", () => {
  const givenValidReference = {
    id: getMockId(1),
    UUID: randomUUID(),
    code: getTestISCOGroupCode(),
    preferredLabel: getTestString(OccupationGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
    objectType: OccupationGroupAPISpecs.Enums.ObjectTypes.ISCOGroup,
  };

  // WHEN the object is a valid reference
  testSchemaWithValidObject(
    "OccupationGroupAPISpecs.Schemas.Reference",
    OccupationGroupAPISpecs.Schemas.Reference,
    givenValidReference
  );

  // AND additional properties are not allowed
  testSchemaWithAdditionalProperties(
    "OccupationGroupAPISpecs.Schemas.Reference",
    OccupationGroupAPISpecs.Schemas.Reference,
    givenValidReference
  );
});
