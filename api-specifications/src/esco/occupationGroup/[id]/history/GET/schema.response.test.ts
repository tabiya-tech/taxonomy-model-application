import {
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testArraySchemaFailureWithValidObject,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";
import OccupationGroupAPISpecs from "../../../index";
import ModelInfoAPISpecs from "modelInfo";
import { getTestString } from "_test_utilities/specialCharacters";
import { getMockId } from "_test_utilities/mockMongoId";
import { randomUUID } from "crypto";
import { getTestISCOGroupCode } from "../../../../_test_utilities/testUtils";
import OccupationGroupEnums from "../../../_shared/enums";

// Each history item is the occupation group's reference fields (as it appeared in a model) plus a nested stripped
// `model` (a ModelInfoReference). The model reference's per-field validation is covered centrally in
// modelInfo/schema.reference.test.ts.
describe("Test OccupationGroup History Response Schema Validity", () => {
  testValidSchema(
    "OccupationGroupAPISpecs.OccupationGroup.History.GET.Schemas.Response.Payload",
    OccupationGroupAPISpecs.OccupationGroup.History.GET.Schemas.Response.Payload,
    [ModelInfoAPISpecs.Schemas.Reference]
  );
});

describe("Test objects against the OccupationGroup History Response Schema", () => {
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
    code: getTestISCOGroupCode(),
    preferredLabel: getTestString(OccupationGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
    objectType: OccupationGroupEnums.ObjectTypes.ISCOGroup,
    model: givenValidModelReference,
  };

  const givenSecondValidHistoryItem = {
    ...givenValidHistoryItem,
    id: getMockId(3),
    UUID: randomUUID(),
    model: { ...givenValidModelReference, id: getMockId(4), UUID: randomUUID() },
  };

  testSchemaWithValidObject(
    "OccupationGroup History Payload (single item)",
    OccupationGroupAPISpecs.OccupationGroup.History.GET.Schemas.Response.Payload,
    [givenValidHistoryItem],
    [ModelInfoAPISpecs.Schemas.Reference]
  );

  testSchemaWithValidObject(
    "OccupationGroup History Payload (multiple items)",
    OccupationGroupAPISpecs.OccupationGroup.History.GET.Schemas.Response.Payload,
    [givenValidHistoryItem, givenSecondValidHistoryItem],
    [ModelInfoAPISpecs.Schemas.Reference]
  );

  testSchemaWithAdditionalProperties(
    "OccupationGroup History Payload",
    OccupationGroupAPISpecs.OccupationGroup.History.GET.Schemas.Response.Payload,
    [givenValidHistoryItem],
    [ModelInfoAPISpecs.Schemas.Reference]
  );

  testArraySchemaFailureWithValidObject(
    "OccupationGroup History Payload",
    OccupationGroupAPISpecs.OccupationGroup.History.GET.Schemas.Response.Payload,
    givenValidHistoryItem,
    [ModelInfoAPISpecs.Schemas.Reference]
  );
});
