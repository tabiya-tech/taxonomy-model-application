import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

const uniqueId = "3f7c1a5b-9e42-4d8f-b6c0-1a2e3f4d5c6b";
export const DATA_TEST_ID = {
  EXPLORER: `explorer-${uniqueId}`,
};

const Explorer = () => {
  return (
    <Box data-testid={DATA_TEST_ID.EXPLORER}>
      <Typography variant="h4">Explorer</Typography>
    </Box>
  );
};

export default Explorer;
