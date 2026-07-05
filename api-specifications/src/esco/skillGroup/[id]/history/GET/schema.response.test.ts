import {
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testArraySchemaFailureWithValidObject,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";
import SkillGroupAPISpecs from "../../../index";
import ModelInfoAPISpecs from "modelInfo";
import { getTestString } from "_test_utilities/specialCharacters";
import { getMockId } from "_test_utilities/mockMongoId";
import { randomUUID } from "crypto";
import { getTestSkillGroupCode } from "../../../../_test_utilities/testUtils";
import SkillGroupEnums from "../../../_shared/enums";

// Each history item is the skill group's reference fields (as it appeared in a model) plus a nested stripped
// `model` (a ModelInfoReference). The model reference's per-field validation is covered centrally in
// modelInfo/schema.reference.test.ts.
describe("Test SkillGroup History Response Schema Validity", () => {
  testValidSchema(
    "SkillGroupAPISpecs.SkillGroup.History.GET.Schemas.Response.Payload",
    SkillGroupAPISpecs.SkillGroup.History.GET.Schemas.Response.Payload,
    [ModelInfoAPISpecs.Schemas.Reference]
  );
});

describe("Test objects against the SkillGroup History Response Schema", () => {
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
    code: getTestSkillGroupCode(),
    preferredLabel: getTestString(SkillGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
    objectType: SkillGroupEnums.Relations.Parents.ObjectTypes.SkillGroup,
    model: givenValidModelReference,
  };

  const givenSecondValidHistoryItem = {
    ...givenValidHistoryItem,
    id: getMockId(3),
    UUID: randomUUID(),
    model: { ...givenValidModelReference, id: getMockId(4), UUID: randomUUID() },
  };

  testSchemaWithValidObject(
    "SkillGroup History Payload (single item)",
    SkillGroupAPISpecs.SkillGroup.History.GET.Schemas.Response.Payload,
    [givenValidHistoryItem],
    [ModelInfoAPISpecs.Schemas.Reference]
  );

  testSchemaWithValidObject(
    "SkillGroup History Payload (multiple items)",
    SkillGroupAPISpecs.SkillGroup.History.GET.Schemas.Response.Payload,
    [givenValidHistoryItem, givenSecondValidHistoryItem],
    [ModelInfoAPISpecs.Schemas.Reference]
  );

  testSchemaWithAdditionalProperties(
    "SkillGroup History Payload",
    SkillGroupAPISpecs.SkillGroup.History.GET.Schemas.Response.Payload,
    [givenValidHistoryItem],
    [ModelInfoAPISpecs.Schemas.Reference]
  );

  testArraySchemaFailureWithValidObject(
    "SkillGroup History Payload",
    SkillGroupAPISpecs.SkillGroup.History.GET.Schemas.Response.Payload,
    givenValidHistoryItem,
    [ModelInfoAPISpecs.Schemas.Reference]
  );
});
