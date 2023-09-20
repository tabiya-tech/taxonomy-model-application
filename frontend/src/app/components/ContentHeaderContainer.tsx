import { useAppLayout } from '../AppLayoutProvider';
import { Box } from '@mui/material';

const ContentHeaderContainer = () => {
  const { contentHeader } = useAppLayout();
  return<Box padding="0 16px 24px 16px">{contentHeader}</Box>;
};

export default ContentHeaderContainer;
