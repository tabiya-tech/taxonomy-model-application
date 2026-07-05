import {
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testArraySchemaFailureWithValidObject,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";
import SkillAPISpecs from "../../../index";
import ModelInfoAPISpecs from "modelInfo";
import { getTestString } from "_test_utilities/specialCharacters";
import { getMockId } from "_test_utilities/mockMongoId";
import { randomUUID } from "crypto";
import SkillEnums from "../../../_shared/enums";

// Each history item is the skill's reference fields (as it appeared in a model) plus a nested stripped `model`
// (a ModelInfoReference). The model reference's per-field validation is covered centrally in
// modelInfo/schema.reference.test.ts.
describe("Test Skill History Response Schema Validity", () => {
  testValidSchema(
    "SkillAPISpecs.Skill.History.GET.Schemas.Response.Payload",
    SkillAPISpecs.Skill.History.GET.Schemas.Response.Payload,
    [ModelInfoAPISpecs.Schemas.Reference]
  );
});

describe("Test objects against the Skill History Response Schema", () => {
  const givenValidModelReference = {
    id: getMockId(2),
    UUID: randomUUID(),
    name: getTestString(ModelInfoAPISpecs.Constants.NAME_MAX_LENGTH),
    version: getTestString(ModelInfoAPISpecs.Constants.VERSION_MAX_LENGTH),
    localeShortCode: getTestString(20),
  };

  const givenValidHistoryItem = {
    id: getMockId(1),
    UUID: randomUUID(),
    preferredLabel: getTestString(SkillAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
    isLocalized: true,
    objectType: SkillEnums.ObjectTypes.Skill,
    model: givenValidModelReference,
  };

  const givenSecondValidHistoryItem = {
    ...givenValidHistoryItem,
    id: getMockId(3),
    UUID: randomUUID(),
    model: { ...givenValidModelReference, id: getMockId(4), UUID: randomUUID() },
  };

  testSchemaWithValidObject(
    "Skill History Payload (single item)",
    SkillAPISpecs.Skill.History.GET.Schemas.Response.Payload,
    [givenValidHistoryItem],
    [ModelInfoAPISpecs.Schemas.Reference]
  );

  testSchemaWithValidObject(
    "Skill History Payload (multiple items)",
    SkillAPISpecs.Skill.History.GET.Schemas.Response.Payload,
    [givenValidHistoryItem, givenSecondValidHistoryItem],
    [ModelInfoAPISpecs.Schemas.Reference]
  );

  testSchemaWithAdditionalProperties(
    "Skill History Payload",
    SkillAPISpecs.Skill.History.GET.Schemas.Response.Payload,
    [givenValidHistoryItem],
    [ModelInfoAPISpecs.Schemas.Reference]
  );

  testArraySchemaFailureWithValidObject(
    "Skill History Payload",
    SkillAPISpecs.Skill.History.GET.Schemas.Response.Payload,
    givenValidHistoryItem,
    [ModelInfoAPISpecs.Schemas.Reference]
  );
});
