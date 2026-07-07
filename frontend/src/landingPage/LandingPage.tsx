import { Box, Link, Typography, useTheme } from "@mui/material";
import { useNavigate } from "react-router-dom";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { routerPaths } from "src/app/routerPaths";
import PrimaryButton from "src/theme/PrimaryButton/PrimaryButton";
import AppHeader from "src/app/components/AppHeader";

const uniqueId = "1b6f0b8e-7a2b-4c3b-9a3b-2f6f9b3f4b7a";

export const DATA_TEST_ID = {
  LANDING_PAGE_ROOT: `landing-page-root-${uniqueId}`,
  LANDING_PAGE_NAV: `landing-page-nav-${uniqueId}`,
  LANDING_PAGE_HERO_HEADER: `landing-page-hero-header-${uniqueId}`,
  LANDING_PAGE_EYEBROW: `landing-page-eyebrow-${uniqueId}`,
  LANDING_PAGE_HEADING: `landing-page-heading-${uniqueId}`,
  LANDING_PAGE_DESCRIPTION: `landing-page-description-${uniqueId}`,
  LANDING_PAGE_AUDIENCE: `landing-page-audience-${uniqueId}`,
  LANDING_PAGE_CONCEIVED_LINK: `landing-page-conceived-link-${uniqueId}`,
  LANDING_PAGE_START_EXPLORING_BUTTON: `landing-page-start-exploring-button-${uniqueId}`,
  LANDING_PAGE_BROWSE_TAXONOMIES_BUTTON: `landing-page-browse-taxonomies-button-${uniqueId}`,
  LANDING_PAGE_CTA_CAPTION: `landing-page-cta-caption-${uniqueId}`,
  LANDING_PAGE_STATS_SECTION: `landing-page-stats-section-${uniqueId}`,
  LANDING_PAGE_API_BANNER: `landing-page-api-banner-${uniqueId}`,
  LANDING_PAGE_API_BANNER_LINK: `landing-page-api-banner-link-${uniqueId}`,
};

const STATS = [
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

const LandingPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const handleStartExploring = () => {
    navigate(routerPaths.EXPLORER);
  };

  const handleBrowseAllTaxonomies = () => {
    navigate(routerPaths.MODEL_DIRECTORY);
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
          maxWidth: "64rem",
          marginX: "auto",
          paddingBottom: (theme) => theme.fixedSpacing(theme.tabiyaSpacing.xl * 2.5),
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
            padding: theme.fixedSpacing(8),
          }}
        >
          <Typography
            variant="overline"
            data-testid={DATA_TEST_ID.LANDING_PAGE_EYEBROW}
            sx={{
              fontFamily: "IBM Plex Mono",
              fontWeight: 700,
              color: (theme) => theme.palette.success.dark,
            }}
          >
            Inclusive Livelihoods Taxonomy
          </Typography>

          <Typography variant="h1" data-testid={DATA_TEST_ID.LANDING_PAGE_HEADING} sx={{ maxWidth: "42rem" }}>
            Every form of work builds skills. We make them visible.
          </Typography>

          <Typography
            variant="body1"
            data-testid={DATA_TEST_ID.LANDING_PAGE_DESCRIPTION}
            sx={{ maxWidth: "40rem", color: (theme) => theme.palette.text.secondary }}
          >
            An open taxonomy of occupations and skills covering the{" "}
            <Box component="span" sx={{ fontWeight: 700, color: (theme) => theme.palette.text.primary }}>
              seen economy
            </Box>{" "}
            of formal work, based on ESCO, and the{" "}
            <Box component="span" sx={{ fontWeight: 700, color: (theme) => theme.palette.text.primary }}>
              unseen economy
            </Box>{" "}
            of care and informal work, based on ICATUS. Localized for the labour markets where our partners operate.
          </Typography>

          <Typography
            variant="body2"
            data-testid={DATA_TEST_ID.LANDING_PAGE_AUDIENCE}
            sx={{ color: (theme) => theme.palette.grey[600] }}
          >
            For partners, researchers, employers and governments.
          </Typography>

          <Link
            href="https://docs.tabiya.org/our-tech-stack/inclusive-livelihoods-taxonomy"
            variant="body2"
            data-testid={DATA_TEST_ID.LANDING_PAGE_CONCEIVED_LINK}
            sx={{ color: (theme) => theme.palette.secondary.main, fontWeight: 600 }}
          >
            Read what the taxonomy is and how it was conceived →
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
              Browse all taxonomies
            </PrimaryButton>
          </Box>

          <Typography
            variant="caption"
            data-testid={DATA_TEST_ID.LANDING_PAGE_CTA_CAPTION}
            sx={{ color: (theme) => theme.palette.grey[600] }}
          >
            Start exploring opens the latest Base taxonomy · browse for country versions, CSV download and API access.
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
            {STATS.map((stat) => (
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
              href="#"
              variant="body2"
              data-testid={DATA_TEST_ID.LANDING_PAGE_API_BANNER_LINK}
              sx={{ color: (theme) => theme.palette.secondary.main, fontWeight: 600, whiteSpace: "nowrap" }}
            >
              Read the API docs →
            </Link>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default LandingPage;
