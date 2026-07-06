import {
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";
import OccupationAPISpecs from "esco/occupation";
import { getTestString } from "_test_utilities/specialCharacters";
import { getMockId } from "_test_utilities/mockMongoId";
import { randomUUID } from "crypto";
import { getTestESCOOccupationCode, getTestISCOGroupCode } from "../../_test_utilities/testUtils";

describe("Test OccupationReference schema validity", () => {
  testValidSchema("OccupationAPISpecs.Schemas.Reference", OccupationAPISpecs.Schemas.Reference);
});

describe("Test objects against the OccupationAPISpecs.Schemas.Reference schema", () => {
  const givenValidReference = {
    id: getMockId(1),
    UUID: randomUUID(),
    preferredLabel: getTestString(OccupationAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
    occupationGroupCode: getTestISCOGroupCode(),
    code: getTestESCOOccupationCode(),
    occupationType: OccupationAPISpecs.Enums.OccupationType.ESCOOccupation,
    isLocalized: true,
  };

  // WHEN the object is a valid reference
  testSchemaWithValidObject(
    "OccupationAPISpecs.Schemas.Reference",
    OccupationAPISpecs.Schemas.Reference,
    givenValidReference
  );

  // AND additional properties are not allowed
  testSchemaWithAdditionalProperties(
    "OccupationAPISpecs.Schemas.Reference",
    OccupationAPISpecs.Schemas.Reference,
    givenValidReference
  );
});
