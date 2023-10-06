import { Box, Typography } from "@mui/material";

const uniqueId = "37d307ae-4f1e-4d8d-bafe-fd642f8af4ab";

export const DATA_TEST_ID = {
  NOT_FOUND_CONTAINER: `not-found-${uniqueId}}`,
  NOT_FOUND_ILLUSTRATION: `not-found-illustration-${uniqueId}}`,
  NOT_FOUND_MESSAGE: `not-found-message-${uniqueId}`,
};

const NotFound = () => {
  return (
    <Box
      flex={1}
      justifyContent="center"
      alignItems="center"
      flexDirection="column"
      display="flex"
      data-testid={DATA_TEST_ID.NOT_FOUND_CONTAINER}
    >
      <img src="/TabiyaLogo.svg" alt="not found" width="250px" data-testid={DATA_TEST_ID.NOT_FOUND_ILLUSTRATION} />
      <Typography variant="h2" data-testid={DATA_TEST_ID.NOT_FOUND_MESSAGE}>
        404 Error - Page Not Found
      </Typography>
    </Box>
  );
};

export default NotFound;
