import * as React from "react";
import { useMemo } from "react";
import { TableCellProps, Typography } from "@mui/material";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import Paper from "@mui/material/Paper";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import { ModelInfoTypes } from "src/modelInfo/modelInfoTypes";
import TableLoadingRows from "src/modeldirectory/components/tableLoadingRows/TableLoadingRows";
import PublishedWithChangesIcon from "@mui/icons-material/PublishedWithChanges";
import ImportProcessStateIcon from "src/modeldirectory/components/importProcessStateIcon/ImportProcessStateIcon";
import { styled } from "@mui/material/styles";

interface ModelsTableProps {
  models: ModelInfoTypes.ModelInfo[];
  isLoading?: boolean;
}

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  "&::-webkit-scrollbar": {
    width: "12px", // Set the width of the scrollbar
  },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: theme.palette.grey["500"], // Set the color of the thumb
    borderRadius: "6px", // Round the corners of the thumb
  },
  "&::-webkit-scrollbar-track": {
    backgroundColor: theme.palette.common.white, // Set the color of the track
  },
}));

const uniqueId = "ae03cd11-e992-4313-9a9e-49f497cc92d0";

export const TEXT = {
  TABLE_HEADER_LABEL_NAME: "Name",
  TABLE_HEADER_LABEL_LOCALE: "Locale",
  TABLE_HEADER_LABEL_VERSION: "Version",
  TABLE_HEADER_LABEL_RELEASED: "Released",
  TABLE_HEADER_LABEL_DESCRIPTION: "Description",
  TABLE_HEADER_LABEL_STATUS: "",
};

export const DATA_TEST_ID = {
  MODELS_TABLE_ID: `models-table-${uniqueId}`,
  MODELS_LOADER: `models-loader-${uniqueId}`,
  MODEL_TABLE_HEADER_ROW: `model-table-header-row-${uniqueId}`,
  MODEL_TABLE_DATA_ROW: `model-table-row-${uniqueId}`,
  MODEL_CELL: `model-cell-${uniqueId}`,
  MODEL_CELL_RELEASED_ICON: `model-cell-released-icon-${uniqueId}`,
  MODEL_CELL_STATUS_ICON_CONTAINER: `model-cell-status-icon-container-${uniqueId}`,
};

const StyledHeaderCell = (props: Readonly<TableCellProps>) => {
  return (
    <TableCell data-testid={DATA_TEST_ID.MODEL_CELL} {...props}>
      <Typography variant="body1" fontWeight={"bold"}>
        {props.children}
      </Typography>
    </TableCell>
  );
};
const StyledBodyCell = (props: Readonly<TableCellProps>) => {
  return (
    <TableCell data-testid={DATA_TEST_ID.MODEL_CELL} {...props}>
      <Typography variant="body1" fontWeight={"normal"}>
        {props.children}
      </Typography>
    </TableCell>
  );
};

export const CELL_MAX_LENGTH = 256;
const ModelsTable = (props: Readonly<ModelsTableProps>) => {
  const sortModels = (models: ModelInfoTypes.ModelInfo[]): ModelInfoTypes.ModelInfo[] => {
    if (!models?.length) return [];
    // sorts the incoming in descending order of createdAt
    return models.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  };

  const sortedModels = useMemo((): ModelInfoTypes.ModelInfo[] => {
    return sortModels(props.models);
  }, [props.models]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", height: "100%" }}>
      <Paper elevation={2} sx={{ width: "100%", height: "100%", overflow: "hidden" }}>
        <StyledTableContainer
          data-testid={DATA_TEST_ID.MODELS_TABLE_ID}
          sx={{ borderRadius: (theme) => theme.tabiyaSpacing.sm, position: "relative", maxHeight: "80vh" }}
        >
          <Table tabIndex={0} stickyHeader aria-label="models table">
            <TableHead>
              <TableRow data-testid={DATA_TEST_ID.MODEL_TABLE_HEADER_ROW}>
                <StyledHeaderCell>{TEXT.TABLE_HEADER_LABEL_STATUS}</StyledHeaderCell>
                <StyledHeaderCell>{TEXT.TABLE_HEADER_LABEL_NAME}</StyledHeaderCell>
                <StyledHeaderCell>{TEXT.TABLE_HEADER_LABEL_LOCALE}</StyledHeaderCell>
                <StyledHeaderCell>{TEXT.TABLE_HEADER_LABEL_VERSION}</StyledHeaderCell>
                <StyledHeaderCell>{TEXT.TABLE_HEADER_LABEL_RELEASED}</StyledHeaderCell>
                <StyledHeaderCell>{TEXT.TABLE_HEADER_LABEL_DESCRIPTION}</StyledHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {props.isLoading ? ( // Number of cols is 6 because we have 6 columns in the table
                <TableLoadingRows numberOfCols={6} numberOfRows={10} />
              ) : (
                sortedModels.map((model) => (
                  <TableRow
                    tabIndex={0}
                    data-modelid={model.id}
                    key={model.id}
                    sx={{ verticalAlign: "top" }}
                    data-testid={DATA_TEST_ID.MODEL_TABLE_DATA_ROW}
                  >
                    <TableCell data-testid={DATA_TEST_ID.MODEL_CELL}>
                      <Container data-testid={DATA_TEST_ID.MODEL_CELL_STATUS_ICON_CONTAINER}>
                        <ImportProcessStateIcon importProcessState={model.importProcessState} />
                      </Container>
                    </TableCell>
                    <StyledBodyCell component="th" scope="row">
                      {model.name}
                    </StyledBodyCell>
                    <StyledBodyCell>
                      {model.locale.name} ({model.locale.shortCode})
                    </StyledBodyCell>
                    <StyledBodyCell>{model.version}</StyledBodyCell>
                    <StyledBodyCell align="center">
                      {
                        model.released ? (
                          <PublishedWithChangesIcon
                            data-testid={DATA_TEST_ID.MODEL_CELL_RELEASED_ICON}
                            color="disabled"
                            titleAccess="Released"
                          />
                        ) : (
                          ""
                        ) /*<IconButton> <PublishIcon color="primary"/> </IconButton>*/
                      }
                    </StyledBodyCell>
                    <StyledBodyCell>
                      {model.description.length > CELL_MAX_LENGTH
                        ? model.description.substring(0, CELL_MAX_LENGTH) + "..."
                        : model.description}
                    </StyledBodyCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </StyledTableContainer>
      </Paper>
    </Box>
  );
};
export default ModelsTable;
