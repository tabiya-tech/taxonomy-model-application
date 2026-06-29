import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

const uniqueId = "8c5d2e1f-3a7b-4f9e-b6d0-2e4c8a1f5b3d";
export const DATA_TEST_ID = {
  SKILLS_EXPLORER: `skills-explorer-${uniqueId}`,
};

const SkillsExplorer = () => {
  return (
    <Box data-testid={DATA_TEST_ID.SKILLS_EXPLORER}>
      <Typography variant="h4">Skills Explorer</Typography>
    </Box>
  );
};

export default SkillsExplorer;
