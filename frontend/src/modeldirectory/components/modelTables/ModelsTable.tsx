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

interface ModelsTableProps {
  models: ModelDirectoryTypes.ModelInfo[],
  isLoading?: boolean
}

const uniqueId = "ae03cd11-e992-4313-9a9e-49f497cc92d0";

export const TEXT = {
  TABLE_HEADER_LABEL_NAME: "Name",
  TABLE_HEADER_LABEL_LOCALE: "Locale",
}

export const DATA_TEST_ID = {
  MODELS_TABLE_ID: `models-table-${uniqueId}`,
  MODEL_TABLE_HEADER_ROW: `model-table-header-row-${uniqueId}`,
  MODEL_TABLE_DATA_ROW: `model-table-row-${uniqueId}`,
  MODEL_CELL: `model-cell-${uniqueId}`,
  MODELS_LOADER: `models-loader-${uniqueId}`
}

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
            </TableRow>
          </TableHead>
          <TableBody>
            {props.isLoading ?
              <TableLoadingRows numberOfCols={2} numberOfRows={10} />:
              props.models?.map(model => (
                <TableRow
                  data-modelid={model.id}
                  key={model.id}
                  sx={{'&:last-child td, &:last-child th': {border: 0}}} // remove the last border
                  data-testid={DATA_TEST_ID.MODEL_TABLE_DATA_ROW}
                >
                  <TableCell component="th" scope="row" data-testid={DATA_TEST_ID.MODEL_CELL}>
                    {model.name}
                  </TableCell>
                  <TableCell data-testid={DATA_TEST_ID.MODEL_CELL}>{model.locale.name}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
    </TableContainer>
  );
};
export default ModelsTable;