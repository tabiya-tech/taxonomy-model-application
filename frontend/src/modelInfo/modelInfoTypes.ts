import ImportProcessStateAPISpecs from "api-specifications/importProcessState";
import ExportProcessStateAPISpecs from "api-specifications/exportProcessState";

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

  export type ExportProcessState = {
    id: string;
    status: ExportProcessStateAPISpecs.Enums.Status;
    result: {
      errored: boolean;
      exportErrors: boolean;
      exportWarnings: boolean;
    };
    downloadUrl: string;
    timestamp: Date;
  };

  export type ModelInfo = {
    id: string;
    UUID: string;
    UUIDHistory: string[];
    released: boolean;
    releaseNotes: string;
    version: string;
    name: string;
    locale: Locale;
    description: string;
    path: string;
    tabiyaPath: string;
    exportProcessState: ExportProcessState[];
    importProcessState: ImportProcessState;
    createdAt: Date;
    updatedAt: Date;
  };
}
