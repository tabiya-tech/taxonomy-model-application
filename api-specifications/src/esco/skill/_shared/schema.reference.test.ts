import {
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";
import SkillAPISpecs from "esco/skill";
import { getTestString } from "_test_utilities/specialCharacters";
import { getMockId } from "_test_utilities/mockMongoId";
import { randomUUID } from "crypto";

describe("Test SkillReference schema validity", () => {
  testValidSchema("SkillAPISpecs.Schemas.Reference", SkillAPISpecs.Schemas.Reference);
});

describe("Test objects against the SkillAPISpecs.Schemas.Reference schema", () => {
  const givenValidReference = {
    id: getMockId(1),
    UUID: randomUUID(),
    preferredLabel: getTestString(SkillAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
    isLocalized: true,
    objectType: SkillAPISpecs.Enums.ObjectTypes.Skill,
  };

  // WHEN the object is a valid reference
  testSchemaWithValidObject("SkillAPISpecs.Schemas.Reference", SkillAPISpecs.Schemas.Reference, givenValidReference);

  // AND additional properties are not allowed
  testSchemaWithAdditionalProperties(
    "SkillAPISpecs.Schemas.Reference",
    SkillAPISpecs.Schemas.Reference,
    givenValidReference
  );
});
