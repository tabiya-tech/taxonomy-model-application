import React, { useEffect, useState } from "react";
import { useNavigate, generatePath } from "react-router-dom";
import { Box, Skeleton, Typography, useTheme } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ModelInfoService from "src/modelInfo/modelInfo.service";
import { ModelInfoTypes } from "src/modelInfo/modelInfoTypes";
import { getApiUrl } from "src/envService";
import { ServiceError } from "src/error/error";
import { writeServiceErrorToLog } from "src/error/logger";
import ContentLayout from "src/theme/ContentLayout/ContentLayout";
import { routerPaths } from "src/app/routerPaths";

const uniqueId = "3f7c1a5b-9e42-4d8f-b6c0-1a2e3f4d5c6b";

export const DATA_TEST_ID = {
  MODEL_SELECTION_PAGE: `model-selection-page-${uniqueId}`,
  MODEL_CARD: `model-selection-page-card-${uniqueId}`,
};

const modelInfoService = new ModelInfoService(getApiUrl());

const ModelSelectionPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [models, setModels] = useState<ModelInfoTypes.ModelInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    modelInfoService
      .getAllModels()
      .then(setModels)
      .catch((e) => {
        if (e instanceof ServiceError) writeServiceErrorToLog(e, console.error);
        else console.error(e);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleModelSelect = (modelId: string) => {
    navigate(generatePath(routerPaths.EXPLORER_OCCUPATIONS, { modelId }));
  };

  const renderContent = () => {
    if (isLoading) {
      return Array.from(new Array(4)).map((_, index) => (
        <Skeleton key={index} variant="rounded" width="100%" height={72} sx={{ borderRadius: "12px" }} />
      ));
    }
    if (models.length === 0) {
      return (
        <Typography variant="body1" color="text.secondary">
          No taxonomies available.
        </Typography>
      );
    }
    return models.map((m) => (
      <Box
        key={m.id}
        data-testid={`${DATA_TEST_ID.MODEL_CARD}-${m.id}`}
        onClick={() => handleModelSelect(m.id)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && handleModelSelect(m.id)}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          px: 2.5,
          py: 1.5,
          border: "1px solid",
          borderColor: "grey.200",
          borderRadius: "12px",
          bgcolor: "common.white",
          cursor: "pointer",
          outline: "none",
          transition: "border-color 0.15s ease, box-shadow 0.15s ease",
          "&:hover": {
            borderColor: "primary.light",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          },
          "&:focus-visible": {
            borderColor: "primary.main",
            boxShadow: "0 0 0 3px rgba(25,118,210,0.2)",
          },
        }}
      >
        <CheckCircleIcon sx={{ color: "success.main", fontSize: 28, flexShrink: 0 }} />
        <Box flex={1} minWidth={0}>
          <Typography variant="body1" fontWeight={600} noWrap>
            {m.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            {m.locale?.name} ({m.locale?.shortCode})
          </Typography>
        </Box>
        {m.version && (
          <Typography variant="body2" color="text.secondary" sx={{ fontFamily: "monospace", flexShrink: 0 }}>
            {m.version}
          </Typography>
        )}
        <ChevronRightIcon sx={{ color: "text.secondary", fontSize: 20, flexShrink: 0 }} />
      </Box>
    ));
  };

  return (
    <Box data-testid={DATA_TEST_ID.MODEL_SELECTION_PAGE} width="100%" height="100%">
      <ContentLayout
        headerComponent={
          <Box>
            <Typography variant="h4" color="text.primary">
              Explore a taxonomy
            </Typography>
            <Typography variant="body1" color="text.secondary" mt={theme.fixedSpacing(theme.tabiyaSpacing.xs)}>
              Select a taxonomy below to browse its occupations and skills.
            </Typography>
          </Box>
        }
        mainComponent={
          <Box
            display="flex"
            flexDirection="column"
            gap={theme.fixedSpacing(theme.tabiyaSpacing.md)}
            maxWidth={900}
            width="100%"
          >
            {renderContent()}
          </Box>
        }
      />
    </Box>
  );
};

export default ModelSelectionPage;
