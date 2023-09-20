import {useAppLayout} from '../AppLayoutProvider';
import {Box} from "@mui/material";

const ContentHeaderContainer = () => {
  const {contentHeader} = useAppLayout()
  return <>
    <Box
      sx={{ bgcolor: 'background.default' }}
      padding={2}
    >{contentHeader}
    </Box>
  </>
};

export default ContentHeaderContainer;