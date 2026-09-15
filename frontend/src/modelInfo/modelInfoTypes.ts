import { ExportProcessStateSchema, ImportProcessStateSchema, ModelInfoResponseSchema } from "src/api-types";

export namespace ModelInfoTypes {
  export type Locale = ModelInfoResponseSchema["locale"];

  export type ImportProcessState = Omit<ImportProcessStateSchema, "createdAt" | "updatedAt"> & {
    createdAt?: Date;
    updatedAt?: Date;
  };

  export type ExportProcessState = Omit<
    ExportProcessStateSchema,
    "downloadUrl" | "timestamp" | "createdAt" | "updatedAt"
  > & {
    downloadUrl: string;
    timestamp: Date;
    createdAt: Date;
    updatedAt: Date;
  };

  export type ModelHistory = ModelInfoResponseSchema["modelHistory"][number];

  export type ModelInfo = {
    id: string;
    UUID: string;
    modelHistory: ModelHistory[];
    released: boolean;
    releaseNotes: string;
    version: string;
    name: string;
    locale: Locale;
    description: string;
    license: string;
    path: string;
    tabiyaPath: string;
    exportProcessState: ExportProcessState[];
    importProcessState: ImportProcessState;
    createdAt: Date;
    updatedAt: Date;
  };
}
