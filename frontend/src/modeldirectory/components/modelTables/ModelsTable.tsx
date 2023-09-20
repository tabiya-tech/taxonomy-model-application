import * as React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import {ModelInfoTypes} from "src/modelInfo/modelInfoTypes";
import TableLoadingRows from "../tableLoadingRows/TableLoadingRows";
import PublishedWithChangesIcon from '@mui/icons-material/PublishedWithChanges';
import {Container} from "@mui/material";
import ImportProcessStateIcon from "../importProcessStateIcon/ImportProcessStateIcon";
interface ModelsTableProps {
  models: ModelInfoTypes.ModelInfo[],
  isLoading?: boolean
}

const uniqueId = "ae03cd11-e992-4313-9a9e-49f497cc92d0";

export const TEXT = {
  TABLE_HEADER_LABEL_NAME: "Name",
  TABLE_HEADER_LABEL_LOCALE: "Locale",
  TABLE_HEADER_LABEL_VERSION: "Version",
  TABLE_HEADER_LABEL_RELEASED: "Released",
  TABLE_HEADER_LABEL_DESCRIPTION: "Description",
  TABLE_HEADER_LABEL_STATUS: ""
}

export const DATA_TEST_ID = {
  MODELS_TABLE_ID: `models-table-${uniqueId}`,
  MODELS_LOADER: `models-loader-${uniqueId}`,
  MODEL_TABLE_HEADER_ROW: `model-table-header-row-${uniqueId}`,
  MODEL_TABLE_DATA_ROW: `model-table-row-${uniqueId}`,
  MODEL_CELL: `model-cell-${uniqueId}`,
  MODEL_CELL_RELEASED_ICON: `model-cell-released-icon-${uniqueId}`,
  MODEL_CELL_STATUS_ICON_CONTAINER: `model-cell-status-icon-container-${uniqueId}`,
}

export const CELL_MAX_LENGTH = 256;
const ModelsTable = (props: ModelsTableProps) => {

  return (
      <TableContainer data-testid={DATA_TEST_ID.MODELS_TABLE_ID} sx={{borderRadius:"10px 10px 0 0"}}>
        <Table tabIndex={0} aria-label="models table">
          <TableHead>
            <TableRow data-testid={DATA_TEST_ID.MODEL_TABLE_HEADER_ROW} sx={{ bgcolor: "#E8E9E3"}}>
              <TableCell variant='body' sx={{fontWeight: "bold"}} data-testid={DATA_TEST_ID.MODEL_CELL}>
                {TEXT.TABLE_HEADER_LABEL_STATUS}
              </TableCell>
              <TableCell sx={{fontWeight: "bold", color: "text.color"}}
                         data-testid={DATA_TEST_ID.MODEL_CELL}>{TEXT.TABLE_HEADER_LABEL_NAME}</TableCell>
              <TableCell sx={{fontWeight: "bold", color: "text.color"}}
                         data-testid={DATA_TEST_ID.MODEL_CELL}>{TEXT.TABLE_HEADER_LABEL_LOCALE}</TableCell>
              <TableCell sx={{fontWeight: "bold", color: "text.color"}}
                         data-testid={DATA_TEST_ID.MODEL_CELL}>{TEXT.TABLE_HEADER_LABEL_VERSION}</TableCell>
              <TableCell sx={{fontWeight: "bold", color: "text.color"}}
                         data-testid={DATA_TEST_ID.MODEL_CELL}>{TEXT.TABLE_HEADER_LABEL_RELEASED}</TableCell>
              <TableCell sx={{fontWeight: "bold", color: "text.color"}}
                         data-testid={DATA_TEST_ID.MODEL_CELL}>{TEXT.TABLE_HEADER_LABEL_DESCRIPTION}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody sx={{bgcolor: "#F9FAF4"}}>
            {props.isLoading ?
                // Number of cols is 6 because we have 6 columns in the table
                <TableLoadingRows numberOfCols={6} numberOfRows={10}/> :
                props.models?.map(model => (
                    <TableRow
                        tabIndex={0}
                        data-modelid={model.id}
                        key={model.id}
                        sx={{'&:last-child td, &:last-child th': {border: 0}}} // remove the last border
                        data-testid={DATA_TEST_ID.MODEL_TABLE_DATA_ROW}
                    >
                      <TableCell data-testid={DATA_TEST_ID.MODEL_CELL}>
                        <Container data-testid={DATA_TEST_ID.MODEL_CELL_STATUS_ICON_CONTAINER}>
                          <ImportProcessStateIcon importProcessState={model.importProcessState}/>
                        </Container>
                      </TableCell>
                      <TableCell component="th" scope="row" data-testid={DATA_TEST_ID.MODEL_CELL} sx={{color: "common.black"}}>
                        {model.name}
                      </TableCell>
                      <TableCell
                          data-testid={DATA_TEST_ID.MODEL_CELL}  sx={{color: "common.black"}}>{model.locale.name} ({model.locale.shortCode})</TableCell>
                      <TableCell data-testid={DATA_TEST_ID.MODEL_CELL}  sx={{color: "common.black"}}>{model.version}</TableCell>
                      <TableCell align="center" data-testid={DATA_TEST_ID.MODEL_CELL}>{model.released ?
                          <PublishedWithChangesIcon data-testid={DATA_TEST_ID.MODEL_CELL_RELEASED_ICON}
                                                    color="disabled" titleAccess="Released"/> : "" /*<IconButton> <PublishIcon color="primary"/> </IconButton>*/}</TableCell>
                      <TableCell data-testid={DATA_TEST_ID.MODEL_CELL}  sx={{color: "common.black"}}>
                        {model.description.length > CELL_MAX_LENGTH ? model.description.substring(0, CELL_MAX_LENGTH) + '...' : model.description}
                      </TableCell>
                    </TableRow>
                ))}
          </TableBody>
        </Table>
      </TableContainer>
  );
};
export default ModelsTable;