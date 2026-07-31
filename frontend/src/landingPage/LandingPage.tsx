import { useEffect, useState } from "react";
import { Box, Link, Typography, useTheme } from "@mui/material";
import { useNavigate } from "react-router-dom";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { routerPaths } from "src/app/routerPaths";
import PrimaryButton from "src/theme/PrimaryButton/PrimaryButton";
import AppHeader from "src/app/components/AppHeader";
import Footer from "src/Footer/Footer";
import { getApiUrl, getLandingPageCopy, getLandingPageStats } from "src/envService";
import ModelInfoService from "src/modelInfo/modelInfo.service";
import { ModelInfoTypes } from "src/modelInfo/modelInfoTypes";
import { getLatestSuccessfulExport } from "src/modeldirectory/components/ModelsCardList/components/VersionRow/VersionRow";
import { ServiceError } from "src/error/error";
import { writeServiceErrorToLog } from "src/error/logger";

const uniqueId = "1b6f0b8e-7a2b-4c3b-9a3b-2f6f9b3f4b7a";

export const DATA_TEST_ID = {
  LANDING_PAGE_ROOT: `landing-page-root-${uniqueId}`,
  LANDING_PAGE_NAV: `landing-page-nav-${uniqueId}`,
  LANDING_PAGE_HERO_HEADER: `landing-page-hero-header-${uniqueId}`,
  LANDING_PAGE_EYEBROW: `landing-page-eyebrow-${uniqueId}`,
  LANDING_PAGE_HEADING: `landing-page-heading-${uniqueId}`,
  LANDING_PAGE_DESCRIPTION: `landing-page-description-${uniqueId}`,
  LANDING_PAGE_AUDIENCE: `landing-page-audience-${uniqueId}`,
  LANDING_PAGE_READ_MORE_LINK: `landing-page-read-more-link-${uniqueId}`,
  LANDING_PAGE_START_EXPLORING_BUTTON: `landing-page-start-exploring-button-${uniqueId}`,
  LANDING_PAGE_BROWSE_TAXONOMIES_BUTTON: `landing-page-browse-taxonomies-button-${uniqueId}`,
  LANDING_PAGE_CTA_CAPTION: `landing-page-cta-caption-${uniqueId}`,
  LANDING_PAGE_STATS_SECTION: `landing-page-stats-section-${uniqueId}`,
  LANDING_PAGE_API_BANNER: `landing-page-api-banner-${uniqueId}`,
  LANDING_PAGE_API_BANNER_LINK: `landing-page-api-banner-link-${uniqueId}`,
};

const DEFAULT_STATS = [
  {
    key: "occupations",
    value: "3,000+",
    description: "occupations across the seen and unseen economy",
  },
  {
    key: "skills",
    value: "13,000+",
    description: "skills and competencies, cross-linked to occupations",
  },
  {
    key: "taxonomies",
    value: "4",
    description: "taxonomies: Base (EN·ES), South Africa, Kenya, Zambia",
  },
];

const modelInfoService = new ModelInfoService(getApiUrl());

// a taxonomy shows up in the directory once it is released and has been exported
const isBrowsable = (model: ModelInfoTypes.ModelInfo) => model.released && getLatestSuccessfulExport(model) !== null;

const LandingPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [taxonomyCount, setTaxonomyCount] = useState<number>();

  useEffect(() => {
    modelInfoService
      .getAllModels()
      .then((models) => setTaxonomyCount(models.filter(isBrowsable).length))
      .catch((e) => {
        if (e instanceof ServiceError) writeServiceErrorToLog(e, console.error);
        else console.error(e);
      });
  }, []);

  const landingCopy = getLandingPageCopy();
  const overriddenStats = getLandingPageStats();
  const stats =
    overriddenStats.length > 0
      ? overriddenStats.map((stat, index) => ({ ...stat, key: `stat-${index}` }))
      : DEFAULT_STATS;

  const handleStartExploring = () => {
    navigate(routerPaths.EXPLORER);
  };

  const handleBrowseAllTaxonomies = () => {
    navigate(routerPaths.MODEL_DIRECTORY);
  };

  const handleReadApiDocs = () => {
    navigate(routerPaths.API_DOCS);
  };

  return (
    <Box
      data-testid={DATA_TEST_ID.LANDING_PAGE_ROOT}
      sx={{
        width: "100%",
        height: "100%",
        overflowY: "auto",
        backgroundColor: (theme) => theme.palette.containerBackground.main,
      }}
    >
      <Box
        data-testid={DATA_TEST_ID.LANDING_PAGE_NAV}
        sx={{
          boxSizing: "border-box",
          width: "100%",
          paddingX: (theme) => theme.spacing(theme.tabiyaSpacing.xl),
          paddingY: (theme) => theme.spacing(theme.tabiyaSpacing.xl),
        }}
      >
        <AppHeader />
      </Box>

      <Box
        sx={{
          boxSizing: "border-box",
          maxWidth: "65rem",
          marginX: "auto",
          paddingBottom: (theme) => theme.fixedSpacing(theme.tabiyaSpacing.xl * 2.5),
          paddingX: (theme) => theme.fixedSpacing(theme.tabiyaSpacing.md),
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box
          data-testid={DATA_TEST_ID.LANDING_PAGE_HERO_HEADER}
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: theme.fixedSpacing(theme.tabiyaSpacing.md),
            backgroundColor: (theme) => theme.palette.containerBackground.light,
            borderRadius: (theme) => theme.rounding(theme.tabiyaRounding.lg),
            padding: { xs: theme.fixedSpacing(4), md: theme.fixedSpacing(8) },
          }}
        >
          <Typography
            variant="overline"
            data-testid={DATA_TEST_ID.LANDING_PAGE_EYEBROW}
            sx={{
              fontFamily: "IBM Plex Mono",
              fontWeight: 700,
              color: landingCopy.eyebrow?.color || ((theme) => theme.palette.success.dark),
            }}
          >
            {landingCopy.eyebrow?.text || "Inclusive Livelihoods Taxonomy"}
          </Typography>

          <Typography variant="h1" data-testid={DATA_TEST_ID.LANDING_PAGE_HEADING} sx={{ maxWidth: "42rem" }}>
            {landingCopy.heading || "Every form of work builds skills. We make them visible."}
          </Typography>

          <Typography
            variant="body1"
            data-testid={DATA_TEST_ID.LANDING_PAGE_DESCRIPTION}
            sx={{ maxWidth: "40rem", color: (theme) => theme.palette.text.secondary }}
          >
            {landingCopy.description || (
              <>
                An open taxonomy of occupations and skills covering the{" "}
                <Box component="span" sx={{ fontWeight: 700, color: (theme) => theme.palette.text.primary }}>
                  seen economy
                </Box>{" "}
                of formal work, based on ESCO, and the{" "}
                <Box component="span" sx={{ fontWeight: 700, color: (theme) => theme.palette.text.primary }}>
                  unseen economy
                </Box>{" "}
                of care and informal work, based on ICATUS. Localized for the labour markets where our partners operate.
              </>
            )}
          </Typography>

          <Typography
            variant="body2"
            data-testid={DATA_TEST_ID.LANDING_PAGE_AUDIENCE}
            sx={{ color: (theme) => theme.palette.grey[600] }}
          >
            For partners, researchers, employers and governments.
          </Typography>

          <Link
            href={
              landingCopy.readMoreLink?.url || "https://docs.tabiya.org/our-tech-stack/inclusive-livelihoods-taxonomy"
            }
            target="_blank"
            rel="noopener noreferrer"
            variant="body2"
            data-testid={DATA_TEST_ID.LANDING_PAGE_READ_MORE_LINK}
            sx={{ color: (theme) => theme.palette.secondary.main, fontWeight: 600 }}
          >
            {landingCopy.readMoreLink?.text || "Read what the taxonomy is and how it was conceived"} →
          </Link>

          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              alignItems: { xs: "stretch", sm: "center" },
              justifyContent: "center",
              gap: theme.fixedSpacing(theme.tabiyaSpacing.md),
              marginTop: theme.fixedSpacing(theme.tabiyaSpacing.md),
              width: "100%",
            }}
          >
            <PrimaryButton
              endIcon={<ArrowForwardIcon />}
              onClick={handleStartExploring}
              data-testid={DATA_TEST_ID.LANDING_PAGE_START_EXPLORING_BUTTON}
              style={{ whiteSpace: "nowrap" }}
            >
              Start exploring
            </PrimaryButton>
            <PrimaryButton
              variant="outlined"
              onClick={handleBrowseAllTaxonomies}
              data-testid={DATA_TEST_ID.LANDING_PAGE_BROWSE_TAXONOMIES_BUTTON}
              style={{ whiteSpace: "nowrap" }}
            >
              {taxonomyCount === 1 ? "Browse taxonomies" : "Browse all taxonomies"}
            </PrimaryButton>
          </Box>

          <Typography
            variant="caption"
            data-testid={DATA_TEST_ID.LANDING_PAGE_CTA_CAPTION}
            sx={{ color: (theme) => theme.palette.grey[600] }}
          >
            {landingCopy.ctaCaption ||
              "Start exploring opens the latest Base taxonomy · browse for country versions, CSV download and API access."}
          </Typography>
        </Box>

        <Box
          sx={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            marginTop: theme.fixedSpacing(theme.tabiyaSpacing.lg),
          }}
        >
          <Box
            data-testid={DATA_TEST_ID.LANDING_PAGE_STATS_SECTION}
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
              gap: theme.fixedSpacing(theme.tabiyaSpacing.lg),
            }}
          >
            {stats.map((stat) => (
              <Box
                key={stat.key}
                data-testid={`landing-page-stat-${stat.key}-${uniqueId}`}
                sx={{
                  backgroundColor: (theme) => theme.palette.containerBackground.light,
                  borderRadius: (theme) => theme.rounding(theme.tabiyaRounding.lg),
                  padding: theme.fixedSpacing(theme.tabiyaSpacing.lg),
                }}
              >
                <Typography variant="h3">{stat.value}</Typography>
                <Typography variant="body2" sx={{ color: (theme) => theme.palette.grey[600] }}>
                  {stat.description}
                </Typography>
              </Box>
            ))}
          </Box>

          <Box
            data-testid={DATA_TEST_ID.LANDING_PAGE_API_BANNER}
            sx={{
              backgroundColor: (theme) => theme.palette.containerBackground.light,
              borderRadius: (theme) => theme.rounding(theme.tabiyaRounding.lg),
              paddingX: theme.fixedSpacing(theme.tabiyaSpacing.lg),
              paddingTop: theme.fixedSpacing(theme.tabiyaSpacing.lg),
              paddingBottom: theme.fixedSpacing(theme.tabiyaSpacing.xl),
              marginTop: theme.fixedSpacing(theme.tabiyaSpacing.lg),
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              alignItems: { sm: "center" },
              justifyContent: "space-between",
              gap: theme.fixedSpacing(theme.tabiyaSpacing.sm),
            }}
          >
            <Box>
              <Typography variant="h6">Building on the taxonomy?</Typography>
              <Typography variant="body2" sx={{ color: (theme) => theme.palette.grey[600] }}>
                Every taxonomy offers Explore, API integration and CSV download from the directory.
              </Typography>
            </Box>
            <Link
              component="button"
              type="button"
              onClick={handleReadApiDocs}
              variant="body2"
              data-testid={DATA_TEST_ID.LANDING_PAGE_API_BANNER_LINK}
              sx={{ color: (theme) => theme.palette.secondary.main, fontWeight: 600, whiteSpace: "nowrap" }}
            >
              Read the API docs →
            </Link>
          </Box>
        </Box>
      </Box>

      <Footer />
    </Box>
  );
};

export default LandingPage;
