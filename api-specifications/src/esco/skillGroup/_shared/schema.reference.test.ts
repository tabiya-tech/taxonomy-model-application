import {
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";
import SkillGroupAPISpecs from "esco/skillGroup";
import { getTestString } from "_test_utilities/specialCharacters";
import { getMockId } from "_test_utilities/mockMongoId";
import { randomUUID } from "crypto";
import { getTestSkillGroupCode } from "../../_test_utilities/testUtils";

describe("Test SkillGroupReference schema validity", () => {
  testValidSchema("SkillGroupAPISpecs.Schemas.Reference", SkillGroupAPISpecs.Schemas.Reference);
});

describe("Test objects against the SkillGroupAPISpecs.Schemas.Reference schema", () => {
  const givenValidReference = {
    id: getMockId(1),
    UUID: randomUUID(),
    code: getTestSkillGroupCode(),
    preferredLabel: getTestString(SkillGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
    objectType: SkillGroupAPISpecs.Enums.Relations.Children.ObjectTypes.SkillGroup,
  };

  // WHEN the object is a valid reference
  testSchemaWithValidObject(
    "SkillGroupAPISpecs.Schemas.Reference",
    SkillGroupAPISpecs.Schemas.Reference,
    givenValidReference
  );

  // AND additional properties are not allowed
  testSchemaWithAdditionalProperties(
    "SkillGroupAPISpecs.Schemas.Reference",
    SkillGroupAPISpecs.Schemas.Reference,
    givenValidReference
  );
});
