import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

const uniqueId = "4a7b3c2e-1f9d-4e8b-a5c6-7d3e2f1a0b9c";
export const DATA_TEST_ID = {
  OCCUPATIONS_EXPLORER: `occupations-explorer-${uniqueId}`,
};

const OccupationsExplorer = () => {
  return (
    <Box data-testid={DATA_TEST_ID.OCCUPATIONS_EXPLORER}>
      <Typography variant="h4">Occupations Explorer</Typography>
    </Box>
  );
};

export default OccupationsExplorer;
