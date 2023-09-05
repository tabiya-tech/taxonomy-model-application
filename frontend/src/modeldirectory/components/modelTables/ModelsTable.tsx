import * as React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import {ModelDirectoryTypes} from "src/modeldirectory/modelDirectory.types";
import TableLoadingRows from "../tableLoadingRows/TableLoadingRows";
import PublishedWithChangesIcon from '@mui/icons-material/PublishedWithChanges';

interface ModelsTableProps {
  models: ModelDirectoryTypes.ModelInfo[],
  isLoading?: boolean
}

const uniqueId = "ae03cd11-e992-4313-9a9e-49f497cc92d0";

export const TEXT = {
  TABLE_HEADER_LABEL_NAME: "Name",
  TABLE_HEADER_LABEL_LOCALE: "Locale",
  TABLE_HEADER_LABEL_VERSION: "Version",
  TABLE_HEADER_LABEL_RELEASED: "Released",
  TABLE_HEADER_LABEL_DESCRIPTION: "Description",
}

export const DATA_TEST_ID = {
  MODELS_TABLE_ID: `models-table-${uniqueId}`,
  MODEL_TABLE_HEADER_ROW: `model-table-header-row-${uniqueId}`,
  MODEL_TABLE_DATA_ROW: `model-table-row-${uniqueId}`,
  MODEL_CELL: `model-cell-${uniqueId}`,
  MODEL_CELL_ICON: `model-cell-icon-${uniqueId}`,
  MODELS_LOADER: `models-loader-${uniqueId}`
}

export const CELL_MAX_LENGTH = 256;
const ModelsTable = (props: ModelsTableProps) => {
  return (
    <TableContainer component={Paper} data-testid={DATA_TEST_ID.MODELS_TABLE_ID}>
      <Table aria-label="models table">
        <TableHead>
          <TableRow data-testid={DATA_TEST_ID.MODEL_TABLE_HEADER_ROW}>
            <TableCell sx={{fontWeight: "bold"}}
                       data-testid={DATA_TEST_ID.MODEL_CELL}>{TEXT.TABLE_HEADER_LABEL_NAME}</TableCell>
            <TableCell sx={{fontWeight: "bold"}}
                       data-testid={DATA_TEST_ID.MODEL_CELL}>{TEXT.TABLE_HEADER_LABEL_LOCALE}</TableCell>
            <TableCell sx={{fontWeight: "bold"}}
                       data-testid={DATA_TEST_ID.MODEL_CELL}>{TEXT.TABLE_HEADER_LABEL_VERSION}</TableCell>
            <TableCell sx={{fontWeight: "bold"}}
                       data-testid={DATA_TEST_ID.MODEL_CELL}>{TEXT.TABLE_HEADER_LABEL_RELEASED}</TableCell>
            <TableCell sx={{fontWeight: "bold"}}
                       data-testid={DATA_TEST_ID.MODEL_CELL}>{TEXT.TABLE_HEADER_LABEL_DESCRIPTION}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {props.isLoading ?
            <TableLoadingRows numberOfCols={5} numberOfRows={10}/> :
            props.models?.map(model => (
              <TableRow
                tabIndex={0}
                data-modelid={model.id}
                key={model.id}
                sx={{'&:last-child td, &:last-child th': {border: 0}, verticalAlign: 'top'}} // remove the last border and align content on top
                data-testid={DATA_TEST_ID.MODEL_TABLE_DATA_ROW}
              >
                <TableCell component="th" scope="row" data-testid={DATA_TEST_ID.MODEL_CELL}>
                  {model.name}
                </TableCell>
                <TableCell
                  data-testid={DATA_TEST_ID.MODEL_CELL}>{model.locale.name} ({model.locale.shortCode})</TableCell>
                <TableCell data-testid={DATA_TEST_ID.MODEL_CELL}>{model.version}</TableCell>
                <TableCell align="center" data-testid={DATA_TEST_ID.MODEL_CELL}>{model.released ?
                  <PublishedWithChangesIcon data-testid={DATA_TEST_ID.MODEL_CELL_ICON}
                                            color="disabled"/> : "" /*<IconButton> <PublishIcon color="primary"/> </IconButton>*/}</TableCell>
                <TableCell data-testid={DATA_TEST_ID.MODEL_CELL}>
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