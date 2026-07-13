import React from "react";
import { Box, Link, Typography, useTheme } from "@mui/material";
import ContentLayout from "src/theme/ContentLayout/ContentLayout";

const uniqueId = "3c9d4a2e-5f1b-4a8c-9d2e-7b6f1a0c8e4d";

export const DATA_TEST_ID = {
  API_DOCS_PAGE_ROOT: `api-docs-page-root-${uniqueId}`,
  API_DOCS_PAGE_HEADING: `api-docs-page-heading-${uniqueId}`,
  API_DOCS_PAGE_INTRO: `api-docs-page-intro-${uniqueId}`,
  API_DOCS_PAGE_CREDENTIALS_SECTION: `api-docs-page-credentials-section-${uniqueId}`,
  API_DOCS_PAGE_CREDENTIALS_LINK: `api-docs-page-credentials-link-${uniqueId}`,
  API_DOCS_PAGE_API_KEY_SECTION: `api-docs-page-api-key-section-${uniqueId}`,
  API_DOCS_PAGE_API_KEY_CODE: `api-docs-page-api-key-code-${uniqueId}`,
  API_DOCS_PAGE_OAUTH_CODE: `api-docs-page-oauth-code-${uniqueId}`,
  API_DOCS_PAGE_REFERENCE_SECTION: `api-docs-page-reference-section-${uniqueId}`,
  API_DOCS_PAGE_SWAGGER_LINK: `api-docs-page-swagger-link-${uniqueId}`,
  API_DOCS_PAGE_REDOC_LINK: `api-docs-page-redoc-link-${uniqueId}`,
  API_DOCS_PAGE_OPENAPI_LINK: `api-docs-page-openapi-link-${uniqueId}`,
  API_DOCS_PAGE_GUIDE_LINK: `api-docs-page-guide-link-${uniqueId}`,
};

// Inline monospace code chip, e.g. `mdl_base_2f9a` or `/api/partner`.
const InlineCode = ({ children }: Readonly<{ children: React.ReactNode }>) => (
  <Box
    component="span"
    sx={{
      fontFamily: "IBM Plex Mono",
      fontSize: "0.85em",
      backgroundColor: (theme) => theme.palette.grey[200],
      color: (theme) => theme.palette.text.primary,
      paddingX: (theme) => theme.fixedSpacing(theme.tabiyaSpacing.xs),
      paddingY: "0.1em",
      borderRadius: (theme) => theme.rounding(theme.tabiyaRounding.xs),
      whiteSpace: "nowrap",
    }}
  >
    {children}
  </Box>
);

// Dark navy code block for multi-line snippets (e.g. curl examples).
const CodeBlock = ({ children, "data-testid": dataTestId }: Readonly<{ children: string; "data-testid"?: string }>) => (
  <Box
    component="pre"
    data-testid={dataTestId}
    sx={{
      margin: 0,
      fontFamily: "IBM Plex Mono",
      fontSize: (theme) => theme.typography.body2.fontSize,
      backgroundColor: (theme) => theme.palette.primary.main,
      color: (theme) => theme.palette.text.textWhite,
      padding: (theme) => theme.fixedSpacing(theme.tabiyaSpacing.lg),
      borderRadius: (theme) => theme.rounding(theme.tabiyaRounding.md),
      overflowX: "auto",
      whiteSpace: "pre",
    }}
  >
    {children}
  </Box>
);

// Monospace, bold step heading (e.g. "1 · Request credentials").
const StepHeading = ({ children }: Readonly<{ children: React.ReactNode }>) => (
  <Typography variant="body1" fontFamily="IBM Plex Mono" fontWeight="bold" color="primary">
    {children}
  </Typography>
);

// External documentation link — opens in a new tab.
const DocLink = ({
  href,
  "data-testid": dataTestId,
  children,
}: Readonly<{ href: string; "data-testid"?: string; children: React.ReactNode }>) => (
  <Link
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    data-testid={dataTestId}
    sx={{ color: (theme) => theme.palette.secondary.main }}
  >
    {children}
  </Link>
);

const ApiDocsPage = () => {
  const theme = useTheme();

  return (
    <Box data-testid={DATA_TEST_ID.API_DOCS_PAGE_ROOT} width="100%" height="100%">
      <ContentLayout
        headerComponent={
          <Box>
            <Typography variant="h2" color="text.primary" data-testid={DATA_TEST_ID.API_DOCS_PAGE_HEADING}>
              Open Taxonomy Platform API
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              data-testid={DATA_TEST_ID.API_DOCS_PAGE_INTRO}
              mt={theme.fixedSpacing(theme.tabiyaSpacing.sm)}
              sx={{ maxWidth: 860 }}
            >
              Secure access to taxonomy models, occupations, skills and their groups. All requests and responses use
              JSON. Deep links from the directory pre-fill the model. The examples below use{" "}
              <InlineCode>mdl_base_2f9a</InlineCode> (Base (Tabiya ESCO 1.1.1), v2.0.0).
            </Typography>
          </Box>
        }
        mainComponent={
          <Box
            display="flex"
            flexDirection="column"
            gap={theme.fixedSpacing(theme.tabiyaSpacing.lg)}
            maxWidth={860}
            width="100%"
          >
            {/* Step 1 — Request credentials */}
            <Box
              data-testid={DATA_TEST_ID.API_DOCS_PAGE_CREDENTIALS_SECTION}
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: theme.fixedSpacing(theme.tabiyaSpacing.sm),
                border: (theme) => `1px solid ${theme.palette.grey[300]}`,
                borderRadius: (theme) => theme.rounding(theme.tabiyaRounding.md),
                padding: (theme) => theme.fixedSpacing(theme.tabiyaSpacing.lg),
              }}
            >
              <StepHeading>1 · Request credentials</StepHeading>
              <Typography variant="body1" sx={{ color: (theme) => theme.palette.text.secondary }}>
                Access requires an <InlineCode>X-API-Key</InlineCode> or M2M OAuth client credentials, issued by the
                platform administrators.
              </Typography>
              <Link
                href="https://docs.tabiya.org/our-tech-stack/inclusive-livelihoods-taxonomy/open-taxonomy-platform/open-taxonomy-platform-api#credentials-and-authentication"
                variant="body1"
                target="_blank"
                rel="noopener noreferrer"
                data-testid={DATA_TEST_ID.API_DOCS_PAGE_CREDENTIALS_LINK}
                sx={{ color: (theme) => theme.palette.secondary.main, fontWeight: 600 }}
              >
                Request credentials →
              </Link>
            </Box>

            {/* Step 2 — Call the API */}
            <Box
              data-testid={DATA_TEST_ID.API_DOCS_PAGE_API_KEY_SECTION}
              sx={{ display: "flex", flexDirection: "column", gap: theme.fixedSpacing(theme.tabiyaSpacing.lg) }}
            >
              <Box sx={{ display: "flex", flexDirection: "column", gap: theme.fixedSpacing(theme.tabiyaSpacing.sm) }}>
                <StepHeading>
                  2 · Call the API with an API key (path prefix <InlineCode>/api/partner</InlineCode>)
                </StepHeading>
                <CodeBlock data-testid={DATA_TEST_ID.API_DOCS_PAGE_API_KEY_CODE}>
                  {`curl -X GET \\
  https://taxonomy.tabiya.tech/api/partner/info \\
  -H "X-API-Key: YOUR_API_KEY"`}
                </CodeBlock>
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column", gap: theme.fixedSpacing(theme.tabiyaSpacing.sm) }}>
                <StepHeading>
                  or with M2M OAuth 2.0 (path prefix <InlineCode>/api/app</InlineCode>)
                </StepHeading>
                <CodeBlock data-testid={DATA_TEST_ID.API_DOCS_PAGE_OAUTH_CODE}>
                  {`curl -X GET \\
  https://taxonomy.tabiya.tech/api/app/info \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"`}
                </CodeBlock>
              </Box>
            </Box>

            {/* Step 3 — Full endpoint reference */}
            <Box
              data-testid={DATA_TEST_ID.API_DOCS_PAGE_REFERENCE_SECTION}
              sx={{ display: "flex", flexDirection: "column", gap: theme.fixedSpacing(theme.tabiyaSpacing.sm) }}
            >
              <StepHeading>3 · Full endpoint reference</StepHeading>
              <Typography variant="body1" sx={{ color: (theme) => theme.palette.text.secondary }}>
                Browse and live-test every endpoint in the{" "}
                <DocLink
                  href="https://taxonomy.tabiya.tech/api-doc/swagger/"
                  data-testid={DATA_TEST_ID.API_DOCS_PAGE_SWAGGER_LINK}
                >
                  Swagger UI
                </DocLink>{" "}
                or{" "}
                <DocLink
                  href="https://taxonomy.tabiya.tech/api-doc/redoc/"
                  data-testid={DATA_TEST_ID.API_DOCS_PAGE_REDOC_LINK}
                >
                  ReDoc
                </DocLink>
                , or import the{" "}
                <DocLink
                  href="https://taxonomy.tabiya.tech/api-doc/swagger/tabiya-api.json"
                  data-testid={DATA_TEST_ID.API_DOCS_PAGE_OPENAPI_LINK}
                >
                  OpenAPI v3 spec
                </DocLink>{" "}
                directly into Postman or Insomnia. Full guide:{" "}
                <DocLink
                  href="https://docs.tabiya.org/our-tech-stack/inclusive-livelihoods-taxonomy/open-taxonomy-platform/open-taxonomy-platform-api"
                  data-testid={DATA_TEST_ID.API_DOCS_PAGE_GUIDE_LINK}
                >
                  docs.tabiya.org
                </DocLink>
                .
              </Typography>
            </Box>
          </Box>
        }
      />
    </Box>
  );
};

export default ApiDocsPage;
