import * as React from "react";
import { useContext, useState } from "react";
import { alpha, Box, Chip, TextField, Theme, Typography, useTheme } from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import CodeIcon from "@mui/icons-material/Code";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import PublishedWithChangesIcon from "@mui/icons-material/PublishedWithChanges";
import { ModelInfoTypes } from "src/modelInfo/modelInfoTypes";
import { IsOnlineContext } from "src/app/providers";
import ImportProcessStateIcon from "src/modeldirectory/components/ImportProcessStateIcon/ImportProcessStateIcon";
import ExportProcessStateIcon from "src/modeldirectory/components/ExportProcessStateIcon/ExportProcessStateIcon";
import PrimaryButton from "src/theme/PrimaryButton/PrimaryButton";
import ApproveModal from "src/theme/ApproveModal/ApproveModal";
import ExportProcessStateAPISpecs from "api-specifications/exportProcessState";
import ImportProcessStateAPISpecs from "api-specifications/importProcessState";

export interface VersionRowProps {
  model: ModelInfoTypes.ModelInfo;
  isLatest: boolean;
  isModelManager: boolean;
  notifyOnExport: (modelId: string) => void;
  notifyOnShowModelDetails: (modelId: string) => void;
  notifyOnExplore: (modelId: string) => void;
  notifyOnRelease: (modelId: string, releaseNotes?: string) => void;
}

const uniqueId = "5cd41ff1-8fee-4d31-b47e-3b8ab8ce4d33";
export const DATA_TEST_ID = {
  VERSION_ROW: `version-row-${uniqueId}`,
  VERSION_TEXT: `version-text-${uniqueId}`,
  LATEST_CHIP: `latest-chip-${uniqueId}`,
  LOCALE_CHIP: `locale-chip-${uniqueId}`,
  RELEASE_CANDIDATE_CHIP: `release-candidate-chip-${uniqueId}`,
  IMPORT_STATE_ICON_CONTAINER: `import-state-icon-container-${uniqueId}`,
  EXPORT_STATE_ICON_CONTAINER: `export-state-icon-container-${uniqueId}`,
  EXPLORE_BUTTON: `explore-button-${uniqueId}`,
  API_BUTTON: `api-button-${uniqueId}`,
  CSV_BUTTON: `csv-button-${uniqueId}`,
  EXPORT_BUTTON: `export-button-${uniqueId}`,
  SHOW_DETAILS_BUTTON: `show-details-button-${uniqueId}`,
  RELEASE_BUTTON: `release-button-${uniqueId}`,
  RELEASE_NOTES_INPUT: `release-notes-input-${uniqueId}`,
};

export const TEXT = {
  LATEST_CHIP_LABEL: "latest",
  RELEASE_CANDIDATE_CHIP_LABEL: "release candidate",
  EXPLORE_BUTTON_LABEL: "Explore",
  API_BUTTON_LABEL: "API",
  CSV_BUTTON_LABEL: "CSV",
  EXPORT_BUTTON_LABEL: "Export",
  SHOW_DETAILS_BUTTON_LABEL: "Details",
  RELEASE_BUTTON_LABEL: "Release",
  RELEASE_DIALOG_TITLE: "Release a model",
  RELEASE_DIALOG_WARNING:
    "Releasing this model makes it read-only and visible to everyone. This action cannot be undone. Are you sure you want to continue?",
  RELEASE_NOTES_LABEL: "Release notes (optional)",
  RELEASE_DIALOG_CANCEL: "Cancel",
  RELEASE_DIALOG_CONFIRM: "Release",
};

const extractFilename = (url: string): string => {
  return url.substring(url.lastIndexOf("/") + 1);
};

export function isSuccessfulExport(exportProcessState: ModelInfoTypes.ExportProcessState): boolean {
  return (
    exportProcessState &&
    exportProcessState.status === ExportProcessStateAPISpecs.Enums.Status.COMPLETED &&
    !exportProcessState.result.errored &&
    !exportProcessState.result.exportErrors
  );
}

/**
 * Returns the most recent export (by timestamp) regardless of its outcome
 * or null when the model has never been exported.
 */
export function getLatestExport(model: ModelInfoTypes.ModelInfo): ModelInfoTypes.ExportProcessState | null {
  if (model.exportProcessState.length === 0) {
    return null;
  }
  const sortedExportProcessStates = [...model.exportProcessState].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  );
  return sortedExportProcessStates[sortedExportProcessStates.length - 1];
}

/**
 * Returns the most recent successful export that has a download url,
 * or null when the model has never been exported successfully.
 * A failed re-export does not hide a previously downloadable export.
 */
export function getLatestSuccessfulExport(model: ModelInfoTypes.ModelInfo): ModelInfoTypes.ExportProcessState | null {
  const sortedExportProcessStates = [...model.exportProcessState].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  );
  for (let i = sortedExportProcessStates.length - 1; i >= 0; i--) {
    const exportProcessState = sortedExportProcessStates[i];
    if (isSuccessfulExport(exportProcessState) && exportProcessState.downloadUrl) {
      return exportProcessState;
    }
  }
  return null;
}

export function isImportSuccessful(model: ModelInfoTypes.ModelInfo): boolean {
  return (
    model.importProcessState.status === ImportProcessStateAPISpecs.Enums.Status.COMPLETED &&
    !model.importProcessState.result.errored
  );
}

const BUTTON_SX = {
  paddingY: (theme: Theme) => theme.fixedSpacing(theme.tabiyaSpacing.xs),
  paddingX: (theme: Theme) => theme.fixedSpacing(theme.tabiyaSpacing.md),
  fontSize: (theme: Theme) => theme.typography.caption.fontSize,
  borderRadius: (theme: Theme) => theme.tabiyaRounding.xl,
  minWidth: "5rem",
};

const VersionRow = (props: Readonly<VersionRowProps>) => {
  const theme = useTheme();
  const isOnline = useContext(IsOnlineContext);
  const versionLabel = props.model.version || props.model.name;
  const latestSuccessfulExport = getLatestSuccessfulExport(props.model);
  const latestExport = getLatestExport(props.model);

  const [isReleaseDialogOpen, setIsReleaseDialogOpen] = useState(false);
  const [releaseNotes, setReleaseNotes] = useState("");

  const handleOpenReleaseDialog = () => {
    setReleaseNotes("");
    setIsReleaseDialogOpen(true);
  };

  const handleCancelRelease = () => {
    setIsReleaseDialogOpen(false);
  };

  const handleApproveRelease = () => {
    setIsReleaseDialogOpen(false);
    props.notifyOnRelease(props.model.id, releaseNotes.trim() || undefined);
  };

  return (
    <Box
      display="flex"
      flexDirection="row"
      flexWrap="wrap"
      alignItems="center"
      columnGap={theme.fixedSpacing(theme.tabiyaSpacing.md)}
      rowGap={theme.fixedSpacing(theme.tabiyaSpacing.md)}
      paddingY={theme.fixedSpacing(theme.tabiyaSpacing.md)}
      paddingLeft={{ xs: theme.fixedSpacing(theme.tabiyaSpacing.lg), md: theme.fixedSpacing(5.7) }}
      paddingRight={theme.fixedSpacing(theme.tabiyaSpacing.lg)}
      data-testid={DATA_TEST_ID.VERSION_ROW}
    >
      <Box
        display="flex"
        flexDirection="row"
        flexWrap="wrap"
        alignItems="center"
        gap={theme.tabiyaSpacing.sm}
        minWidth={0}
      >
        <Typography
          variant="body2"
          sx={{ fontFamily: '"IBM Plex Mono", monospace', fontWeight: "bold" }}
          data-testid={DATA_TEST_ID.VERSION_TEXT}
        >
          {versionLabel}
        </Typography>
        {props.isLatest && (
          <Chip
            size="small"
            label={TEXT.LATEST_CHIP_LABEL}
            sx={{
              backgroundColor: alpha(theme.palette.success.main, 0.12),
              color: theme.palette.success.dark,
              fontWeight: 500,
              fontSize: theme.typography.caption.fontSize,
            }}
            data-testid={DATA_TEST_ID.LATEST_CHIP}
          />
        )}
        {!props.model.released && (
          <Chip
            size="small"
            label={TEXT.RELEASE_CANDIDATE_CHIP_LABEL}
            sx={{
              backgroundColor: alpha(theme.palette.warning.main, 0.15),
              color: theme.palette.warning.dark,
              fontWeight: 500,
              fontSize: theme.typography.caption.fontSize,
            }}
            data-testid={DATA_TEST_ID.RELEASE_CANDIDATE_CHIP}
          />
        )}
        <Chip
          size="small"
          label={props.model.locale.shortCode}
          sx={{
            backgroundColor: alpha(theme.palette.primary.main, 0.12),
            color: theme.palette.primary.dark,
            fontWeight: 500,
            fontSize: theme.typography.caption.fontSize,
          }}
          data-testid={DATA_TEST_ID.LOCALE_CHIP}
        />
        {props.isModelManager && (
          <Box display="flex" alignItems="center" data-testid={DATA_TEST_ID.IMPORT_STATE_ICON_CONTAINER}>
            <ImportProcessStateIcon importProcessState={props.model.importProcessState} />
          </Box>
        )}
        {props.isModelManager && !latestSuccessfulExport && latestExport && (
          <Box display="flex" alignItems="center" data-testid={DATA_TEST_ID.EXPORT_STATE_ICON_CONTAINER}>
            <ExportProcessStateIcon exportProcessState={latestExport} />
          </Box>
        )}
      </Box>
      <Box
        display="flex"
        flexDirection="row"
        flexWrap="wrap"
        alignItems="center"
        gap={theme.tabiyaSpacing.sm}
        marginLeft="auto"
        flexGrow={1}
        justifyContent="flex-end"
      >
        <PrimaryButton
          size="small"
          sx={{ ...BUTTON_SX, fontWeight: 700 }}
          onClick={() => props.notifyOnExplore(props.model.id)}
          data-testid={DATA_TEST_ID.EXPLORE_BUTTON}
        >
          {TEXT.EXPLORE_BUTTON_LABEL}
        </PrimaryButton>
        <PrimaryButton
          variant="outlined"
          size="small"
          startIcon={<CodeIcon />}
          sx={BUTTON_SX}
          data-testid={DATA_TEST_ID.API_BUTTON}
        >
          {TEXT.API_BUTTON_LABEL}
        </PrimaryButton>
        {latestSuccessfulExport && (
          <PrimaryButton
            variant="outlined"
            size="small"
            startIcon={<FileDownloadIcon />}
            sx={BUTTON_SX}
            href={latestSuccessfulExport.downloadUrl}
            {...({ download: extractFilename(latestSuccessfulExport.downloadUrl) } as object)}
            data-testid={DATA_TEST_ID.CSV_BUTTON}
          >
            {TEXT.CSV_BUTTON_LABEL}
          </PrimaryButton>
        )}
        <PrimaryButton
          variant="outlined"
          size="small"
          startIcon={<DescriptionOutlinedIcon />}
          sx={BUTTON_SX}
          onClick={() => props.notifyOnShowModelDetails(props.model.id)}
          data-testid={DATA_TEST_ID.SHOW_DETAILS_BUTTON}
        >
          {TEXT.SHOW_DETAILS_BUTTON_LABEL}
        </PrimaryButton>
        {props.isModelManager && !latestSuccessfulExport && (
          <PrimaryButton
            size="small"
            startIcon={<CloudDownloadIcon />}
            sx={{ ...BUTTON_SX, fontWeight: 700 }}
            onClick={() => props.notifyOnExport(props.model.id)}
            disabled={!isOnline || !isImportSuccessful(props.model)}
            data-testid={DATA_TEST_ID.EXPORT_BUTTON}
          >
            {TEXT.EXPORT_BUTTON_LABEL}
          </PrimaryButton>
        )}
        {props.isModelManager && !props.model.released && (
          <PrimaryButton
            size="small"
            startIcon={<PublishedWithChangesIcon />}
            sx={{ ...BUTTON_SX, fontWeight: 700 }}
            onClick={handleOpenReleaseDialog}
            disabled={!isOnline}
            data-testid={DATA_TEST_ID.RELEASE_BUTTON}
          >
            {TEXT.RELEASE_BUTTON_LABEL}
          </PrimaryButton>
        )}
      </Box>
      {isReleaseDialogOpen && (
        <ApproveModal
          isOpen={isReleaseDialogOpen}
          title={TEXT.RELEASE_DIALOG_TITLE}
          content={
            <Box display="flex" flexDirection="column" gap={theme.tabiyaSpacing.md}>
              <Typography variant="body1">{TEXT.RELEASE_DIALOG_WARNING}</Typography>
              <TextField
                label={TEXT.RELEASE_NOTES_LABEL}
                multiline
                rows={4}
                fullWidth
                value={releaseNotes}
                onChange={(event) => setReleaseNotes(event.target.value)}
                inputProps={{ "data-testid": DATA_TEST_ID.RELEASE_NOTES_INPUT }}
              />
            </Box>
          }
          cancelButtonText={TEXT.RELEASE_DIALOG_CANCEL}
          approveButtonText={TEXT.RELEASE_DIALOG_CONFIRM}
          onCancel={handleCancelRelease}
          onApprove={handleApproveRelease}
        />
      )}
    </Box>
  );
};

export default VersionRow;
