import ImportProcessStateAPISpecs from "api-specifications/importProcessState";
export namespace ModelInfoTypes {
  export type Locale = {
    UUID: string;
    shortCode: string;
    name: string;
  };

  export type ImportProcessState = {
    id: string;
    status: ImportProcessStateAPISpecs.Enums.Status;
    result: {
      errored: boolean;
      parsingErrors: boolean;
      parsingWarnings: boolean;
    };
  };
  export type ModelInfo = {
    id: string;
    UUID: string;
    previousUUID: string;
    originUUID: string;
    released: boolean;
    releaseNotes: string;
    version: string;
    name: string;
    locale: Locale;
    description: string;
    path: string;
    tabiyaPath: string;
    importProcessState: ImportProcessState;
    createdAt: Date;
    updatedAt: Date;
  };
}
