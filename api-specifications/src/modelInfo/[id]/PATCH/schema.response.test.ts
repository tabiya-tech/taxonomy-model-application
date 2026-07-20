import ModelInfoAPISpecs from "../../index";
import LocaleAPISpecs from "locale";
import { getMockId } from "_test_utilities/mockMongoId";
import { randomUUID } from "crypto";
import { getTestString } from "_test_utilities/specialCharacters";
import { ExportProcessState } from "exportProcessState/enums";
import ImportProcessState from "importProcessState";
import EmbeddingsAPISpecs from "embeddings";
import EmbeddingProcessStatesAPISpecs from "../embeddingProcessStates";
import {
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";

// The ModelInfo PATCH Response schema is a deep copy of the shared _baseResponseSchema (identical to the
// POST/GET response schemas), so field-level validation is already covered centrally in
// modelInfo/schemas.base.test.ts. This file only exercises the schema's overall validity.
describe("Test the ModelInfo PATCH Response Schema", () => {
  testValidSchema(
    "ModelInfoAPISpecs.ModelInfo.PATCH.Schemas.Response.Payload",
    ModelInfoAPISpecs.ModelInfo.PATCH.Schemas.Response.Payload,
    [LocaleAPISpecs.Schemas.Payload]
  );
});

describe("Validate JSON against the ModelInfo PATCH Response Schema", () => {
  const givenExportProcessState = {
    id: getMockId(2),
    status: ExportProcessState.Enums.Status.PENDING,
    result: { errored: false, exportErrors: false, exportWarnings: false },
    downloadUrl: "https://foo/bar",
    timestamp: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const givenImportProcessState = {
    id: getMockId(1),
    status: ImportProcessState.Enums.Status.PENDING,
    result: { errored: false, parsingErrors: false, parsingWarnings: false },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const givenEmbeddingProcessState = {
    id: getMockId(3),
    status: EmbeddingProcessStatesAPISpecs.Enums.Status.PENDING,
    embeddingServiceId: EmbeddingsAPISpecs.Constants.EmbeddingServiceIds[0],
    totalDocuments: 10,
    errorCounts: 0,
    warningCounts: 0,
    completedDocuments: 0,
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

  const givenValidModelInfoPATCHResponse = {
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
    released: true,
    version: getTestString(ModelInfoAPISpecs.Constants.VERSION_MAX_LENGTH),
    exportProcessState: [givenExportProcessState],
    importProcessState: givenImportProcessState,
    embeddingProcessState: [givenEmbeddingProcessState],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  testSchemaWithValidObject(
    "ModelInfoAPISpecs.ModelInfo.PATCH.Schemas.Response.Payload",
    ModelInfoAPISpecs.ModelInfo.PATCH.Schemas.Response.Payload,
    givenValidModelInfoPATCHResponse,
    [LocaleAPISpecs.Schemas.Payload]
  );

  testSchemaWithAdditionalProperties(
    "ModelInfoAPISpecs.ModelInfo.PATCH.Schemas.Response.Payload",
    ModelInfoAPISpecs.ModelInfo.PATCH.Schemas.Response.Payload,
    givenValidModelInfoPATCHResponse,
    [LocaleAPISpecs.Schemas.Payload]
  );
});
