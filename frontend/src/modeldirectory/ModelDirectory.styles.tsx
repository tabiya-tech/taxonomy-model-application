import { styled } from '@mui/material/styles';

export const ModelDirectoryContainer = styled('div')`
  flex: 1;
  overflow-y: auto;
  .model-table-container{
    background-color: ${({ theme }) => theme.palette.background.paper};
    border-radius: 16px 16px 0 0;
    padding: 24px 24px 0 24px;
  }
`;

export const ModelDirectoryContent = styled('div');
