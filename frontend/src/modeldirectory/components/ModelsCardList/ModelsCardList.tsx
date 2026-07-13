import * as React from "react";
import { useContext, useMemo } from "react";
import { Box, Skeleton, Typography } from "@mui/material";
import { ModelInfoTypes } from "src/modelInfo/modelInfoTypes";
import { AuthContext } from "src/auth/AuthProvider";
import AuthAPISpecs from "api-specifications/auth";
import { groupModelsByLocale } from "./groupModelsByLocale";
import { getLatestSuccessfulExport } from "./components/VersionRow/VersionRow";
import ModelCard, { BASE_LOCALE_NAME } from "./components/ModelCard/ModelCard";

export interface ModelsCardListProps {
  models: ModelInfoTypes.ModelInfo[];
  isLoading?: boolean;
  notifyOnExport: (modelId: string) => void;
  notifyOnShowModelDetails: (modelId: string) => void;
  notifyOnExplore: (modelId: string) => void;
}

const uniqueId = "d2c56aa9-8c26-42a0-83f0-905e0d63c821";
export const DATA_TEST_ID = {
  MODELS_CARD_LIST: `models-card-list-${uniqueId}`,
  MODELS_LOADER: `models-loader-${uniqueId}`,
  MODELS_EMPTY_MESSAGE: `models-empty-message-${uniqueId}`,
};

export const TEXT = {
  EMPTY_MESSAGE: "There are no taxonomies to show.",
};

/**
 * Model managers can see every model,
 * all other users can only see models that can be downloaded as CSV.
 */
export function filterVisibleModels(
  models: ModelInfoTypes.ModelInfo[],
  isModelManager: boolean
): ModelInfoTypes.ModelInfo[] {
  if (isModelManager) {
    return models;
  }
  return models.filter((model) => getLatestSuccessfulExport(model) !== null);
}

/**
 * Renders the models as expandable cards, one card per taxonomy (locale).
 * Users that are not model managers only see models that can be downloaded as CSV.
 */
const ModelsCardList = (props: Readonly<ModelsCardListProps>) => {
  const { hasRole } = useContext(AuthContext);
  const isModelManager = hasRole(AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER);

  const taxonomyGroups = useMemo(() => {
    const groups = groupModelsByLocale(filterVisibleModels(props.models ?? [], isModelManager));
    // the base taxonomy always comes first, the rest keep their order (newest first)
    return groups.sort(
      (a, b) => Number(b.locale.name === BASE_LOCALE_NAME) - Number(a.locale.name === BASE_LOCALE_NAME)
    );
  }, [props.models, isModelManager]);

  let content: React.ReactNode;
  if (props.isLoading) {
    content = Array.from({ length: 3 }, (_, index) => (
      <Skeleton
        key={index}
        variant="rounded"
        height={160}
        sx={{ borderRadius: (theme) => theme.tabiyaRounding.sm }}
        data-testid={DATA_TEST_ID.MODELS_LOADER}
      />
    ));
  } else if (taxonomyGroups.length === 0) {
    content = (
      <Typography variant="body1" data-testid={DATA_TEST_ID.MODELS_EMPTY_MESSAGE}>
        {TEXT.EMPTY_MESSAGE}
      </Typography>
    );
  } else {
    content = taxonomyGroups.map((group) => (
      <ModelCard
        key={group.locale.UUID}
        group={group}
        isModelManager={isModelManager}
        notifyOnExport={props.notifyOnExport}
        notifyOnShowModelDetails={props.notifyOnShowModelDetails}
        notifyOnExplore={props.notifyOnExplore}
      />
    ));
  }

  return (
    <Box
      display="flex"
      flexDirection="column"
      width="100%"
      gap={(theme) => theme.fixedSpacing(theme.tabiyaSpacing.md)}
      paddingY={(theme) => theme.tabiyaSpacing.xs}
      data-testid={DATA_TEST_ID.MODELS_CARD_LIST}
    >
      {content}
    </Box>
  );
};

export default ModelsCardList;
