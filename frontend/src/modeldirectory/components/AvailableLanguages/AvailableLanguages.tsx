import * as React from "react";
import { Box, Typography, useTheme } from "@mui/material";
import LanguageIcon from "@mui/icons-material/Language";
import LanguageAPISpecs from "api-specifications/language";

export interface AvailableLanguagesProps {
  availableLanguages: string[];
  // show "Language:" or "Languages:" before the names, which are then emphasized
  showLabel?: boolean;
  "data-testid"?: string;
}

const uniqueId = "ca1f70b2-a487-4d07-b49d-22ce6e282759";
export const DATA_TEST_ID = {
  AVAILABLE_LANGUAGES: `available-languages-${uniqueId}`,
  AVAILABLE_LANGUAGES_ICON: `available-languages-icon-${uniqueId}`,
  AVAILABLE_LANGUAGES_LABEL: `available-languages-label-${uniqueId}`,
  AVAILABLE_LANGUAGES_NAMES: `available-languages-names-${uniqueId}`,
};

export const TEXT = {
  getLanguagesTitle: (count: number) => (count === 1 ? "Language" : "Languages"),
};

/**
 * Resolves the human readable names of languages from the language registry, e.g. "English, French" for ["en", "fr"].
 * @param availableLanguages the short codes of the languages, e.g. ["en", "fr"]
 * @returns the registry names of the languages in the given order, a language that is not in the registry is named by
 * its short code
 */
export function getLanguageNames(availableLanguages: string[]): string {
  return availableLanguages
    .map((shortCode) => LanguageAPISpecs.Helpers.getLanguageByShortCode(shortCode)?.name ?? shortCode)
    .join(", ");
}

/**
 * Shows the names of the languages a model carries data in, next to a language icon, e.g. "🌐 English, French".
 * The names are written out in full, so that they are not confused with the model locale, which is shown by its
 * short code.
 */
const AvailableLanguages = (props: Readonly<AvailableLanguagesProps>) => {
  const theme = useTheme();
  if (props.availableLanguages.length === 0) {
    return null;
  }
  const title = TEXT.getLanguagesTitle(props.availableLanguages.length);

  return (
    <Typography
      component="div"
      variant="body2"
      color="text.primary"
      display="flex"
      alignItems="center"
      gap={theme.tabiyaSpacing.sm}
      minWidth={0}
      data-testid={props["data-testid"] ?? DATA_TEST_ID.AVAILABLE_LANGUAGES}
    >
      <LanguageIcon
        // without a visible label, the icon tells screen readers what the names are
        {...(props.showLabel ? { "aria-hidden": true } : { titleAccess: title })}
        sx={{ fontSize: "1.25em", flexShrink: 0 }}
        data-testid={DATA_TEST_ID.AVAILABLE_LANGUAGES_ICON}
      />
      <span>
        {props.showLabel && (
          <Box
            component="span"
            color="text.secondary"
            marginRight={theme.tabiyaSpacing.sm}
            data-testid={DATA_TEST_ID.AVAILABLE_LANGUAGES_LABEL}
          >
            {`${title}:`}
          </Box>
        )}
        <Box
          component="span"
          fontWeight={props.showLabel ? 700 : undefined}
          data-testid={DATA_TEST_ID.AVAILABLE_LANGUAGES_NAMES}
        >
          {getLanguageNames(props.availableLanguages)}
        </Box>
      </span>
    </Typography>
  );
};

export default AvailableLanguages;
