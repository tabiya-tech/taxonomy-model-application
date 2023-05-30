import React from "react";
import {
  Button, Container
} from '@mui/material';
import ImportModelDialog from "src/import/ImportModelDialog";

const uniqueId = "72be571e-b635-4c15-85c6-897dab60d59f"
export const DATA_TEST_ID = {
  MODEL_DIRECTORY_PAGE: `model-directory-root-${uniqueId}`,
}


const ModelDirectory = () => {
  const [isImportDlgOpen, setImportDlgOpen] = React.useState(false);
  const showImportDialog = (b: boolean) => {
    setImportDlgOpen(b);
  }

  return <Container maxWidth="xl" sx={{
    width: "100%",
    height: "100vh",
    alignItems: 'center',
    justifyContent: 'center',
    display: 'flex'
  }} data-testid={DATA_TEST_ID.MODEL_DIRECTORY_PAGE}>
    <Button onClick={() => showImportDialog(true)} >
      Import Model
    </Button>
    <ImportModelDialog isOpen={isImportDlgOpen} notifyOnClose={() => showImportDialog(false)}/>
  </Container>
};
export default ModelDirectory;
