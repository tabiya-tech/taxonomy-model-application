import {
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testArraySchemaFailureWithValidObject,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";
import OccupationAPISpecs from "esco/occupation";
import { getTestString } from "_test_utilities/specialCharacters";
import { getMockId } from "_test_utilities/mockMongoId";
import { randomUUID } from "crypto";
import LocaleAPISpecs from "locale";
import ImportProcessState from "importProcessState";
import { ExportProcessState } from "exportProcessState/enums";
import ModelInfoAPISpecs from "modelInfo";

describe("Test Occupation History Response Schema Validity", () => {
  // WHEN the OccupationAPISpecs.Detail.history.GET.Schemas.Response.Payload schema
  // THEN expect the givenSchema to be valid
  testValidSchema(
    "OccupationAPISpecs.Detail.history.GET.Schemas.Response.Payload",
    OccupationAPISpecs.Occupation.History.GET.Schemas.Response.Payload,
    [LocaleAPISpecs.Schemas.Payload]
  );
});

describe("Test objects against the OccupationAPISpecs.Detail.history.GET.Schemas.Response.Payload schema", () => {
  // GIVEN a valid full ModelInfo GET response object (a history item is a full ModelInfo)
  const givenExportProcessState = {
    id: getMockId(2),
    status: ExportProcessState.Enums.Status.PENDING,
    result: {
      errored: false,
      exportErrors: false,
      exportWarnings: false,
    },
    downloadUrl: "https://foo/bar",
    timestamp: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const givenImportProcessState = {
    id: getMockId(1),
    status: ImportProcessState.Enums.Status.PENDING,
    result: {
      errored: false,
      parsingErrors: false,
      parsingWarnings: false,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const givenModelHistory = {
    id: getMockId(1),
    UUID: randomUUID(),
    name: getTestString(ModelInfoAPISpecs.Constants.NAME_MAX_LENGTH),
    version: getTestString(ModelInfoAPISpecs.Constants.VERSION_MAX_LENGTH),
    localeShortCode: getTestString(LocaleAPISpecs.Constants.LOCALE_SHORTCODE_MAX_LENGTH),
  };

  const givenValidHistoryItem = {
    id: getMockId(1),
    UUID: randomUUID(),
    modelHistory: [givenModelHistory],
    path: "https://path/to/tabiya",
    tabiyaPath: "https://path/to/tabiya",
    name: getTestString(ModelInfoAPISpecs.Constants.NAME_MAX_LENGTH),
    description: getTestString(ModelInfoAPISpecs.Constants.NAME_MAX_LENGTH),
    license: getTestString(ModelInfoAPISpecs.Constants.LICENSE_MAX_LENGTH),
    locale: {
      name: getTestString(ModelInfoAPISpecs.Constants.NAME_MAX_LENGTH),
      UUID: randomUUID(),
      shortCode: getTestString(LocaleAPISpecs.Constants.LOCALE_SHORTCODE_MAX_LENGTH),
    },
    releaseNotes: getTestString(ModelInfoAPISpecs.Constants.RELEASE_NOTES_MAX_LENGTH),
    released: false,
    version: getTestString(ModelInfoAPISpecs.Constants.VERSION_MAX_LENGTH),
    exportProcessState: [givenExportProcessState],
    importProcessState: givenImportProcessState,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const givenSecondValidHistoryItem = {
    ...givenValidHistoryItem,
    id: getMockId(2),
    UUID: randomUUID(),
  };

  // WHEN the object is a valid array of one history item
  // THEN expect it to validate successfully
  testSchemaWithValidObject(
    "OccupationAPISpecs.Detail.history.GET.Schemas.Response.Payload (single item)",
    OccupationAPISpecs.Occupation.History.GET.Schemas.Response.Payload,
    [givenValidHistoryItem],
    [LocaleAPISpecs.Schemas.Payload]
  );

  // WHEN the object is a valid array of multiple history items
  // THEN expect it to validate successfully
  testSchemaWithValidObject(
    "OccupationAPISpecs.Detail.history.GET.Schemas.Response.Payload (multiple items)",
    OccupationAPISpecs.Occupation.History.GET.Schemas.Response.Payload,
    [givenValidHistoryItem, givenSecondValidHistoryItem],
    [LocaleAPISpecs.Schemas.Payload]
  );

  // AND WHEN an item has additional properties
  // THEN expect the object to not validate
  testSchemaWithAdditionalProperties(
    "OccupationAPISpecs.Detail.history.GET.Schemas.Response.Payload",
    OccupationAPISpecs.Occupation.History.GET.Schemas.Response.Payload,
    [givenValidHistoryItem],
    [LocaleAPISpecs.Schemas.Payload]
  );

  // AND WHEN the schema is called with an object instead of an array
  // THEN expect the object not to validate
  testArraySchemaFailureWithValidObject(
    "OccupationAPISpecs.Detail.history.GET.Schemas.Response.Payload",
    OccupationAPISpecs.Occupation.History.GET.Schemas.Response.Payload,
    givenValidHistoryItem,
    [LocaleAPISpecs.Schemas.Payload]
  );
});
