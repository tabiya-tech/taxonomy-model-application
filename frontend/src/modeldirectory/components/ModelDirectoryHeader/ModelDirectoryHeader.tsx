import React from 'react';
import AddIcon from '@mui/icons-material/Add';
import {Box, Button, Typography} from '@mui/material';
import styled from '@emotion/styled';

const uniqueId = '8482f1cc-0786-423f-821e-34b6b712d78u';
export const DATA_TEST_ID = {
  MODEL_DIRECTORY_HEADER: `model-directory-header-${uniqueId}`,
  IMPORT_MODEL_BUTTON: `import-model-button-${uniqueId}`,
  MODEL_DIRECTORY_TITLE: `model-directory-title-${uniqueId}`,
};

export interface ModelDirectoryHeaderProps {
  onModelImport: () => void;
}

const StyledButton = styled(Button)`
  border-radius: 6.25rem;
`;

const ModelDirectoryHeader: React.FC<ModelDirectoryHeaderProps> = ({onModelImport}) => (
  <Box display='flex' width='100%' justifyContent='space-between' alignItems='center' data-testid={DATA_TEST_ID.MODEL_DIRECTORY_HEADER}>
    <Typography fontSize='2rem' data-testid={DATA_TEST_ID.MODEL_DIRECTORY_TITLE}>
      Labour Taxonomies
    </Typography>
    <StyledButton
      onClick={()=>onModelImport()}
      data-testid={DATA_TEST_ID.IMPORT_MODEL_BUTTON}
      variant='contained'
      color='primary'
      startIcon={<AddIcon/>}
      disableElevation
    >
      Import Model
    </StyledButton>
  </Box>
);

export default ModelDirectoryHeader;