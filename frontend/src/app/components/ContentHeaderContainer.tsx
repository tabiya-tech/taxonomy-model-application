import { useAppLayout } from '../AppLayoutProvider';
import { Box } from '@mui/material';

const ContentHeaderContainer = () => {
  const { contentHeader } = useAppLayout();
  return<Box padding={2}>{contentHeader}</Box>;
};

export default ContentHeaderContainer;
