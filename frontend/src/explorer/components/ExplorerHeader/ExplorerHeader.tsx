import React from "react";
import {
  Box,
  Link,
  ListSubheader,
  MenuItem,
  Select,
  SelectChangeEvent,
  Skeleton,
  Theme,
  Typography,
  useTheme,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CodeIcon from "@mui/icons-material/Code";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import PrimaryButton from "src/theme/PrimaryButton/PrimaryButton";
import { ModelInfoTypes } from "src/modelInfo/modelInfoTypes";

const BUTTON_SX = {
  paddingY: (theme: Theme) => theme.fixedSpacing(theme.tabiyaSpacing.xs),
  paddingX: (theme: Theme) => theme.fixedSpacing(theme.tabiyaSpacing.md),
  fontSize: (theme: Theme) => theme.typography.caption.fontSize,
  borderRadius: (theme: Theme) => theme.tabiyaRounding.xl,
  minWidth: "5rem",
};

const uniqueId = "b1c2d3e4-f5a6-7890-bcde-f01234567890";

export const DATA_TEST_ID = {
  CONTAINER: `explorer-header-container-${uniqueId}`,
  SKELETON: `explorer-header-skeleton-${uniqueId}`,
  MODEL_NAME: `explorer-header-model-name-${uniqueId}`,
  MODEL_SELECT: `explorer-header-model-select-${uniqueId}`,
  NO_MODELS_TEXT: `explorer-header-no-models-text-${uniqueId}`,
  BACK_LINK: `explorer-header-back-link-${uniqueId}`,
  API_BUTTON: `explorer-header-api-button-${uniqueId}`,
  CSV_BUTTON: `explorer-header-csv-button-${uniqueId}`,
};

export const TEXT = {
  BACK_TO_DIRECTORY: "All taxonomies",
  API: "API",
  CSV: "CSV",
};

export interface ExplorerHeaderProps {
  models: ModelInfoTypes.ModelInfo[];
  selectedModel: ModelInfoTypes.ModelInfo | null;
  isLoading: boolean;
  onModelChange: (modelId: string) => void;
  onBackToDirectory: () => void;
  onOpenApiDocs: () => void;
  csvDownloadUrl?: string;
}

const filenameFromUrl = (url: string): string => url.substring(url.lastIndexOf("/") + 1);

const BackToDirectoryLink = ({ onClick }: { onClick: () => void }) => (
  <Link
    component="button"
    type="button"
    onClick={onClick}
    underline="hover"
    variant="body2"
    data-testid={DATA_TEST_ID.BACK_LINK}
    sx={{
      display: "inline-flex",
      alignItems: "center",
      gap: 0.5,
      color: (theme) => theme.palette.text.secondary,
      whiteSpace: "nowrap",
    }}
  >
    <ArrowBackIcon sx={{ fontSize: "1rem" }} />
    {TEXT.BACK_TO_DIRECTORY}
  </Link>
);

const ExplorerHeader = ({
  models,
  selectedModel,
  isLoading,
  onModelChange,
  onBackToDirectory,
  onOpenApiDocs,
  csvDownloadUrl,
}: ExplorerHeaderProps) => {
  const theme = useTheme();

  if (isLoading) {
    return (
      <Box display="flex" alignItems="center" gap={theme.tabiyaSpacing.md} data-testid={DATA_TEST_ID.SKELETON}>
        <Skeleton variant="text" width={340} height={48} />
        <Skeleton variant="rounded" width={120} height={36} sx={{ borderRadius: 1 }} />
      </Box>
    );
  }

  if (!selectedModel) {
    const message = models.length === 0 ? "No Models available" : "Model not found";
    return (
      <Box display="flex" flexDirection="column" gap={theme.tabiyaSpacing.sm} data-testid={DATA_TEST_ID.CONTAINER}>
        <BackToDirectoryLink onClick={onBackToDirectory} />
        <Typography variant="h2" color="text.secondary" data-testid={DATA_TEST_ID.NO_MODELS_TEXT}>
          {message}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="space-between"
      flexWrap="wrap"
      gap={theme.tabiyaSpacing.md}
      data-testid={DATA_TEST_ID.CONTAINER}
    >
      <Box display="flex" alignItems="center" flexWrap="wrap" gap={theme.tabiyaSpacing.md}>
        <BackToDirectoryLink onClick={onBackToDirectory} />
        <Typography variant="h3" data-testid={DATA_TEST_ID.MODEL_NAME} sx={{ maxWidth: 580, wordBreak: "break-word" }}>
          {selectedModel.name}
        </Typography>
        <Select
          value={selectedModel.id}
          onChange={(e: SelectChangeEvent) => onModelChange(e.target.value)}
          size="small"
          renderValue={(selected) => {
            const m = models.find((mod) => mod.id === selected);
            return (
              <Typography
                variant="body2"
                sx={{ fontFamily: m?.version ? "IBM Plex Mono" : "inherit", fontWeight: 600 }}
              >
                {m?.version || m?.name}
              </Typography>
            );
          }}
          inputProps={{ "aria-label": "Select taxonomy version" }}
          data-testid={DATA_TEST_ID.MODEL_SELECT}
          MenuProps={{
            MenuListProps: {
              subheader: (
                <ListSubheader>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ letterSpacing: 1 }}>
                    SWITCH MODEL
                  </Typography>
                </ListSubheader>
              ),
            },
            PaperProps: {
              sx: {
                maxHeight: 400,
                width: 340,
                borderRadius: 2,
                mt: 1,
                boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.1)",
              },
            },
          }}
          sx={{
            borderRadius: 1,
            bgcolor: "common.white",
            "& .MuiOutlinedInput-notchedOutline": { borderColor: "grey.300" },
            "& .MuiSelect-select": { py: 0.75, px: 2 },
          }}
        >
          {models.map((m) => (
            <MenuItem
              key={m.id}
              value={m.id}
              sx={{
                mx: 1,
                mb: 0.5,
                borderRadius: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "stretch",
                "&.Mui-selected": { bgcolor: "grey.100" },
                "&.Mui-selected:hover": { bgcolor: "grey.200" },
              }}
            >
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" width="100%">
                <Typography variant="body2" fontWeight={700} color="text.primary" sx={{ whiteSpace: "normal", pr: 2 }}>
                  {m.name}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontFamily: "IBM Plex Mono", fontWeight: 600, color: "text.primary" }}
                >
                  {m.version}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                {m.locale?.name ?? "Unknown Locale"}
              </Typography>
            </MenuItem>
          ))}
        </Select>
      </Box>

      <Box display="flex" alignItems="center" gap={theme.tabiyaSpacing.sm}>
        <PrimaryButton
          variant="outlined"
          startIcon={<CodeIcon />}
          onClick={onOpenApiDocs}
          data-testid={DATA_TEST_ID.API_BUTTON}
          sx={BUTTON_SX}
        >
          {TEXT.API}
        </PrimaryButton>
        <PrimaryButton
          variant="outlined"
          startIcon={<FileDownloadIcon />}
          href={csvDownloadUrl}
          {...(csvDownloadUrl ? { download: filenameFromUrl(csvDownloadUrl) } : {})}
          disabled={!csvDownloadUrl}
          title={csvDownloadUrl ? "Download the taxonomy as CSV" : "No CSV export is available for this taxonomy yet"}
          data-testid={DATA_TEST_ID.CSV_BUTTON}
          sx={BUTTON_SX}
        >
          {TEXT.CSV}
        </PrimaryButton>
      </Box>
    </Box>
  );
};

export default ExplorerHeader;
