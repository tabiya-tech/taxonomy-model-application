import type { components, paths } from "./schema";

export type ModelInfoResponseSchema = components["schemas"]["ModelInfoResponseSchemaGET"][number];
export type ModelInfoRequestSchemaPOST = components["schemas"]["ModelInfoRequestSchemaPOST"];
export type ModelInfoReleaseRequestSchema = components["schemas"]["ModelInfoRequestSchemaPATCH"];
export type LocaleSchema = components["schemas"]["LocaleSchema"];
export type PresignedSchema = components["schemas"]["PresignedSchema"];
export type ErrorResponseSchema = components["schemas"]["ErrorSchema"];
export type InfoResponseSchema = components["schemas"]["InfoSchema"];
export type ImportProcessStateSchema = ModelInfoResponseSchema["importProcessState"];
export type ExportProcessStateSchema = ModelInfoResponseSchema["exportProcessState"][number];
export type ImportProcessStatus = ImportProcessStateSchema["status"];
export type ExportProcessStatus = ExportProcessStateSchema["status"];
export type EmbeddingProcessStatus = ModelInfoResponseSchema["embeddingProcessState"][number]["status"];
export type EmbeddingServiceId = ModelInfoResponseSchema["embeddingProcessState"][number]["embeddingServiceId"];

export const IMPORT_PROCESS_STATUS = {
  PENDING: "pending",
  RUNNING: "running",
  COMPLETED: "completed",
} as const satisfies Record<"PENDING" | "RUNNING" | "COMPLETED", ImportProcessStatus>;

export const EXPORT_PROCESS_STATUS = {
  PENDING: "pending",
  RUNNING: "running",
  COMPLETED: "completed",
} as const satisfies Record<"PENDING" | "RUNNING" | "COMPLETED", ExportProcessStatus>;

export const EMBEDDING_PROCESS_STATUS = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
} as const satisfies Record<"PENDING" | "IN_PROGRESS" | "COMPLETED", EmbeddingProcessStatus>;

export const EMBEDDING_SERVICE_IDS = [
  "77bb8ff3-a6b0-460b-bcaa-00631a907852",
] as const satisfies readonly EmbeddingServiceId[];

export type SkillGroupListItemSchema =
  paths["/models/{modelId}/skillGroups"]["get"]["responses"][200]["content"]["application/json"]["data"][number];
export type OccupationGroupListItemSchema =
  paths["/models/{modelId}/occupationGroups"]["get"]["responses"][200]["content"]["application/json"]["data"][number];

export type SkillSearchResultItemSchema =
  paths["/models/{modelId}/skills"]["get"]["responses"][200]["content"]["application/json"]["data"][number];
export type OccupationSearchResultItemSchema =
  paths["/models/{modelId}/occupations"]["get"]["responses"][200]["content"]["application/json"]["data"][number];

export type SkillGroupDetailResponseSchema =
  paths["/models/{modelId}/skillGroups/{id}"]["get"]["responses"][200]["content"]["application/json"];
export type OccupationGroupDetailResponseSchema =
  paths["/models/{modelId}/occupationGroups/{id}"]["get"]["responses"][200]["content"]["application/json"];
export type SkillDetailResponseSchema =
  paths["/models/{modelId}/skills/{id}"]["get"]["responses"][200]["content"]["application/json"];
export type OccupationDetailResponseSchema =
  paths["/models/{modelId}/occupations/{id}"]["get"]["responses"][200]["content"]["application/json"];

export type SkillGroupHistoryEntrySchema =
  paths["/models/{modelId}/skillGroups/{id}/history"]["get"]["responses"][200]["content"]["application/json"][number];
export type OccupationGroupHistoryEntrySchema =
  paths["/models/{modelId}/occupationGroups/{id}/history"]["get"]["responses"][200]["content"]["application/json"][number];
export type SkillHistoryEntrySchema =
  paths["/models/{modelId}/skills/{id}/history"]["get"]["responses"][200]["content"]["application/json"][number];
export type OccupationHistoryEntrySchema =
  paths["/models/{modelId}/occupations/{id}/history"]["get"]["responses"][200]["content"]["application/json"][number];
