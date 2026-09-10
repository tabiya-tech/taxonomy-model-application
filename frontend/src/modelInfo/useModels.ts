import { useQuery } from "@tanstack/react-query";
import ModelInfoService, { UPDATE_INTERVAL } from "src/modelInfo/modelInfo.service";
import { ModelInfoTypes } from "src/modelInfo/modelInfoTypes";
import ImportProcessStateAPISpecs from "api-specifications/importProcessState";
import ExportProcessStateAPISpecs from "api-specifications/exportProcessState";
import { getApiUrl } from "src/envService";

export const MODELS_QUERY_KEY = ["models"];

const modelInfoService = new ModelInfoService(getApiUrl());

const ACTIVE_STATUSES: Set<string> = new Set([
  ImportProcessStateAPISpecs.Enums.Status.PENDING,
  ImportProcessStateAPISpecs.Enums.Status.RUNNING,
]);

const isActiveStatus = (status: ImportProcessStateAPISpecs.Enums.Status | ExportProcessStateAPISpecs.Enums.Status) =>
  ACTIVE_STATUSES.has(status);

export const hasActiveModelProcess = (models: ModelInfoTypes.ModelInfo[] | undefined): boolean => {
  if (!models) return false;
  return models.some(
    (model) =>
      isActiveStatus(model.importProcessState.status) ||
      model.exportProcessState.some((exportState) => isActiveStatus(exportState.status))
  );
};

export const useModels = (options: { enabled?: boolean } = {}) => {
  return useQuery({
    queryKey: MODELS_QUERY_KEY,
    queryFn: () => modelInfoService.getAllModels(),
    refetchInterval: (query) => (hasActiveModelProcess(query.state.data) ? UPDATE_INTERVAL : false),
    enabled: options.enabled,
  });
};
