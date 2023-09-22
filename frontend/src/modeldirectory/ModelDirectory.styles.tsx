import { styled } from '@mui/material/styles';

export const ModelDirectoryContainer = styled('div')`
  background-color: ${({ theme }) => theme.palette.background.paper};
  border-radius: 16px 16px 0 0;
  margin: 0 24px 0 24px;
  padding: 24px 24px 0 24px;
  flex: 1;
  overflow-y: auto;
`;

export const ModelDirectoryContent = styled('div');
