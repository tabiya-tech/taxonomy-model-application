import { Box, Typography } from "@mui/material";
import { getPartnerLogos } from "src/envService";

const uniqueId = "3e2d9f6a-2c8b-4c3a-9a4a-6b1f8e2d5c7a";
export const DATA_TEST_ID = {
  FOOTER: `footer-${uniqueId}`,
  FOOTER_LABEL: `footer-label-${uniqueId}`,
  FOOTER_LOGO: `footer-logo-${uniqueId}`,
};

const Footer = () => {
  const partnerLogos = getPartnerLogos();

  // There is no default set of partner logos, so when none are configured, the footer isn't shown at all.
  if (partnerLogos.length === 0) {
    return null;
  }

  return (
    <Box
      data-testid={DATA_TEST_ID.FOOTER}
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: (theme) => theme.fixedSpacing(theme.tabiyaSpacing.md),
        marginTop: (theme) => theme.fixedSpacing(theme.tabiyaSpacing.md),
        marginBottom: (theme) => theme.fixedSpacing(theme.tabiyaSpacing.xl),
      }}
    >
      <Typography
        variant="overline"
        data-testid={DATA_TEST_ID.FOOTER_LABEL}
        sx={{ color: (theme) => theme.palette.grey[600], fontWeight: 700, letterSpacing: "0.08em" }}
      >
        Developed in partnership with
      </Typography>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "center",
          gap: (theme) => theme.fixedSpacing(theme.tabiyaSpacing.xl),
        }}
      >
        {partnerLogos.map((logo, index) => (
          <img
            key={`${index}-${logo.src}`}
            src={logo.src}
            alt={logo.alt ?? `Partner logo ${index + 1}`}
            height={logo.height ?? 30}
            width={logo.width}
            data-testid={DATA_TEST_ID.FOOTER_LOGO}
          />
        ))}
      </Box>
    </Box>
  );
};

export default Footer;
