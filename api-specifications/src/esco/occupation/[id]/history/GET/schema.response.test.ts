import {
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testArraySchemaFailureWithValidObject,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";
import OccupationAPISpecs from "esco/occupation";
import ModelInfoAPISpecs from "modelInfo";
import { getTestString } from "_test_utilities/specialCharacters";
import { getMockId } from "_test_utilities/mockMongoId";
import { randomUUID } from "crypto";
import { getTestESCOOccupationCode, getTestISCOGroupCode } from "../../../../_test_utilities/testUtils";

// Each history item is the occupation's reference fields (as it appeared in a model) plus a nested stripped
// `model` (a ModelInfoReference). The per-field validation of the model reference is covered centrally in
// modelInfo/schema.reference.test.ts, so this test asserts the history item shape and array concerns.
describe("Test Occupation History Response Schema Validity", () => {
  testValidSchema(
    "OccupationAPISpecs.Detail.history.GET.Schemas.Response.Payload",
    OccupationAPISpecs.Occupation.History.GET.Schemas.Response.Payload,
    [ModelInfoAPISpecs.Schemas.Reference]
  );
});

describe("Test objects against the OccupationAPISpecs.Detail.history.GET.Schemas.Response.Payload schema", () => {
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
    preferredLabel: getTestString(OccupationAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
    occupationGroupCode: getTestISCOGroupCode(),
    code: getTestESCOOccupationCode(),
    occupationType: OccupationAPISpecs.Enums.OccupationType.ESCOOccupation,
    isLocalized: true,
    model: givenValidModelReference,
  };

  const givenSecondValidHistoryItem = {
    ...givenValidHistoryItem,
    id: getMockId(3),
    UUID: randomUUID(),
    model: { ...givenValidModelReference, id: getMockId(4), UUID: randomUUID() },
  };

  testSchemaWithValidObject(
    "OccupationAPISpecs.Detail.history.GET.Schemas.Response.Payload (single item)",
    OccupationAPISpecs.Occupation.History.GET.Schemas.Response.Payload,
    [givenValidHistoryItem],
    [ModelInfoAPISpecs.Schemas.Reference]
  );

  testSchemaWithValidObject(
    "OccupationAPISpecs.Detail.history.GET.Schemas.Response.Payload (multiple items)",
    OccupationAPISpecs.Occupation.History.GET.Schemas.Response.Payload,
    [givenValidHistoryItem, givenSecondValidHistoryItem],
    [ModelInfoAPISpecs.Schemas.Reference]
  );

  testSchemaWithAdditionalProperties(
    "OccupationAPISpecs.Detail.history.GET.Schemas.Response.Payload",
    OccupationAPISpecs.Occupation.History.GET.Schemas.Response.Payload,
    [givenValidHistoryItem],
    [ModelInfoAPISpecs.Schemas.Reference]
  );

  testArraySchemaFailureWithValidObject(
    "OccupationAPISpecs.Detail.history.GET.Schemas.Response.Payload",
    OccupationAPISpecs.Occupation.History.GET.Schemas.Response.Payload,
    givenValidHistoryItem,
    [ModelInfoAPISpecs.Schemas.Reference]
  );
});
