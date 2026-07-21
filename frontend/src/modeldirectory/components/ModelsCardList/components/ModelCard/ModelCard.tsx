import * as React from "react";
import { Accordion, AccordionDetails, AccordionSummary, Box, Divider, Typography } from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { TaxonomyGroup } from "src/modeldirectory/components/ModelsCardList/groupModelsByLocale";
import ImportProcessStateIcon from "src/modeldirectory/components/ImportProcessStateIcon/ImportProcessStateIcon";
import MarkdownPropertyField from "src/theme/PropertyFieldLayout/MarkdownPropertyField/MarkdownPropertyField";
import VersionRow from "../VersionRow/VersionRow";

export interface ModelCardProps {
  group: TaxonomyGroup;
  isModelManager: boolean;
  notifyOnExport: (modelId: string) => void;
  notifyOnShowModelDetails: (modelId: string) => void;
  notifyOnExplore: (modelId: string) => void;
  notifyOnRelease: (modelId: string, releaseNotes?: string) => void;
}

const uniqueId = "2fb5e5e4-8f4b-486c-b419-a68f207b1bcd";
export const DATA_TEST_ID = {
  MODEL_CARD: `model-card-${uniqueId}`,
  MODEL_CARD_SUMMARY: `model-card-summary-${uniqueId}`,
  MODEL_CARD_STATUS_ICON_CONTAINER: `model-card-status-icon-container-${uniqueId}`,
  MODEL_CARD_TITLE: `model-card-title-${uniqueId}`,
  MODEL_CARD_SUBTITLE: `model-card-subtitle-${uniqueId}`,
  MODEL_CARD_DESCRIPTION: `model-card-description-${uniqueId}`,
  MODEL_CARD_VERSIONS_COUNT: `model-card-versions-count-${uniqueId}`,
  MODEL_CARD_DETAILS: `model-card-details-${uniqueId}`,
};

/**
 * The locale name of the base taxonomy that all localized taxonomies build on.
 * Its card is shown first in the directory.
 */
export const BASE_LOCALE_NAME = "Europe";

/**
 * Some locales should be displayed with a different title/subtitle in the directory,
 * e.g. the base taxonomy has the locale "Europe" but should be shown as "Tabiya ESCO".
 */
export const LOCALE_DISPLAY_OVERRIDES: Record<string, { title: string; subtitle?: string }> = {
  [BASE_LOCALE_NAME]: {
    title: "Tabiya ESCO",
    subtitle: "Global · the foundation all localized taxonomies build on",
  },
};

export function getCardTitle(group: TaxonomyGroup): string {
  return LOCALE_DISPLAY_OVERRIDES[group.locale.name]?.title ?? group.locale.name;
}

export function getCardSubtitle(group: TaxonomyGroup): string {
  if (LOCALE_DISPLAY_OVERRIDES[group.locale.name]?.subtitle) {
    return LOCALE_DISPLAY_OVERRIDES[group.locale.name].subtitle!;
  }
  if (group.models.length > 1) {
    return `Localized for the ${group.locale.name} labour market`;
  }
  return group.latestModel.name;
}

/**
 * When the card is collapsed the description is clamped to a few lines,
 * when it is expanded the full description is shown.
 */
export function getDescriptionStyle(isExpanded: boolean): React.CSSProperties {
  if (isExpanded) {
    return {};
  }
  return {
    overflow: "hidden",
    textOverflow: "ellipsis",
    display: "-webkit-box",
    WebkitLineClamp: 3,
    WebkitBoxOrient: "vertical",
  };
}

export function getVersionsCountText(count: number): string {
  return count === 1 ? "1 version" : `${count} versions`;
}

/**
 * An expandable card for a model (grouped by locale).
 * The collapsed header shows the status, title, subtitle (model name), description and number of versions,
 * the expanded card shows one row per version.
 */
const ModelCard = (props: Readonly<ModelCardProps>) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const latestReleasedModel = props.group.models.find((model) => model.released);
  const summaryId = `model-card-summary-${props.group.locale.UUID}`;
  const detailsId = `model-card-details-${props.group.locale.UUID}`;

  return (
    <Accordion
      disableGutters
      elevation={0}
      expanded={isExpanded}
      onChange={(_event, newExpanded) => setIsExpanded(newExpanded)}
      sx={{
        border: (theme) => `1px solid ${theme.palette.grey[300]}`,
        borderRadius: (theme) => theme.tabiyaRounding.sm,
        overflow: "hidden",
        "&:before": { display: "none" },
      }}
      data-testid={DATA_TEST_ID.MODEL_CARD}
    >
      <AccordionSummary
        expandIcon={<ArrowDropDownIcon sx={{ color: (theme) => theme.palette.text.secondary }} />}
        id={summaryId}
        aria-controls={detailsId}
        sx={(theme) => ({
          flexDirection: "row-reverse",
          gap: theme.fixedSpacing(theme.tabiyaSpacing.sm),
          paddingY: theme.tabiyaSpacing.xl,
          paddingLeft: theme.tabiyaSpacing.md,
          paddingRight: theme.tabiyaSpacing.lg,
          alignItems: "flex-start",
          "& .MuiAccordionSummary-expandIconWrapper": {
            transform: "rotate(-90deg)",
            marginTop: theme.spacing(theme.tabiyaSpacing.xs),
          },
          "& .MuiAccordionSummary-expandIconWrapper.Mui-expanded": {
            transform: "rotate(0deg)",
          },
          "& .MuiAccordionSummary-content": {
            minWidth: 0,
            margin: 0,
          },
        })}
        data-testid={DATA_TEST_ID.MODEL_CARD_SUMMARY}
      >
        <Box
          display="flex"
          flexDirection="row"
          alignItems="flex-start"
          gap={(theme) => theme.tabiyaSpacing.md}
          width="100%"
          minWidth={0}
        >
          <Box
            display="flex"
            alignItems="center"
            paddingTop={(theme) => theme.tabiyaSpacing.xs}
            data-testid={DATA_TEST_ID.MODEL_CARD_STATUS_ICON_CONTAINER}
          >
            <ImportProcessStateIcon importProcessState={props.group.latestModel.importProcessState} />
          </Box>
          <Box display="flex" flexDirection="column" flexGrow={1} minWidth={0} gap={(theme) => theme.tabiyaSpacing.xs}>
            <Typography
              variant="body1"
              sx={{ fontWeight: 700, fontSize: "1.125rem" }}
              data-testid={DATA_TEST_ID.MODEL_CARD_TITLE}
            >
              {getCardTitle(props.group)}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              data-testid={DATA_TEST_ID.MODEL_CARD_SUBTITLE}
            >
              {getCardSubtitle(props.group)}
            </Typography>
            <Box
              marginTop={(theme) => theme.tabiyaSpacing.xs}
              // links in the description should not toggle the accordion when clicked
              onClick={(event) => {
                if ((event.target as HTMLElement).closest("a")) {
                  event.stopPropagation();
                }
              }}
              sx={{ color: (theme) => theme.palette.text.secondary, fontSize: "0.875rem" }}
              data-testid={DATA_TEST_ID.MODEL_CARD_DESCRIPTION}
            >
              <MarkdownPropertyField
                text={props.group.latestModel.description}
                style={getDescriptionStyle(isExpanded)}
              />
            </Box>
          </Box>
          <Typography
            variant="body1"
            color="text.secondary"
            whiteSpace="nowrap"
            data-testid={DATA_TEST_ID.MODEL_CARD_VERSIONS_COUNT}
          >
            {getVersionsCountText(props.group.models.length)}
          </Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ padding: 0 }} data-testid={DATA_TEST_ID.MODEL_CARD_DETAILS}>
        {props.group.models.map((model) => (
          <React.Fragment key={model.id}>
            <Divider />
            <VersionRow
              model={model}
              isLatest={model.id === latestReleasedModel?.id}
              isModelManager={props.isModelManager}
              notifyOnExport={props.notifyOnExport}
              notifyOnShowModelDetails={props.notifyOnShowModelDetails}
              notifyOnExplore={props.notifyOnExplore}
              notifyOnRelease={props.notifyOnRelease}
            />
          </React.Fragment>
        ))}
      </AccordionDetails>
    </Accordion>
  );
};

export default ModelCard;
